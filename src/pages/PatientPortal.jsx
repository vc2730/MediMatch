import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  CreditCard,
  DollarSign,
  FileText,
  Heart,
  Lightbulb,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Shield,
  Stethoscope,
  User,
  Volume2,
  XCircle
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { usePatientMatches } from '../hooks/useMatches'
import { useNotifications } from '../hooks/useNotifications'
import { usePatient } from '../hooks/usePatients'
import { useAuth } from '../contexts/AuthContext'
import { getAppointmentById } from '../services/database'
import { generateTriageAdvice } from '../services/k2think'

const PatientPortal = () => {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [played, setPlayed] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [scheduledBookings, setScheduledBookings] = useState([])
  const [triageAdvice, setTriageAdvice] = useState(null)
  const [triageLoading, setTriageLoading] = useState(false)
  const [triageError, setTriageError] = useState(null)
  const fetchedMatchIds = useRef(new Set())

  // Use auth userId directly; fall back to localStorage for backward compat
  const patientId = userId || localStorage.getItem('currentPatientId')

  const { patient, loading: patientLoading } = usePatient(patientId)
  const { matches, confirmedMatches, pendingMatches, updateStatus } = usePatientMatches(patientId)
  const { notifications, markAsRead, loading: notificationsLoading } = useNotifications(patientId)

  useEffect(() => {
    if (!matches || matches.length === 0) {
      setAppointments([])
      return
    }

    const matchIds = confirmedMatches.map(m => m.id).join(',')
    const fetchedIds = Array.from(fetchedMatchIds.current).join(',')

    if (matchIds === fetchedIds) {
      return
    }

    const fetchAppointments = async () => {
      setLoadingAppointments(true)
      try {
        const appointmentPromises = confirmedMatches.map(async (match) => {
          const appointment = await getAppointmentById(match.appointmentId)
          return { ...appointment, matchId: match.id, matchStatus: match.status }
        })
        const fetchedAppointments = await Promise.all(appointmentPromises)
        setAppointments(fetchedAppointments.filter(apt => apt !== null))
        fetchedMatchIds.current = new Set(confirmedMatches.map(m => m.id))
      } catch (error) {
        console.error('Error fetching appointments:', error)
        setAppointments([])
      } finally {
        setLoadingAppointments(false)
      }
    }

    fetchAppointments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches])

  // Load scheduled bookings from localStorage
  useEffect(() => {
    const load = () => {
      try {
        const all = JSON.parse(localStorage.getItem('demoBookings') || '[]')
        setScheduledBookings(all.filter(b => b.patientId === patientId))
      } catch {
        setScheduledBookings([])
      }
    }
    load()
  }, [patientId])

  // Fetch K2Think triage advice when patient data is ready
  useEffect(() => {
    if (!patient || triageAdvice || triageLoading) return
    setTriageLoading(true)
    setTriageError(null)
    generateTriageAdvice(patient)
      .then(advice => setTriageAdvice(advice))
      .catch(err => {
        console.error('K2Think error:', err)
        setTriageError('Could not load AI triage advice.')
      })
      .finally(() => setTriageLoading(false))
  }, [patient])

  const upcomingAppointments = appointments.filter(apt => apt)
  const newAppointmentsCount = upcomingAppointments.length
  const incompleteActionItems = notifications.filter((notif) => !notif.read)

  if (patientLoading || (!patientId && !userId)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-ink-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-2">No Patient Profile</h2>
        <p className="text-sm text-ink-500 dark:text-ink-300 mb-4">
          We couldn’t load your patient profile. Please contact support or try again later.
        </p>
        <Button onClick={() => navigate('/login')}>
          Back to Login
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">Patient Portal</p>
              <h1 className="text-3xl font-bold">Hi {patient.fullName}! Welcome back.</h1>
            </div>
          </div>
          <div className="ml-auto flex gap-2 flex-wrap">
            <Button asChild variant="outline" className="border-purple-300/50 text-white bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 font-semibold shadow-lg">
              <Link to="/patient/multimodal-triage">
                <AlertTriangle className="mr-2 h-4 w-4" />
                AI Multimodal Triage
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20">
              <Link to="/patient/doctors">
                <Stethoscope className="mr-2 h-4 w-4" />
                Browse Doctors
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20">
              <Link to="/patient/profile">
                <Pencil className="mr-2 h-4 w-4" />
                Update Health Info
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/40 text-white bg-white/10 hover:bg-white/20">
              <Link to="/patient/appointments">
                <BookOpen className="mr-2 h-4 w-4" />
                Schedule Appointment
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/patient/matching">
                <RefreshCw className="mr-2 h-4 w-4" />
                Find ER Room
              </Link>
            </Button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{newAppointmentsCount}</div>
              <div className="text-sm opacity-90">ER Rooms Assigned</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{incompleteActionItems.length}</div>
              <div className="text-sm opacity-90">New Action Items</div>
            </div>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Your ER Room Assignments</h2>
        </div>

        {loadingAppointments ? (
          <p className="text-sm text-ink-500 dark:text-ink-300">Loading ER assignments...</p>
        ) : upcomingAppointments.length === 0 ? (
          <div className="text-center py-10 text-ink-500 dark:text-ink-300">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-ink-400" />
            <p className="font-medium">No ER room assigned yet</p>
            <p className="text-sm mt-1">Check your request tracker for pending triage status.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-xl border border-ink-200 p-5 transition hover:shadow-md dark:border-ink-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
                        {appointment.doctorName || 'Assigned Provider'}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {patient.specialty?.replace('_', ' ') || 'Specialty pending'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-ink-500 dark:text-ink-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {appointment.date?.toDate ? appointment.date.toDate().toLocaleDateString() : 'Date TBD'} at {appointment.time || 'Time TBD'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{appointment.clinicName || 'Location TBD'}</span>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/20 dark:text-green-200">
                    <CheckCircle className="h-3 w-3" />
                    Confirmed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Scheduled Appointments</h2>
            {scheduledBookings.length > 0 && (
              <Badge variant="secondary">{scheduledBookings.length}</Badge>
            )}
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/patient/appointments">
              <Calendar className="h-4 w-4 mr-2" />
              Book New
            </Link>
          </Button>
        </div>

        {scheduledBookings.length === 0 ? (
          <div className="text-center py-8 text-ink-500 dark:text-ink-300">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-ink-400" />
            <p className="font-medium">No scheduled appointments</p>
            <p className="text-sm mt-1">Book a future appointment with a specialist.</p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/patient/appointments">Browse Available Slots</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {scheduledBookings.map((booking, i) => (
              <div key={i} className="rounded-xl border border-ink-200 p-4 dark:border-ink-800">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-ink-900 dark:text-white">{booking.doctorName}</p>
                    <p className="text-sm text-ink-500">{booking.clinicName}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-ink-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {booking.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {booking.address}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                    <CheckCircle className="h-3 w-3" />
                    Scheduled
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Triage Status — K2Think powered */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Triage Status</h2>
          {triageAdvice && (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${triageAdvice.colors.bg} ${triageAdvice.colors.text}`}>
              {triageAdvice.priorityLabel}
            </span>
          )}
        </div>

        {triageLoading ? (
          <div className="flex items-center gap-3 py-6 text-ink-500 dark:text-ink-300">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
            <span className="text-sm">AI is assessing your triage status...</span>
          </div>
        ) : triageError ? (
          <div className={`rounded-xl border p-4 ${
            triageAdvice?.colors?.border || 'border-ink-200 dark:border-ink-700'
          }`}>
            <div className="flex items-start gap-3">
              <Stethoscope className="h-5 w-5 text-ink-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-ink-900 dark:text-white mb-1">
                  {pendingMatches.length > 0 ? 'In Triage Queue' : confirmedMatches.length > 0 ? 'ER Room Assigned' : 'Not Yet Queued'}
                </p>
                <p className="text-sm text-ink-500 dark:text-ink-300">{triageError}</p>
              </div>
            </div>
          </div>
        ) : triageAdvice ? (
          <div className={`rounded-xl border p-5 ${triageAdvice.colors.border} ${triageAdvice.colors.bg}`}>
            <p className={`text-sm font-medium ${triageAdvice.colors.text} mb-1`}>
              {triageAdvice.priorityLabel} — AI Triage Assessment
            </p>
            <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed">
              {triageAdvice.triageAssessment}
            </p>
            {(pendingMatches.length > 0 || confirmedMatches.length > 0) && (
              <div className="mt-3 pt-3 border-t border-ink-200/50 dark:border-ink-700/50 space-y-1">
                {pendingMatches.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-xs">
                    <span className="text-ink-600 dark:text-ink-300 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Pending room assignment
                    </span>
                    <button onClick={() => updateStatus(m.id, 'rejected')} className="text-red-500 hover:text-red-700 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Withdraw
                    </button>
                  </div>
                ))}
                {confirmedMatches.map(m => (
                  <span key={m.id} className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> ER Room confirmed
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-ink-500 dark:text-ink-300">
            <Stethoscope className="h-10 w-10 mx-auto mb-3 text-ink-400" />
            <p className="font-medium">Triage status unavailable</p>
            <p className="text-sm mt-1">Update your health info to get an AI assessment.</p>
          </div>
        )}
      </Card>

      {/* Action Items — K2Think powered tips */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Action Items</h2>
          {triageAdvice?.actionItems?.length > 0 && (
            <Badge variant="secondary">{triageAdvice.actionItems.length}</Badge>
          )}
        </div>

        {triageLoading ? (
          <div className="flex items-center gap-3 py-6 text-ink-500 dark:text-ink-300">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500" />
            <span className="text-sm">Generating personalized tips...</span>
          </div>
        ) : triageAdvice?.actionItems?.length > 0 ? (
          <div className="space-y-3">
            {triageAdvice.actionItems.map((item, i) => {
              const IconMap = {
                alert: AlertTriangle,
                clock: Clock,
                heart: Heart,
                phone: Phone,
                clipboard: ClipboardList,
                shield: Shield
              }
              const Icon = IconMap[item.icon] || Lightbulb
              return (
                <div key={i} className="rounded-xl border border-ink-200 p-4 dark:border-ink-800">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-500/20 shrink-0">
                      <Icon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink-900 dark:text-white text-sm">{item.title}</p>
                      <p className="text-sm text-ink-600 dark:text-ink-300 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : incompleteActionItems.length > 0 ? (
          <div className="space-y-3">
            {incompleteActionItems.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-xl border border-ink-200 p-5 dark:border-ink-800">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Lightbulb className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-ink-900 dark:text-white">
                        {item.title || 'Care Team Update'}
                      </h3>
                    </div>
                    <p className="text-sm text-ink-600 dark:text-ink-300">
                      {item.message || item.body || 'Check your latest care instructions.'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => markAsRead(item.id)}>
                    Mark Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ink-500 dark:text-ink-300">
            <Lightbulb className="h-10 w-10 mx-auto mb-3 text-ink-400" />
            <p className="font-medium">No action items right now</p>
            <p className="text-sm mt-1">Update your health info to get personalized tips.</p>
          </div>
        )}
      </Card>

      {/* Billing Test Dashboard */}
      <Card className="p-6 border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-700 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3 text-green-600 dark:bg-green-500/20 dark:text-green-200">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Flowglad Integration</p>
              <p className="mt-1 text-lg font-semibold text-ink-900 dark:text-white">Test Unlimited Payments</p>
              <p className="text-sm text-ink-500 dark:text-ink-300">Trigger real billing events • Unique transaction IDs</p>
            </div>
          </div>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link to="/patient/billing-test">
              <CreditCard className="h-4 w-4 mr-2" />
              Billing Dashboard
            </Link>
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-100 p-3 text-purple-600 dark:bg-purple-500/20 dark:text-purple-200">
              <Volume2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Voice Notification</p>
              <p className="mt-1 text-lg font-semibold text-ink-900 dark:text-white">Personalized Voice Update</p>
              <p className="text-sm text-ink-500 dark:text-ink-300">Listen to your latest health update</p>
            </div>
          </div>
          <Button onClick={() => setPlayed(true)}>
            <Volume2 className="h-4 w-4 mr-2" />
            Play Voice Notification
          </Button>
        </div>

        {played && (
          <div className="mt-4 rounded-lg bg-ink-50 p-4 text-sm text-ink-600 dark:bg-ink-900 dark:text-ink-300">
            "Hello {patient.fullName}, your ER room has been assigned based on your triage priority. Please proceed to the assigned room and a care team member will assist you shortly."
          </div>
        )}
      </Card>
    </div>
  )
}

export default PatientPortal
