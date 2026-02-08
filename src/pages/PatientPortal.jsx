import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Lightbulb,
  MapPin,
  RefreshCw,
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
import { getAppointmentById } from '../services/database'

const PatientPortal = () => {
  const navigate = useNavigate()
  const [played, setPlayed] = useState(false)
  const [patientId, setPatientId] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const fetchedMatchIds = useRef(new Set())

  const { patient, loading: patientLoading } = usePatient(patientId)
  const { matches, confirmedMatches, pendingMatches, updateStatus } = usePatientMatches(patientId)
  const { notifications, markAsRead, loading: notificationsLoading } = useNotifications(patientId)

  useEffect(() => {
    const savedPatientId = localStorage.getItem('currentPatientId')
    if (savedPatientId) {
      setPatientId(savedPatientId)
    }
  }, [])

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

  const upcomingAppointments = appointments.filter(apt => apt)
  const newAppointmentsCount = upcomingAppointments.length
  const incompleteActionItems = notifications.filter((notif) => !notif.read)

  if (patientLoading || !patientId) {
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
          <div className="ml-auto">
            <Button asChild className="bg-white text-blue-700 hover:bg-white/90">
              <Link to="/patient/matching">
                <RefreshCw className="mr-2 h-4 w-4" />
                Find Appointments
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
              <div className="text-sm opacity-90">New Appointments</div>
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
          <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Your Upcoming Appointments</h2>
        </div>

        {loadingAppointments ? (
          <p className="text-sm text-ink-500 dark:text-ink-300">Loading appointments...</p>
        ) : upcomingAppointments.length === 0 ? (
          <div className="text-center py-10 text-ink-500 dark:text-ink-300">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-ink-400" />
            <p className="font-medium">No appointments scheduled</p>
            <p className="text-sm mt-1">Check your request tracker for pending requests.</p>
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
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Request Tracker</h2>
          <Badge variant="secondary">
            {pendingMatches.length + confirmedMatches.length} active requests
          </Badge>
        </div>

        {pendingMatches.length === 0 && confirmedMatches.length === 0 ? (
          <div className="text-center py-10 text-ink-500 dark:text-ink-300">
            <Stethoscope className="h-10 w-10 mx-auto mb-3 text-ink-400" />
            <p className="font-medium">No active requests</p>
            <p className="text-sm mt-1">Your doctor requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingMatches.map((match) => (
              <div key={match.id} className="rounded-xl border border-ink-200 overflow-hidden dark:border-ink-800">
                <div className="bg-ink-50 p-5 dark:bg-ink-900/60">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-ink-900 dark:text-white">Doctor Review Pending</h3>
                        <Badge variant="warning" className="text-xs">
                          <Clock className="h-3 w-3" /> Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-ink-500 dark:text-ink-300">
                        We’re reviewing your request for an available slot.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStatus(match.id, 'rejected')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Withdraw Request
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {confirmedMatches.map((match) => (
              <div key={match.id} className="rounded-xl border border-ink-200 overflow-hidden dark:border-ink-800">
                <div className="bg-ink-50 p-5 dark:bg-ink-900/60">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-ink-900 dark:text-white">Appointment Accepted</h3>
                        <Badge variant="success" className="text-xs">
                          <CheckCircle className="h-3 w-3" /> Accepted
                        </Badge>
                      </div>
                      <p className="text-sm text-ink-500 dark:text-ink-300">
                        Your appointment has been confirmed. Check your upcoming appointments.
                      </p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/patient/portal')}>
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <h2 className="text-xl font-semibold text-ink-900 dark:text-white">Action Items</h2>
        </div>

        {notificationsLoading ? (
          <p className="text-sm text-ink-500 dark:text-ink-300">Loading action items...</p>
        ) : incompleteActionItems.length === 0 ? (
          <div className="text-center py-10 text-ink-500 dark:text-ink-300">
            <Lightbulb className="h-10 w-10 mx-auto mb-3 text-ink-400" />
            <p className="font-medium">No action items right now</p>
            <p className="text-sm mt-1">We’ll alert you if anything needs attention.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incompleteActionItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-ink-200 p-5 dark:border-ink-800"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      {item.type === 'doctor-task' ? (
                        <Stethoscope className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Lightbulb className="h-5 w-5 text-purple-600" />
                      )}
                      <h3 className="font-semibold text-ink-900 dark:text-white">
                        {item.title || 'Care Team Update'}
                      </h3>
                    </div>
                    <p className="text-sm text-ink-600 dark:text-ink-300">
                      {item.message || item.body || 'Check your latest care instructions.'}
                    </p>
                    {item.createdAt && (
                      <p className="text-xs text-ink-400 mt-2">
                        {item.createdAt.toDate().toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => markAsRead(item.id)}>
                    Mark Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
            "Hello {patient.fullName}, this is a reminder that your appointment has been confirmed. Please arrive 15 minutes early and bring your ID and insurance card."
          </div>
        )}
      </Card>
    </div>
  )
}

export default PatientPortal
