import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  FileText,
  Info,
  Sparkles,
  Stethoscope,
  Target,
  UserPlus,
  X,
  Zap
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { usePatients } from '../hooks/usePatients'
import { useDoctorMatches } from '../hooks/useMatches'
import { createAppointment, subscribeToDoctorAppointments, updateMatchStatus } from '../services/database'
import { createCheckoutSession, getCustomerSubscriptions, createCustomerPortalSession } from '../services/flowgladIntegration'
import { calculateEquityScore } from '../lib/equityEngine'
import { wastedSlotsStats } from '../lib/mockData'
import { DEMO_PATIENTS } from '../services/seedData'
import { useAuth } from '../contexts/AuthContext'
import { Timestamp, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { generateDoctorInsights } from '../services/k2think'

const DoctorDashboard = () => {
  const { patients, loading: patientsLoading, error: patientsError, usingDemo } = usePatients()
  const { userId, userProfile } = useAuth()
  const doctorId = userId || 'doctor_1'
  const { matches, loading: matchesLoading, error: matchesError, refresh: refreshMatches } = useDoctorMatches(doctorId)

  const [expandedAppointment, setExpandedAppointment] = useState(null)
  const [expandedQueuePatient, setExpandedQueuePatient] = useState(null)
  const [doctorAppointments, setDoctorAppointments] = useState([])
  const [slotError, setSlotError] = useState('')
  const [creatingSlot, setCreatingSlot] = useState(false)
  const [incomingPatients, setIncomingPatients] = useState([])
  const [scheduledPatients, setScheduledPatients] = useState([])
  const [newSlot, setNewSlot] = useState({
    date: '',
    time: '',
    specialty: userProfile?.specialty || 'primary_care'
  })
  const [k2Insights, setK2Insights] = useState({})
  const [loadingInsights, setLoadingInsights] = useState({})
  const [selectedPatients, setSelectedPatients] = useState(new Set())
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [activeToast, setActiveToast] = useState(null)
  const [subscriptions, setSubscriptions] = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const prevIncomingRef = useRef([])

  // Register this doctor in Firestore so patients on ANY browser/profile can detect them
  useEffect(() => {
    if (!doctorId || !userProfile?.fullName) return
    const ref = doc(db, 'demoSessions', 'activeDoctor')
    setDoc(ref, {
      doctorId,
      doctorName: userProfile.fullName,
      updatedAt: Timestamp.now()
    }).catch(() => {})
    // Also write localStorage for same-profile fast-path
    const entry = JSON.stringify({ doctorId, doctorName: userProfile.fullName })
    localStorage.setItem('loggedInDoctor', entry)
    localStorage.setItem('activeDemoDoctor', entry)
    return () => {
      deleteDoc(ref).catch(() => {})
      localStorage.removeItem('loggedInDoctor')
      localStorage.removeItem('activeDemoDoctor')
    }
  }, [doctorId, userProfile?.fullName])

  useEffect(() => {
    if (!doctorId) return
    const unsubscribe = subscribeToDoctorAppointments(doctorId, (appointments) => {
      setDoctorAppointments(appointments)
    })
    return () => unsubscribe()
  }, [doctorId])

  // Track which latestPatient we've already notified about
  const lastNotifiedPatientRef = useRef(null)

  // Subscribe to demoSessions/{doctorId} for real-time patient notifications (cross-browser)
  useEffect(() => {
    if (!doctorId) return
    const ref = doc(db, 'demoSessions', doctorId)
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      const latest = data.latestPatient
      if (!latest) return

      // Only fire if this is genuinely new (different from last notified)
      const key = latest.patientId + latest.assignedAt
      if (lastNotifiedPatientRef.current === key) return
      lastNotifiedPatientRef.current = key

      // Add to incomingPatients list
      setIncomingPatients(prev => {
        const alreadyIn = prev.some(p => p.patientId === latest.patientId && p.assignedAt === latest.assignedAt)
        return alreadyIn ? prev : [latest, ...prev]
      })
    }, (err) => console.warn('demoSessions snapshot error:', err))

    return () => unsub()
  }, [doctorId])

  // Poll localStorage for same-browser fallback (demoMatches + demoBookings)
  useEffect(() => {
    const read = () => {
      try {
        const allMatches = JSON.parse(localStorage.getItem('demoMatches') || '[]')
        const mine = allMatches.filter(m => m.doctorId === doctorId)
        if (mine.length > 0) {
          setIncomingPatients(prev => {
            const existing = new Set(prev.map(p => p.patientId + p.assignedAt))
            const newOnes = mine.filter(m => !existing.has(m.patientId + m.assignedAt))
            return newOnes.length > 0 ? [...newOnes, ...prev] : prev
          })
        }
        const allBookings = JSON.parse(localStorage.getItem('demoBookings') || '[]')
        setScheduledPatients(allBookings.filter(b => b.doctorId === doctorId))
      } catch { /* ignore */ }
    }
    read()
    const interval = setInterval(read, 1000)
    return () => clearInterval(interval)
  }, [doctorId])

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Detect new incoming patients and fire notifications
  useEffect(() => {
    const prev = prevIncomingRef.current
    const newPatients = incomingPatients.filter(
      p => !prev.some(pp => pp.patientId === p.patientId && pp.assignedAt === p.assignedAt)
    )

    if (newPatients.length > 0) {
      newPatients.forEach(patient => {
        const priority = patient.priorityTier <= 2 ? '🚨 CRITICAL' : patient.priorityTier === 3 ? '⚠️ URGENT' : '📋 STANDARD'
        const msg = {
          id: `notif_${Date.now()}_${Math.random()}`,
          title: `New Patient Incoming`,
          body: `${patient.patientName} — ${patient.condition}`,
          room: patient.erRoom,
          priority,
          time: new Date().toLocaleTimeString(),
          read: false
        }

        // Browser push notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${priority}: New Patient`, {
            body: `${patient.patientName} • ${patient.condition} • Room ${patient.erRoom}`,
            icon: '/favicon.ico',
            tag: msg.id
          })
        }

        setNotifications(prev => [msg, ...prev].slice(0, 20))
        setUnreadCount(c => c + 1)
        setActiveToast(msg)
        setTimeout(() => setActiveToast(null), 6000)
      })
    }

    prevIncomingRef.current = incomingPatients
  }, [incomingPatients])

  const queueSource = useMemo(() => {
    if (!usingDemo && patients.length > 0) return patients
    return DEMO_PATIENTS
  }, [patients, usingDemo])

  const normalizePatient = (patient, fallbackId) => {
    const waitTimeDays = Number(patient.waitTimeDays ?? patient.waitDays ?? 0)
    const urgencyLevel = Number(patient.urgencyLevel ?? patient.aiUrgencyScore ?? 5)
    return {
      id: patient.id || patient.uid || patient.email || `temp-${fallbackId}`,
      name: patient.fullName || patient.name || 'Unknown',
      condition: patient.medicalCondition || patient.condition || 'Condition pending',
      specialty: patient.specialty || patient.specialtyName || 'General',
      waitTimeDays,
      urgencyLevel,
      insurance: patient.insurance || 'Uninsured',
      transportation: patient.transportation || 'Not available yet',
      travelConstraints: patient.travelConstraints || patient.transportation || 'Not available yet',
      symptoms: patient.symptoms || 'Not available yet',
      aiRecommendations: patient.aiRecommendations || []
    }
  }

  const patientsWithScores = useMemo(() => {
    return queueSource
      .map((patient, index) => {
        const normalized = normalizePatient(patient, index)
        return {
          ...normalized,
          equityScore: calculateEquityScore(normalized)
        }
      })
      .sort((a, b) => b.equityScore - a.equityScore)
  }, [queueSource])

  const topPatients = patientsWithScores.slice(0, 3)

  const pendingMatches = matches.filter((match) => match.status === 'pending')
  const confirmedMatches = matches.filter((match) => match.status === 'confirmed')

  const actionItems = pendingMatches.map((match) => {
    const patient = patients.find((p) => p.id === match.patientId)
    const patientName = patient?.fullName || patient?.name || match.patientName || 'Unknown Patient'
    const condition = patient?.medicalCondition || patient?.condition || match.condition || ''
    return {
      id: match.id,
      type: 'urgent',
      description: `Review match for ${patientName}${condition ? ` — ${condition}` : ''}`,
      room: match.erRoom || match.roomType || '',
      dueTime: match.matchedAt ? 'Today' : 'Not available yet'
    }
  })

  const appointments = confirmedMatches.map((match) => {
    const patient = patients.find((p) => p.id === match.patientId)
    const symptoms = patient?.symptoms
      ? Array.isArray(patient.symptoms)
        ? patient.symptoms
        : String(patient.symptoms).split(',').map((item) => item.trim()).filter(Boolean)
      : ['Not available yet']
    const aiRecommendations = match.reasoningExplanation
      ? [match.reasoningExplanation]
      : ['Not available yet']

    return {
      id: match.id,
      time: match.appointmentTime || match.time || '—',
      patientName: patient?.fullName || patient?.name || 'Unknown',
      condition: patient?.medicalCondition || patient?.condition || 'Condition pending',
      status: match.status || 'scheduled',
      symptoms,
      aiRecommendations
    }
  })

  const urgentActionItems = actionItems.filter((item) => item.type === 'urgent')

  const stats = {
    urgentItems: urgentActionItems.length + incomingPatients.filter(p => p.priorityTier <= 2).length,
    highPriority: topPatients.length,
    incomingCount: incomingPatients.length,
    avgWaitReduced: wastedSlotsStats.averageWaitTime
  }

  const toggleAppointmentDetails = (appointmentId) => {
    setExpandedAppointment(expandedAppointment === appointmentId ? null : appointmentId)
  }

  const toggleQueuePatientDetails = async (patientId) => {
    const newExpanded = expandedQueuePatient === patientId ? null : patientId
    setExpandedQueuePatient(newExpanded)

    // Fetch K2 insights when expanding a patient
    if (newExpanded && !k2Insights[patientId]) {
      const patient = patientsWithScores.find(p => p.id === patientId)
      if (patient) {
        setLoadingInsights(prev => ({ ...prev, [patientId]: true }))
        try {
          const insights = await generateDoctorInsights(patient)
          setK2Insights(prev => ({ ...prev, [patientId]: insights }))
        } catch (error) {
          console.error('Error fetching K2 insights:', error)
        } finally {
          setLoadingInsights(prev => ({ ...prev, [patientId]: false }))
        }
      }
    }
  }

  const togglePatientSelection = (patientId) => {
    setSelectedPatients(prev => {
      const newSet = new Set(prev)
      if (newSet.has(patientId)) {
        newSet.delete(patientId)
      } else {
        newSet.add(patientId)
      }
      return newSet
    })
  }

  const handleConfirmMatch = async (matchId) => {
    try {
      await updateMatchStatus(matchId, 'confirmed')
      await refreshMatches()
      alert('Match confirmed! Patient will be notified.')
    } catch (error) {
      alert('Error confirming match: ' + error.message)
    }
  }

  const handleRejectMatch = async (matchId) => {
    try {
      await updateMatchStatus(matchId, 'rejected')
      await refreshMatches()
      alert('Match rejected. Appointment slot is now available again.')
    } catch (error) {
      alert('Error rejecting match: ' + error.message)
    }
  }

  // Load billing subscription status (also re-check after returning from checkout)
  useEffect(() => {
    if (!doctorId) return
    getCustomerSubscriptions(doctorId).then(subs => setSubscriptions(subs || []))
  }, [doctorId])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('billing') === 'success' && doctorId) {
      // Slight delay to let Flowglad finalize the subscription
      setTimeout(() => {
        getCustomerSubscriptions(doctorId).then(subs => setSubscriptions(subs || []))
      }, 1500)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [doctorId])

  const handleSubscribe = async () => {
    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const base = window.location.origin
      const name = userProfile?.fullName || userProfile?.name || 'Doctor'
      const email = userProfile?.email || `${doctorId}@medimatch.ai`

      console.log('🔄 Creating Flowglad checkout session...')
      console.log('Doctor ID:', doctorId)
      console.log('Name:', name)
      console.log('Email:', email)

      const url = await createCheckoutSession(
        doctorId,
        name,
        email,
        `${base}/doctor/dashboard?billing=success`,
        `${base}/doctor/dashboard?billing=cancelled`
      )

      console.log('✅ Checkout URL received:', url)
      console.log('🌐 Redirecting to Flowglad...')

      // Force redirect
      window.location.href = url
    } catch (err) {
      console.error('❌ Checkout error:', err)
      setCheckoutError(err.message || 'Failed to create checkout session')
      setCheckoutLoading(false)
    }
  }

  const openFlowgladPortal = async () => {
    try {
      console.log('🔑 Getting Flowglad customer portal session...')
      const portalUrl = await createCustomerPortalSession(doctorId)

      if (portalUrl) {
        console.log('✅ Portal URL:', portalUrl)
        window.location.href = portalUrl // Redirect to portal
      } else {
        console.error('❌ Failed to get portal URL')
        alert('Unable to open customer portal. Please try again or contact support.')
      }
    } catch (error) {
      console.error('❌ Portal error:', error)
      alert('Error opening customer portal: ' + error.message)
    }
  }

  const handleSlotChange = (event) => {
    const { name, value } = event.target
    setNewSlot((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateSlot = async (event) => {
    event.preventDefault()
    setSlotError('')

    if (!newSlot.date || !newSlot.time) {
      setSlotError('Please select a date and time.')
      return
    }

    try {
      setCreatingSlot(true)
      const dateValue = new Date(newSlot.date)
      const appointmentData = {
        doctorName: userProfile?.fullName || 'Doctor',
        clinicName: userProfile?.clinicName || 'Clinic Pending',
        specialty: newSlot.specialty,
        date: Timestamp.fromDate(dateValue),
        time: newSlot.time,
        duration: 30,
        address: userProfile?.address || 'Address pending',
        zipCode: userProfile?.zipCode || '00000',
        city: userProfile?.city || 'New York',
        state: userProfile?.state || 'NY',
        insuranceAccepted: userProfile?.insuranceAccepted || ['Medicaid', 'Medicare', 'Private'],
        languagesOffered: userProfile?.languages || ['English'],
        wheelchairAccessible: true,
        publicTransitNearby: true
      }

      await createAppointment(doctorId, appointmentData)
      setNewSlot((prev) => ({ ...prev, date: '', time: '' }))
    } catch (error) {
      console.error('Error creating appointment slot:', error)
      setSlotError('Unable to create slot. Please try again.')
    } finally {
      setCreatingSlot(false)
    }
  }

  if (patientsLoading || matchesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 rounded-lg bg-ink-200/60 animate-pulse dark:bg-ink-800/60" />
        <div className="h-40 rounded-2xl bg-white/70 animate-pulse dark:bg-ink-900/60" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 rounded-2xl bg-white/70 animate-pulse dark:bg-ink-900/60" />
          <div className="h-48 rounded-2xl bg-white/70 animate-pulse dark:bg-ink-900/60" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative -mx-6 -my-8 px-6 py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-ink-950 dark:via-ink-900 dark:to-slate-900" />

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Doctor Portal</p>
              <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">CareFlow Exchange</h1>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(v => !v); setUnreadCount(0); setNotifications(prev => prev.map(n => ({ ...n, read: true }))) }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 shadow-sm hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-ink-200 bg-white shadow-2xl dark:border-ink-700 dark:bg-ink-900">
                <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3 dark:border-ink-700">
                  <h3 className="font-semibold text-ink-900 dark:text-white">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-ink-400 hover:text-ink-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-ink-400">No notifications yet</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`border-b border-ink-100 px-4 py-3 dark:border-ink-800 ${n.read ? '' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-bold text-ink-900 dark:text-white">{n.title}</p>
                            <p className="text-xs text-ink-500 dark:text-ink-300">{n.body}</p>
                            <p className="mt-0.5 text-xs text-ink-400">Room {n.room} · {n.time}</p>
                          </div>
                          <span className="shrink-0 text-xs">{n.priority.split(' ')[0]}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {(patientsError || matchesError) && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
            {patientsError || matchesError}
          </div>
        )}

        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
          <h2 className="text-3xl font-bold">Hi Doctor, welcome back.</h2>
          <p className="mt-2 text-sm text-white/80">Here’s your real-time CareFlow Exchange pulse.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.urgentItems}</div>
                <div className="text-sm opacity-90">Critical Patients</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <UserPlus className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.highPriority}</div>
                <div className="text-sm opacity-90">High Priority Patients</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.incomingCount}</div>
                <div className="text-sm opacity-90">Patients En Route</div>
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Action Items</h2>
              </div>
              <Badge variant="warning">{actionItems.length}</Badge>
            </div>
            {actionItems.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-ink-200 bg-white/70 px-4 py-6 text-center text-sm text-ink-500 dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-300">
                No urgent action items right now.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white/80 p-4 dark:border-ink-800 dark:bg-ink-900/60 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium text-ink-900 dark:text-white">{item.description}</p>
                        <p className="text-xs text-ink-500 dark:text-ink-400">
                          Due: {item.dueTime}{item.room ? ` · Room ${item.room}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleConfirmMatch(item.id)}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRejectMatch(item.id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-ink-900 dark:text-white">CareFlow Stats</h2>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3 text-sm dark:bg-ink-900/60">
                <span className="text-ink-500 dark:text-ink-300">Rooms Cleared (30d)</span>
                <span className="font-semibold text-ink-900 dark:text-white">{wastedSlotsStats.totalWastedLastMonth}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3 text-sm dark:bg-ink-900/60">
                <span className="text-ink-500 dark:text-ink-300">Patients Triaged</span>
                <span className="font-semibold text-ink-900 dark:text-white">{wastedSlotsStats.patientsRouted}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3 text-sm dark:bg-ink-900/60">
                <span className="text-ink-500 dark:text-ink-300">Avg ER Wait</span>
                <span className="font-semibold text-ink-900 dark:text-white">{stats.avgWaitReduced}</span>
              </div>
            </div>
            <Button asChild className="mt-4 w-full">
              <Link to="/matching">
                Review Live Matching
                <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </section>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-5 w-5 text-green-600" />
            <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Patients En Route to Your Room</h2>
            {incomingPatients.length > 0 && (
              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300">
                {incomingPatients.length} incoming
              </span>
            )}
          </div>
          <div className="space-y-3">
            {incomingPatients.length === 0 ? (
              <div className="text-center py-10 text-ink-500 dark:text-ink-300">
                <Clock className="h-10 w-10 mx-auto mb-3 text-ink-400" />
                <p>No patients assigned yet.</p>
                <p className="text-xs mt-1">Patients will appear here when they accept a room from the patient portal.</p>
              </div>
            ) : (
              incomingPatients.map((p, idx) => {
                const tierColor = p.priorityTier <= 1 ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200'
                  : p.priorityTier === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200'
                return (
                  <div key={idx} className="flex items-start justify-between gap-4 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-900/60">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-ink-900 dark:text-white">{p.patientName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tierColor}`}>
                          {p.priorityTier <= 1 ? 'IMMEDIATE' : p.priorityTier === 2 ? 'EMERGENT' : 'URGENT'}
                        </span>
                      </div>
                      <p className="text-sm text-ink-500">{p.condition}</p>
                      <div className="flex gap-4 text-xs text-ink-400 mt-1">
                        <span>Room: <strong>{p.erRoom}</strong></span>
                        <span>Score: <strong>{p.matchScore}</strong></span>
                        <span>Est. wait: <strong>{p.estimatedWaitMinutes} min</strong></span>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200">
                      En Route
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Scheduled Appointments</h2>
            {scheduledPatients.length > 0 && (
              <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                {scheduledPatients.length} booked
              </span>
            )}
          </div>
          {scheduledPatients.length === 0 ? (
            <div className="text-center py-8 text-ink-500 dark:text-ink-300">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-ink-400" />
              <p className="text-sm">No scheduled appointments yet.</p>
              <p className="text-xs mt-1">Patients will appear here when they book from the patient portal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledPatients.map((b, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-900/60">
                  <div className="flex-1">
                    <p className="font-bold text-ink-900 dark:text-white">{b.patientName}</p>
                    <p className="text-sm text-ink-500">{b.condition || 'Condition not specified'}</p>
                    <div className="flex gap-4 text-xs text-ink-400 mt-1">
                      <span>Time: <strong>{b.time}</strong></span>
                      <span>Room: <strong>{b.roomType || b.erRoom}</strong></span>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                    Scheduled
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Triage Queue</h2>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm dark:bg-red-500/20 dark:text-red-200">
                {topPatients.length} in queue
              </span>
              {selectedPatients.size > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedPatients.size} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-ink-500 dark:text-ink-400">K2-Think AI Insights</span>
            </div>
          </div>

          {topPatients.length === 0 ? (
            <div className="text-center py-12 text-ink-500 dark:text-ink-300">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm mt-1">No patients in the high priority queue.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topPatients.map((patient) => {
                const isExpanded = expandedQueuePatient === patient.id
                return (
                  <div
                    key={patient.id}
                    className="border border-ink-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow dark:border-ink-800"
                  >
                    <div className="p-4 bg-ink-50 dark:bg-ink-900/60">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedPatients.has(patient.id)}
                            onChange={() => togglePatientSelection(patient.id)}
                            className="mt-1 w-4 h-4 rounded border-ink-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-lg text-ink-900 dark:text-white">{patient.name}</h3>
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full dark:bg-red-500/20 dark:text-red-200">
                                Equity Score: {patient.equityScore}
                              </span>
                            </div>
                            <p className="text-sm text-ink-500 dark:text-ink-300 mb-2">
                              {patient.condition} • Urgency {patient.urgencyLevel}/10
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded dark:bg-blue-500/20 dark:text-blue-200">
                                {patient.specialty}
                              </span>
                              <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded dark:bg-purple-500/20 dark:text-purple-200">
                                {patient.insurance}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                              <Clock className="w-4 h-4" />
                              <span>Travel constraints: {patient.travelConstraints}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleQueuePatientDetails(patient.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6 bg-white border-t border-ink-200 dark:bg-ink-950/60 dark:border-ink-800">
                        {loadingInsights[patient.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-3 text-purple-600">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                              <span className="text-sm">K2-Think AI analyzing patient...</span>
                            </div>
                          </div>
                        ) : k2Insights[patient.id] ? (
                          <>
                            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
                              <div className="flex items-center gap-2 mb-3">
                                <Brain className="w-5 h-5 text-purple-600" />
                                <h4 className="font-bold text-ink-900 dark:text-white">K2-Think Clinical Summary</h4>
                              </div>
                              <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed">
                                {k2Insights[patient.id].clinicalSummary}
                              </p>
                            </div>

                            {/* K2-Think Audit Trail */}
                            <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-900/10">
                              <div className="flex items-center gap-2 mb-3">
                                <Target className="w-4 h-4 text-blue-600" />
                                <h5 className="text-sm font-bold text-ink-900 dark:text-white">AI Reasoning Audit Trail</h5>
                                <Badge variant="secondary" className="text-xs">Transparency</Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2 text-xs text-ink-600 dark:text-ink-300">
                                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                                  <div>
                                    <span className="font-semibold">Model:</span> K2-Think-v2 (Medical Reasoning AI)
                                  </div>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-ink-600 dark:text-ink-300">
                                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                                  <div>
                                    <span className="font-semibold">Analysis Factors:</span> Symptoms ({patient.symptoms?.split(',').length || 0} items), Urgency (Level {patient.urgencyLevel}/10), Medical History, Vital Signs
                                  </div>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-ink-600 dark:text-ink-300">
                                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-blue-500" />
                                  <div>
                                    <span className="font-semibold">Reasoning Chain:</span> Symptom pattern recognition → Differential diagnosis generation → Risk stratification → Action prioritization
                                  </div>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-ink-600 dark:text-ink-300">
                                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-500" />
                                  <div>
                                    <span className="font-semibold">Confidence Level:</span> High (Based on clear symptom presentation and clinical guidelines)
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                                  <p className="text-xs italic text-ink-500 dark:text-ink-400">
                                    ℹ️ This AI provides decision support. Final clinical decisions remain with licensed healthcare providers.
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                              <div>
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-ink-900 dark:text-white">
                                  <Zap className="w-5 h-5 text-orange-600" />
                                  Immediate Actions
                                </h4>
                                <ul className="space-y-2">
                                  {k2Insights[patient.id].immediateActions?.map((action, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                                      <CheckCircle2 className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-ink-900 dark:text-white">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                  Differentials
                                </h4>
                                <ul className="space-y-2">
                                  {k2Insights[patient.id].differentials?.map((diff, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                      <span>{diff}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div>
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-ink-900 dark:text-white">
                                  <AlertTriangle className="w-5 h-5 text-red-600" />
                                  Watch Outs
                                </h4>
                                <ul className="space-y-2">
                                  {k2Insights[patient.id].watchOuts?.map((watchOut, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                      <span>{watchOut}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h4 className="font-bold mb-3 flex items-center gap-2 text-ink-900 dark:text-white">
                                <Activity className="w-5 h-5 text-purple-600" />
                                Symptoms
                              </h4>
                              <ul className="space-y-2">
                                {String(patient.symptoms)
                                  .split(',')
                                  .map((symptom) => symptom.trim())
                                  .filter(Boolean)
                                  .map((symptom) => (
                                    <li key={symptom} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                                      <span>{symptom}</span>
                                    </li>
                                  ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="font-bold mb-3 flex items-center gap-2 text-ink-900 dark:text-white">
                                <FileText className="w-5 h-5 text-blue-600" />
                                AI Recommendations
                              </h4>
                              <ul className="space-y-2">
                                {patient.aiRecommendations.length > 0 ? (
                                  patient.aiRecommendations.map((rec) => (
                                    <li key={rec} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <span>{rec}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-sm text-ink-500 dark:text-ink-300">Not available yet</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}

                        <div className="border-t border-ink-200 pt-4 dark:border-ink-800">
                          <p className="font-medium mb-3 text-ink-900 dark:text-white">Accept Patient for:</p>
                          <div className="flex gap-3 flex-wrap">
                            <Button size="sm" asChild>
                              <Link to="/matching">
                                <CheckCircle2 className="w-4 h-4" />
                                Find Match
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-green-600" />
              <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Billing</h2>
              <Badge variant="secondary" className="text-xs">TEST MODE</Badge>
            </div>
            {subscriptions?.some(s => s.status === 'active') ? (
              <Badge variant="success">Active Subscription</Badge>
            ) : null}
          </div>

          <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-800 dark:bg-ink-900/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink-900 dark:text-white">MediMatch ER Routing</p>
                <p className="text-sm text-ink-500 dark:text-ink-400">$5.00 / month — usage tracked per ER match</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-400">Test card: 4242 4242 4242 4242</p>
                <p className="text-xs text-ink-400">Any future date · Any CVC</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {subscriptions === null ? (
                  <p className="text-sm text-ink-400">Loading billing status…</p>
                ) : subscriptions.some(s => s.status === 'active') ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300 font-medium">Subscribed</span>
                    <span className="text-xs text-ink-400">· {confirmedMatches.length} matches billed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">Not subscribed</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {subscriptions?.some(s => s.status === 'active') && (
                  <Button
                    onClick={() => {
                      console.log('🔘 Manage Subscription clicked')
                      openFlowgladPortal()
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Manage Subscription
                  </Button>
                )}
                <Button
                  onClick={() => {
                    console.log('🔘 Subscribe button clicked')
                    handleSubscribe()
                  }}
                  disabled={checkoutLoading}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {checkoutLoading ? (
                    <><span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent inline-block" />Opening Flowglad…</>
                  ) : subscriptions?.some(s => s.status === 'active') ? (
                    <><CreditCard className="mr-2 h-4 w-4" />Add Subscription</>
                  ) : (
                    <><CreditCard className="mr-2 h-4 w-4" />Subscribe Now</>
                  )}
                </Button>
              </div>
            </div>
            {checkoutError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">{checkoutError}</p>
            )}

            {/* Debug Info */}
            <details className="mt-4">
              <summary className="text-xs text-ink-400 cursor-pointer hover:text-ink-600 dark:hover:text-ink-200">
                🔧 Debug Info (click to expand)
              </summary>
              <div className="mt-2 p-3 rounded bg-ink-50 dark:bg-ink-800 text-xs font-mono space-y-1">
                <div>API Key: {import.meta.env.VITE_FLOWGLAD_API_KEY ? '✅ Configured' : '❌ Missing'}</div>
                <div>Doctor ID: {doctorId}</div>
                <div>User Profile: {userProfile?.fullName || 'Loading...'}</div>
                <div>Subscriptions Loaded: {subscriptions === null ? 'Loading...' : subscriptions.length > 0 ? `✅ ${subscriptions.length} found` : '❌ None'}</div>
              </div>
            </details>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Availability Slots</h2>
          </div>

          <form onSubmit={handleCreateSlot} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Date</label>
              <input
                type="date"
                name="date"
                value={newSlot.date}
                onChange={handleSlotChange}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 dark:border-ink-800 dark:bg-ink-950 dark:text-white"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Time</label>
              <input
                type="time"
                name="time"
                value={newSlot.time}
                onChange={handleSlotChange}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 dark:border-ink-800 dark:bg-ink-950 dark:text-white"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Specialty</label>
              <select
                name="specialty"
                value={newSlot.specialty}
                onChange={handleSlotChange}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 dark:border-ink-800 dark:bg-ink-950 dark:text-white"
              >
                <option value="primary_care">Primary Care</option>
                <option value="cardiology">Cardiology</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="neurology">Neurology</option>
                <option value="dermatology">Dermatology</option>
                <option value="emergency">Emergency</option>
                <option value="gastroenterology">Gastroenterology</option>
                <option value="pulmonology">Pulmonology</option>
                <option value="endocrinology">Endocrinology</option>
                <option value="psychiatry">Psychiatry</option>
                <option value="ophthalmology">Ophthalmology</option>
                <option value="ent">ENT</option>
              </select>
            </div>
            <div className="flex items-end md:col-span-1">
              <Button type="submit" className="w-full" disabled={creatingSlot}>
                {creatingSlot ? 'Creating...' : 'Add Slot'}
              </Button>
            </div>
          </form>

          {slotError && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {slotError}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {doctorAppointments.length === 0 ? (
              <div className="text-sm text-ink-500 dark:text-ink-300">
                No availability slots yet. Add one above to open your schedule.
              </div>
            ) : (
              doctorAppointments.slice(0, 6).map((slot) => (
                <div
                  key={slot.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-sm dark:border-ink-800 dark:bg-ink-900/60"
                >
                  <div>
                    <p className="font-medium text-ink-900 dark:text-white">
                      {slot.date?.toDate ? slot.date.toDate().toLocaleDateString() : 'Date TBD'} at {slot.time || 'Time TBD'}
                    </p>
                    <p className="text-ink-500 dark:text-ink-300">
                      {slot.specialty?.replace('_', ' ') || 'Specialty pending'} · {slot.clinicName || 'Clinic pending'}
                    </p>
                  </div>
                  <Badge variant={slot.status === 'available' ? 'success' : 'warning'}>
                    {slot.status || 'available'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Toast notification */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-2xl dark:border-ink-700 dark:bg-ink-900 animate-in slide-in-from-bottom-4" style={{ maxWidth: 340 }}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-ink-900 dark:text-white">{activeToast.priority}</p>
            <p className="text-sm text-ink-700 dark:text-ink-200">{activeToast.body}</p>
            <p className="text-xs text-ink-400 mt-0.5">Room {activeToast.room} · {activeToast.time}</p>
          </div>
          <button onClick={() => setActiveToast(null)} className="shrink-0 text-ink-400 hover:text-ink-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

export default DoctorDashboard
