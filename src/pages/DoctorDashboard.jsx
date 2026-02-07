import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Sparkles,
  Stethoscope,
  UserPlus
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { usePatients } from '../hooks/usePatients'
import { useDoctorMatches } from '../hooks/useMatches'
import { updateMatchStatus } from '../services/database'
import { calculateEquityScore } from '../lib/equityEngine'
import { mockPatients, wastedSlotsStats } from '../lib/mockData'

const DoctorDashboard = () => {
  const { patients, loading: patientsLoading, error: patientsError, usingDemo } = usePatients()
  const [doctorId] = useState('doctor_1') // TODO: Get from auth context
  const { matches, loading: matchesLoading, error: matchesError, refresh: refreshMatches } = useDoctorMatches(doctorId)

  const [expandedAppointment, setExpandedAppointment] = useState(null)
  const [expandedQueuePatient, setExpandedQueuePatient] = useState(null)

  const queueSource = useMemo(() => {
    if (!usingDemo && patients.length > 0) return patients
    return mockPatients
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
    return {
      id: match.id,
      type: 'urgent',
      description: `Review match for ${patient?.fullName || patient?.name || 'patient'}`,
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
    urgentItems: urgentActionItems.length,
    highPriority: topPatients.length,
    appointments: appointments.length,
    avgWaitReduced: wastedSlotsStats.averageWaitTime
  }

  const toggleAppointmentDetails = (appointmentId) => {
    setExpandedAppointment(expandedAppointment === appointmentId ? null : appointmentId)
  }

  const toggleQueuePatientDetails = (patientId) => {
    setExpandedQueuePatient(expandedQueuePatient === patientId ? null : patientId)
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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Doctor Portal</p>
            <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">CareFlow Exchange</h1>
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
                <div className="text-sm opacity-90">Urgent Action Items</div>
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
                <div className="text-2xl font-bold">{stats.appointments}</div>
                <div className="text-sm opacity-90">Appointments Today</div>
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
                        <p className="text-xs text-ink-500 dark:text-ink-400">Due: {item.dueTime}</p>
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
                <span className="text-ink-500 dark:text-ink-300">Slots Rescued (30d)</span>
                <span className="font-semibold text-ink-900 dark:text-white">{wastedSlotsStats.totalWastedLastMonth}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3 text-sm dark:bg-ink-900/60">
                <span className="text-ink-500 dark:text-ink-300">Patients Matched</span>
                <span className="font-semibold text-ink-900 dark:text-white">{wastedSlotsStats.patientsRouted}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3 text-sm dark:bg-ink-900/60">
                <span className="text-ink-500 dark:text-ink-300">Avg Wait Reduced</span>
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
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Today's Schedule</h2>
          </div>
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="text-center py-10 text-ink-500 dark:text-ink-300">
                <Clock className="h-10 w-10 mx-auto mb-3 text-ink-400" />
                No confirmed appointments yet.
              </div>
            ) : (
              appointments.map((appointment) => {
                const isExpanded = expandedAppointment === appointment.id
                return (
                  <div
                    key={appointment.id}
                    className="border border-ink-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow dark:border-ink-800"
                  >
                    <button
                      onClick={() => toggleAppointmentDetails(appointment.id)}
                      className="w-full p-4 bg-ink-50 flex items-center justify-between hover:bg-ink-100 transition-colors dark:bg-ink-900/60 dark:hover:bg-ink-900"
                    >
                      <div className="flex items-center gap-4 flex-1 text-left">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-bold text-ink-900 dark:text-white">{appointment.time}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-ink-900 dark:text-white">{appointment.patientName}</p>
                          <p className="text-sm text-ink-500 dark:text-ink-300">{appointment.condition}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200">
                          {appointment.status}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-ink-400 ml-4" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-ink-400 ml-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="p-6 bg-white border-t border-ink-200 dark:bg-ink-950/60 dark:border-ink-800">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-ink-900 dark:text-white">
                              <Activity className="w-5 h-5 text-purple-600" />
                              Reported Symptoms
                            </h3>
                            <ul className="space-y-2">
                              {appointment.symptoms.map((symptom, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                                  <span>{symptom}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-ink-900 dark:text-white">
                              <FileText className="w-5 h-5 text-blue-600" />
                              AI-Recommended Action Items
                            </h3>
                            <ul className="space-y-2">
                              {appointment.aiRecommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                                  <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold text-ink-900 dark:text-white">High Priority Queue</h2>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm dark:bg-red-500/20 dark:text-red-200">
              {topPatients.length} patients waiting
            </span>
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
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg text-ink-900 dark:text-white">{patient.name}</h3>
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full dark:bg-red-500/20 dark:text-red-200">
                              Equity Score: {patient.equityScore}
                            </span>
                          </div>
                          <p className="text-sm text-ink-500 dark:text-ink-300 mb-2">
                            {patient.condition} • Waiting {patient.waitTimeDays} days
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
                        <button
                          onClick={() => toggleQueuePatientDetails(patient.id)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6 bg-white border-t border-ink-200 dark:bg-ink-950/60 dark:border-ink-800">
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
      </div>
    </div>
  )
}

export default DoctorDashboard
