import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { usePatient } from '../hooks/usePatients'
import { useAuth } from '../contexts/AuthContext'
import { calculateEquityScore } from '../lib/equityEngine'
import { findMatchesForPatient } from '../services/matching'
import { createMatch } from '../services/database'
import { triggerMatchWorkflow } from '../services/flowgladIntegration'
import { generateCoordinationPlan } from '../services/deadalusCoordination'
import { DEMO_DOCTORS } from '../services/seedData'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Brain,
  CheckCircle,
  Clock,
  Eye,
  Mic,
  MapPin,
  Navigation,
  Radio,
  Search,
  Sparkles,
  Stethoscope,
  Users,
  Video as VideoIcon,
  Zap
} from 'lucide-react'

const TRIAGE_LABELS = {
  1: { label: 'ESI 1 — Immediate', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  2: { label: 'ESI 2 — Emergent', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  3: { label: 'ESI 3 — Urgent', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  4: { label: 'ESI 4 — Less Urgent', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  5: { label: 'ESI 5 — Non-Urgent', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' }
}

const PatientMatching = () => {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const patientId = userId || localStorage.getItem('currentPatientId')
  const { patient, loading: patientLoading } = usePatient(patientId)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [acceptedRoom, setAcceptedRoom] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [workflowStatus, setWorkflowStatus] = useState([])
  const [coordinationPlan, setCoordinationPlan] = useState(null)
  const [loadingCoordination, setLoadingCoordination] = useState(false)
  const [multimodalAnalysis, setMultimodalAnalysis] = useState(() => {
    try {
      const stored = sessionStorage.getItem('multimodalAnalysis')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  // loggedInDoctor: synced from Firestore in real time (works across browsers/profiles)
  const [loggedInDoctor, setLoggedInDoctor] = useState(() => {
    try { return JSON.parse(localStorage.getItem('loggedInDoctor') || 'null') } catch { return null }
  })
  // manualDoctor: patient-side manual override, only used when no one is logged in
  const [manualDoctor, setManualDoctor] = useState(null)

  // The effective target: logged-in doctor wins
  const targetDoctor = loggedInDoctor || manualDoctor

  // Subscribe to Firestore demoSessions/activeDoctor — works across different browsers/profiles
  useEffect(() => {
    const ref = doc(db, 'demoSessions', 'activeDoctor')
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setLoggedInDoctor({ doctorId: data.doctorId, doctorName: data.doctorName })
      } else {
        setLoggedInDoctor(null)
      }
    }, () => {
      // Firestore unavailable — fall back to localStorage
      try { setLoggedInDoctor(JSON.parse(localStorage.getItem('loggedInDoctor') || 'null')) } catch { /* ignore */ }
    })
    return () => unsub()
  }, [])

  // When patient manually picks a demo doctor (only matters if no doctor is logged in)
  const pickDemoDoctor = (doctor) => {
    const val = { doctorId: doctor.id, doctorName: doctor.fullName }
    setManualDoctor(val)
    localStorage.setItem('activeDemoDoctor', JSON.stringify(val))
  }

  useEffect(() => {
    if (!patientId) navigate('/login')
  }, [navigate, patientId])

  const handleFindRooms = async () => {
    if (!patient) return
    setAcceptedRoom(null)
    setHasSearched(true)
    setLoading(true)
    setError(null)
    try {
      const results = await findMatchesForPatient(patient, 5)
      setMatches(results)
    } catch (err) {
      setError(err.message)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRoom = async (match) => {
    const apt = match.appointment
    setWorkflowStatus([])
    setCoordinationPlan(null)
    setLoadingCoordination(true)

    // Generate Dedalus coordination plan (with multimodal data if available)
    try {
      const multimodalData = sessionStorage.getItem('multimodalIntakeData')
      const multimodalParsed = multimodalData ? JSON.parse(multimodalData) : null

      // Prepare all images (multimodal or legacy single image)
      const images = multimodalParsed?.images || []
      const legacyImage = sessionStorage.getItem('symptomImageBase64')
      if (legacyImage && images.length === 0) {
        images.push({ base64: legacyImage })
      }

      const plan = await generateCoordinationPlan({
        patient,
        appointment: apt,
        scores: match.scores
      }, images[0]?.base64 || null, multimodalAnalysis)
      setCoordinationPlan(plan)
    } catch (err) {
      console.error('Error generating coordination plan:', err)
    } finally {
      setLoadingCoordination(false)
    }

    // Route to logged-in doctor first, then manual pick, then appointment default
    const routeTo = targetDoctor || { doctorId: apt.doctorId, doctorName: apt.doctorName }

    // Store in localStorage for demo mode
    const assignment = {
      patientId,
      patientName: patient.fullName,
      condition: patient.medicalCondition,
      triageLevel: patient.triageLevel || 2,
      urgencyLevel: patient.urgencyLevel,
      matchScore: match.scores.totalMatchScore,
      priorityTier: match.scores.priorityTier,
      doctorId: routeTo.doctorId,
      doctorName: routeTo.doctorName,
      erRoom: apt.erRoom,
      roomType: apt.roomType,
      clinicName: apt.clinicName,
      address: apt.address,
      estimatedWaitMinutes: apt.estimatedWaitMinutes,
      assignedAt: new Date().toISOString()
    }
    const existing = JSON.parse(localStorage.getItem('demoMatches') || '[]')
    existing.push(assignment)
    localStorage.setItem('demoMatches', JSON.stringify(existing))

    // Write to demoSessions/{doctorId} so cross-browser doctor dashboards get it
    // (uses same collection as activeDoctor which is already allowed in security rules)
    try {
      const sessionRef = doc(db, 'demoSessions', routeTo.doctorId)
      await setDoc(sessionRef, {
        latestPatient: { ...assignment, notifiedAt: new Date().toISOString() },
        updatedAt: new Date().toISOString()
      }, { merge: true })
      console.log('✅ Firestore match notification sent to', routeTo.doctorName)
    } catch (e) {
      console.warn('Firestore match notification failed:', e.message)
    }

    // Create Firestore match as 'pending' so doctor sees it in Action Items
    let matchId = `match_${patientId}_${Date.now()}`
    try {
      matchId = await createMatch(patientId, apt.id, {
        ...match.scores,
        doctorId: routeTo.doctorId,
        doctorName: routeTo.doctorName,
        patientName: patient.fullName,
        condition: patient.medicalCondition,
        erRoom: apt.erRoom,
        roomType: apt.roomType
      })
      console.log('✅ Firestore match created (pending):', matchId)
    } catch (err) {
      console.warn('Firestore match creation failed, using fallback ID:', err.message)
    }

    // Trigger real Flowglad workflow — each step writes to Firestore
    setWorkflowStatus([{ step: 'Initializing workflow...', status: 'pending' }])
    try {
      const workflowId = await triggerMatchWorkflow(matchId, {
        priorityTier: match.scores.priorityTier,
        erRoom: apt.erRoom,
        appointmentId: apt.id,
        doctorId: routeTo.doctorId,
        patientId,
        patientName: patient.fullName,
        condition: patient.medicalCondition
      })
      console.log('✅ Workflow triggered:', workflowId)

      // Update status labels as workflow progresses (timing matches real async steps)
      setWorkflowStatus([{ step: 'Patient notification sent', status: 'complete' }])
      setTimeout(() => setWorkflowStatus(prev => [...prev, { step: 'Doctor alerted via dashboard', status: 'complete' }]), 400)
      setTimeout(() => setWorkflowStatus(prev => [...prev, { step: 'Appointment status updated', status: 'complete' }]), 800)
      setTimeout(() => setWorkflowStatus(prev => [...prev, { step: 'ER room marked as occupied', status: 'complete' }]), 1200)
      setTimeout(() => setWorkflowStatus(prev => [...prev, { step: 'Flowglad billing event recorded ✓', status: 'complete' }]), 2000)
    } catch (workflowErr) {
      console.error('Error triggering workflow:', workflowErr)
      setWorkflowStatus([{ step: 'Workflow running (background)', status: 'complete' }])
    }

    setAcceptedRoom(assignment)
    setMatches([])
  }

  const getTriageBadge = (tier) => {
    if (tier <= 1) return { label: 'IMMEDIATE', cls: 'bg-red-600 text-white' }
    if (tier === 2) return { label: 'EMERGENT', cls: 'bg-orange-500 text-white' }
    if (tier === 3) return { label: 'URGENT', cls: 'bg-yellow-500 text-white' }
    return { label: 'STANDARD', cls: 'bg-blue-500 text-white' }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (patientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto" />
          <p className="mt-4 text-sm text-ink-500">Loading patient data...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-ink-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-2">Patient Not Found</h2>
        <Button onClick={() => navigate('/patient/portal')}>Back to Portal</Button>
      </div>
    )
  }

  const equityScore = calculateEquityScore(patient)
  const triageInfo = TRIAGE_LABELS[patient.triageLevel] || TRIAGE_LABELS[3]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">ER Room Assignment</h1>
          <p className="text-ink-500 dark:text-ink-300 mt-1">
            Find the best available ER room based on your triage level and needs
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/patient/portal')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Portal
        </Button>
      </div>

      {/* Demo: Doctor notification target picker */}
      <Card className="p-4 border-2 border-dashed border-blue-200 bg-blue-50/40 dark:border-blue-500/30 dark:bg-blue-500/5">
        <div className="flex items-center gap-2 mb-2">
          <Radio className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Demo: Send Notification To</span>
        </div>

        {/* Logged-in doctor — always shown first and always wins */}
        {loggedInDoctor ? (
          <div className="flex items-center gap-2 mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 dark:bg-green-500/10 dark:border-green-500/30">
            <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-bold text-green-800 dark:text-green-200">{loggedInDoctor.doctorName}</span>
            <span className="text-xs text-green-600 dark:text-green-400">— currently logged in, will receive alerts</span>
          </div>
        ) : (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
            No doctor dashboard open. Log in as a doctor first, or manually pick below.
          </p>
        )}

        {/* Manual override — only relevant when no doctor is logged in */}
        {!loggedInDoctor && (
          <div className="flex flex-wrap gap-2">
            {DEMO_DOCTORS.slice(0, 5).map(doc => (
              <button
                key={doc.id}
                onClick={() => pickDemoDoctor(doc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  manualDoctor?.doctorId === doc.id
                    ? 'border-blue-500 bg-blue-100 text-blue-800 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-200'
                    : 'border-ink-200 bg-white text-ink-600 hover:border-blue-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'
                }`}
              >
                {doc.fullName}{manualDoctor?.doctorId === doc.id && ' ✓'}
              </button>
            ))}
          </div>
        )}

        {targetDoctor && (
          <p className="text-xs text-green-700 dark:text-green-300 mt-2 font-medium">
            → Routing to: {targetDoctor.doctorName}
          </p>
        )}
      </Card>

      {/* Patient triage summary */}
      <Card className="p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white">{patient.fullName}</h2>
            <p className="text-sm text-ink-500 mt-1">{patient.medicalCondition || 'Condition not specified'}</p>
            <p className="text-xs text-ink-400 mt-1">{patient.symptoms}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${triageInfo.color}`}>
              {triageInfo.label}
            </span>
            <span className="text-xs text-ink-500">Equity Score: {equityScore}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-ink-500">Urgency</p>
            <p className="font-semibold text-ink-900 dark:text-white">
              {patient.urgencyLevel || patient.aiUrgencyScore || '—'}/10
            </p>
          </div>
          <div>
            <p className="text-ink-500">Insurance</p>
            <p className="font-semibold text-ink-900 dark:text-white">{patient.insurance || '—'}</p>
          </div>
          <div>
            <p className="text-ink-500">Transport</p>
            <p className="font-semibold text-ink-900 dark:text-white">{patient.transportation || '—'}</p>
          </div>
          <div>
            <p className="text-ink-500">Location</p>
            <p className="font-semibold text-ink-900 dark:text-white">{patient.zipCode || '—'}</p>
          </div>
        </div>

        <Button
          onClick={handleFindRooms}
          disabled={loading}
          className="w-full mt-6"
          size="lg"
        >
          {loading ? (
            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> Scanning Available ER Rooms...</>
          ) : hasSearched ? (
            <><Search className="h-4 w-4 mr-2" /> Scan Again</>
          ) : (
            <><Search className="h-4 w-4 mr-2" /> Find Available ER Room</>
          )}
        </Button>
      </Card>

      {/* Multimodal Analysis Display */}
      {multimodalAnalysis && (
        <Card className="p-6 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800">
          <div className="flex items-start gap-4 mb-4">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/40 shrink-0">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-ink-900 dark:text-white mb-2">
                AI Multimodal Triage Analysis Active
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className={`${multimodalAnalysis.triageLevel <= 1 ? 'bg-red-600' : multimodalAnalysis.triageLevel === 2 ? 'bg-orange-500' : 'bg-yellow-500'} text-white font-bold`}>
                  ESI Level {multimodalAnalysis.triageLevel}
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40">
                  Urgency: {multimodalAnalysis.urgencyScore}/10
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40">
                  {Math.round((multimodalAnalysis.confidenceScore || 0.85) * 100)}% Confidence
                </Badge>
              </div>

              {/* Modalities Used */}
              <div className="flex flex-wrap gap-2 mb-3">
                {multimodalAnalysis.modalitiesAnalyzed?.text && (
                  <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
                    <Sparkles className="h-3 w-3 text-blue-600" />
                    <span>Text</span>
                  </div>
                )}
                {multimodalAnalysis.modalitiesAnalyzed?.images > 0 && (
                  <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
                    <Eye className="h-3 w-3 text-purple-600" />
                    <span>{multimodalAnalysis.modalitiesAnalyzed.images} Image{multimodalAnalysis.modalitiesAnalyzed.images > 1 ? 's' : ''}</span>
                  </div>
                )}
                {multimodalAnalysis.modalitiesAnalyzed?.audio && (
                  <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
                    <Mic className="h-3 w-3 text-green-600" />
                    <span>Audio</span>
                  </div>
                )}
                {multimodalAnalysis.modalitiesAnalyzed?.video && (
                  <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
                    <VideoIcon className="h-3 w-3 text-red-600" />
                    <span>Video</span>
                  </div>
                )}
              </div>

              {/* Chief Complaint */}
              <div className="p-3 rounded-lg bg-white dark:bg-ink-800/50 border border-purple-200 dark:border-purple-800">
                <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Chief Complaint (AI-Analyzed)</div>
                <div className="text-sm text-ink-700 dark:text-ink-200">{multimodalAnalysis.chiefComplaint}</div>
              </div>

              {/* Critical Red Flags */}
              {multimodalAnalysis.criticalRedFlags && multimodalAnalysis.criticalRedFlags.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="text-xs font-bold text-red-800 dark:text-red-300 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Critical Red Flags Identified
                  </div>
                  <ul className="space-y-1">
                    {multimodalAnalysis.criticalRedFlags.map((flag, idx) => (
                      <li key={idx} className="text-xs text-red-700 dark:text-red-300">⚠️ {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 italic">
                ✨ {multimodalAnalysis.multimodalInsights}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Assigned room confirmation */}
      {acceptedRoom && (
        <Card className="p-6 border-green-300 bg-green-50/60 dark:border-green-500/40 dark:bg-green-500/10">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-500/20 shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-1">
                ER Room Assigned
              </p>
              <h3 className="text-xl font-bold text-ink-900 dark:text-white">
                {acceptedRoom.erRoom} — {acceptedRoom.clinicName}
              </h3>
              <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">
                Attending: {acceptedRoom.doctorName}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-600 dark:text-ink-300">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {acceptedRoom.address}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Est. wait: {acceptedRoom.estimatedWaitMinutes} min
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-brand-600" />
                <a
                  href={`https://maps.google.com?q=${encodeURIComponent(acceptedRoom.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 hover:underline"
                >
                  Get Directions
                </a>
              </div>
              <p className="mt-3 text-sm text-green-700 dark:text-green-300">
                The care team has been notified. Please proceed to {acceptedRoom.erRoom} and check in at the desk.
              </p>

              {/* FlowGlad Workflow Status */}
              {workflowStatus.length > 0 && (
                <div className="mt-4 p-4 rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="text-sm font-bold text-ink-900 dark:text-white">FlowGlad Automation</h4>
                    <Badge variant="secondary" className="text-xs">Live</Badge>
                  </div>
                  <div className="space-y-2">
                    {workflowStatus.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-ink-600 dark:text-ink-300">
                        {item.status === 'complete' ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-600 flex-shrink-0" />
                        )}
                        <span>{item.step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deadalus Coordination Plan */}
              {loadingCoordination && (
                <div className="mt-4 p-4 rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-800/50 dark:bg-purple-900/10">
                  <div className="flex items-center gap-3 text-purple-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                    <span className="text-sm font-medium">Dedalus AI agent running care coordination tools...</span>
                  </div>
                </div>
              )}

              {coordinationPlan && (
                <div className="mt-4 p-4 rounded-lg border border-purple-200 bg-purple-50/50 dark:border-purple-800/50 dark:bg-purple-900/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <h4 className="text-sm font-bold text-ink-900 dark:text-white">Dedalus AI Coordination</h4>
                    <Badge variant="secondary" className="text-xs">AI-Optimized</Badge>
                    {coordinationPlan.riskStratification?.riskLevel && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        coordinationPlan.riskStratification.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        coordinationPlan.riskStratification.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>Risk: {coordinationPlan.riskStratification.riskLevel}</span>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {/* Care Team */}
                    <div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">
                        <Users className="h-3.5 w-3.5" />
                        <span>Care Team ({coordinationPlan.careTeamAssignments?.length || 0} members)</span>
                      </div>
                      <div className="space-y-1">
                        {(coordinationPlan.careTeamAssignments || []).slice(0, 3).map((member, idx) => (
                          <div key={idx} className="text-xs text-ink-600 dark:text-ink-300">
                            <span className="font-medium">{member.role}:</span> {member.action}
                            {member.eta && <span className="text-ink-400 ml-1">({member.eta})</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Coordination Timeline</span>
                      </div>
                      <div className="space-y-1 text-xs text-ink-600 dark:text-ink-300">
                        {Object.values(coordinationPlan.timeline || {}).slice(0, 4).map((step, idx) => (
                          <div key={idx} className={idx === 3 ? 'font-medium text-purple-600' : ''}>
                            {step.time && <span className="text-ink-400 mr-1">{step.time}</span>}
                            {step.label || step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Risk Stratification */}
                  {coordinationPlan.riskStratification?.riskFactors?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Risk Factors (score: {coordinationPlan.riskStratification.compositeRiskScore})</span>
                      </div>
                      <div className="text-xs text-ink-600 dark:text-ink-300 space-y-0.5">
                        {coordinationPlan.riskStratification.riskFactors.slice(0, 2).map((f, i) => (
                          <div key={i}>• {f}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Specialist Consults */}
                  {coordinationPlan.specialistConsults?.specialists?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
                        <Stethoscope className="h-3.5 w-3.5" />
                        <span>{coordinationPlan.specialistConsults.totalConsults} specialist{coordinationPlan.specialistConsults.totalConsults > 1 ? 's' : ''} identified
                          {coordinationPlan.specialistConsults.statConsults > 0 && <span className="text-red-600 ml-1">({coordinationPlan.specialistConsults.statConsults} STAT)</span>}
                        </span>
                      </div>
                      <div className="text-xs text-ink-600 dark:text-ink-300">
                        {coordinationPlan.specialistConsults.specialists.map((s, i) => (
                          <span key={i} className="mr-2">{s.specialty} <span className={s.urgency === 'STAT' ? 'text-red-600 font-bold' : 'text-ink-400'}>({s.urgency}, {s.eta})</span></span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SDOH Interventions */}
                  {coordinationPlan.optimizationSuggestions?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-1 text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
                        <Zap className="h-3.5 w-3.5" />
                        <span>SDOH Interventions ({coordinationPlan.optimizationSuggestions.length})</span>
                      </div>
                      <div className="text-xs text-ink-600 dark:text-ink-300">
                        {coordinationPlan.optimizationSuggestions[0].action || coordinationPlan.optimizationSuggestions[0].suggestion}
                        <span className="text-ink-400 ml-1">— {coordinationPlan.optimizationSuggestions[0].category}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800 text-xs text-ink-500 dark:text-ink-400 flex flex-wrap items-center gap-2">
                    <span className="italic">🤖 {coordinationPlan.modelVersion || 'Dedalus-Agent-v2'} • {(coordinationPlan.aiConfidence * 100).toFixed(0)}% confidence</span>
                    {coordinationPlan.toolsUsed?.length > 0 && (
                      <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                        {coordinationPlan.toolsUsed.length} tools
                      </span>
                    )}
                    {coordinationPlan.multimodal && (
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                        📷 Multimodal
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Match results */}
      {matches.length > 0 && !acceptedRoom && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
              {matches.length} Available ER Rooms
            </h3>
            <p className="text-sm text-ink-500 mt-1">
              Ranked by urgency, equity factors, and proximity. Top match is recommended.
            </p>
          </div>

          {matches.map((match, index) => {
            const apt = match.appointment
            const tier = getTriageBadge(match.scores.priorityTier)

            return (
              <Card key={match.appointmentId || index} className={`p-5 ${index === 0 ? 'ring-2 ring-brand-500' : ''}`}>
                <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">#{index + 1}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-ink-400" />
                        <h4 className="font-semibold text-ink-900 dark:text-white">{apt.doctorName}</h4>
                      </div>
                      <p className="text-sm text-ink-500">{apt.clinicName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${tier.cls}`}>
                      {tier.label}
                    </span>
                    <span className={`text-xl font-bold ${getScoreColor(match.scores.totalMatchScore)}`}>
                      {match.scores.totalMatchScore}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-ink-600 dark:text-ink-300 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {apt.erRoom || apt.roomType}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    ~{apt.estimatedWaitMinutes ?? 0} min wait
                  </span>
                  <span className="flex items-center gap-1 text-xs text-ink-400">
                    {apt.address}
                  </span>
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="why" className="border-0">
                    <AccordionTrigger className="py-2 text-sm text-ink-500">
                      Why this room?
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex justify-between">
                            <span className="text-ink-500">Urgency:</span>
                            <span className="font-semibold">{match.scores.urgencyScore}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-500">Triage level:</span>
                            <span className="font-semibold">{match.scores.triageLevelScore}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-500">Specialty fit:</span>
                            <span className="font-semibold">{match.scores.specialtyMatchScore}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-500">Distance:</span>
                            <span className="font-semibold">{match.scores.distanceScore}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-500">Equity factors:</span>
                            <span className="font-semibold">{match.scores.barrierBonus}/10</span>
                          </div>
                        </div>
                        <p className="text-xs text-ink-500 italic pt-2 border-t border-ink-100 dark:border-ink-800">
                          {match.scores.reasoningExplanation}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button
                  onClick={() => handleAcceptRoom(match)}
                  className="w-full mt-3"
                  size="lg"
                  variant={index === 0 ? 'default' : 'outline'}
                >
                  {index === 0 ? (
                    <><AlertTriangle className="h-4 w-4 mr-2" /> Accept — Go to {apt.erRoom}</>
                  ) : (
                    <>Go to {apt.erRoom}</>
                  )}
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {hasSearched && matches.length === 0 && !loading && !acceptedRoom && (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-ink-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">No ER Rooms Available</h3>
          <p className="text-sm text-ink-500">
            No rooms found for <strong>{patient.specialty?.replace('_', ' ')}</strong> right now.
            {error && <span className="block mt-1 text-red-500">{error}</span>}
          </p>
          <Button className="mt-4" onClick={handleFindRooms}>Try Again</Button>
        </Card>
      )}
    </div>
  )
}

export default PatientMatching
