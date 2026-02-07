import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Calendar, Volume2, Heart, AlertCircle, CheckCircle, Clock } from 'lucide-react'
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
  const { confirmedMatches, loading: matchesLoading } = usePatientMatches(patientId)
  const { notifications, unreadCount, markAsRead, loading: notificationsLoading } = useNotifications(patientId)

  useEffect(() => {
    // Get patient ID from localStorage
    const savedPatientId = localStorage.getItem('currentPatientId')
    if (savedPatientId) {
      setPatientId(savedPatientId)
    }
  }, [])

  // Fetch appointment details for confirmed matches
  useEffect(() => {
    if (!confirmedMatches || confirmedMatches.length === 0) {
      setAppointments([])
      return
    }

    // Get the IDs of matches we need to fetch
    const matchIds = confirmedMatches.map(m => m.id).join(',')
    const fetchedIds = Array.from(fetchedMatchIds.current).join(',')

    // Only fetch if we have new matches
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

        // Update the ref with the fetched match IDs
        fetchedMatchIds.current = new Set(confirmedMatches.map(m => m.id))
      } catch (error) {
        console.error('Error fetching appointments:', error)
        setAppointments([])
      } finally {
        setLoadingAppointments(false)
      }
    }

    fetchAppointments()
  }, [confirmedMatches])

  const upcomingAppointments = appointments.filter(apt => apt && apt.status === 'matched')
  const nextAppointment = upcomingAppointments[0]

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
          Please complete the intake form to create your profile.
        </p>
        <Button onClick={() => navigate('/patient/intake')}>
          Go to Intake Form
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">Patient Portal</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">
          Welcome, {patient.fullName}
        </h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          View your appointments, notifications, and health updates.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* Upcoming Appointment */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand-100 p-3 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Upcoming Appointment</p>
              {loadingAppointments ? (
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">Loading...</p>
              ) : nextAppointment ? (
                <p className="mt-1 text-lg font-semibold text-ink-900 dark:text-white">
                  {nextAppointment.date?.toDate().toLocaleDateString()} at {nextAppointment.time}
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">No appointments scheduled</p>
              )}
            </div>
          </div>

          {nextAppointment ? (
            <>
              <p className="mt-4 text-sm text-ink-600 dark:text-ink-300">
                <strong>{patient.specialty?.replace('_', ' ')}</strong> visit with {nextAppointment.doctorName}
              </p>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                {nextAppointment.clinicName}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="success" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Confirmed
                </Badge>
              </div>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/patient/matching')}>
                Find More Appointments
              </Button>
            </>
          ) : confirmedMatches.length === 0 ? (
            <>
              <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">
                You don't have any confirmed appointments yet.
              </p>
              <Button className="mt-4" onClick={() => navigate('/patient/matching')}>
                Find Appointments
              </Button>
            </>
          ) : (
            <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">Loading appointment details...</p>
          )}
        </Card>

        {/* Notifications */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-ink-100 p-3 text-ink-700 dark:bg-ink-800 dark:text-ink-200 relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Notifications</p>
              <p className="mt-1 text-lg font-semibold text-ink-900 dark:text-white">
                {notificationsLoading ? 'Loading...' : `${notifications.length} Total`}
              </p>
            </div>
          </div>

          {notificationsLoading ? (
            <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">Loading notifications...</p>
          ) : notifications.length > 0 ? (
            <ul className="mt-4 space-y-3 max-h-48 overflow-y-auto">
              {notifications.slice(0, 5).map((notif) => (
                <li
                  key={notif.id}
                  className={`text-sm border-l-2 pl-3 py-1 cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-800 rounded transition ${
                    notif.read
                      ? 'border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400'
                      : 'border-brand-500 text-ink-900 dark:text-white font-medium'
                  }`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-2">
                    {notif.type === 'match_found' && <Heart className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />}
                    {notif.type === 'appointment_reminder' && <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className="font-semibold text-xs">{notif.title}</p>
                      <p className="text-xs">{notif.message}</p>
                      <p className="text-xs text-ink-400 dark:text-ink-500 mt-1">
                        {notif.createdAt?.toDate().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">No notifications yet.</p>
          )}
        </Card>
      </div>

      {/* All Appointments */}
      {upcomingAppointments.length > 1 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink-900 dark:text-white mb-4">
            All Appointments ({upcomingAppointments.length})
          </h2>
          <div className="space-y-3">
            {upcomingAppointments.map((apt, idx) => (
              <div key={idx} className="border border-ink-200 dark:border-ink-700 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-ink-900 dark:text-white">
                      {apt.doctorName}
                    </h4>
                    <p className="text-sm text-ink-500 dark:text-ink-400">{apt.clinicName}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-ink-600 dark:text-ink-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {apt.date?.toDate().toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {apt.time}
                      </span>
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Confirmed
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Voice Notification (Placeholder) */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Voice Notification</h2>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">
              Send a personalized reminder via voice (FlowGlad integration).
            </p>
          </div>
          <Button onClick={() => setPlayed(true)} variant="outline">
            <Volume2 className="h-4 w-4 mr-2" />
            Play Voice Notification
          </Button>
        </div>
        {played && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            Voice notification feature will be available once FlowGlad integration is complete (Person 3).
          </div>
        )}
      </Card>
    </div>
  )
}

export default PatientPortal
