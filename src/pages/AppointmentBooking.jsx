import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { useAuth } from '../contexts/AuthContext'
import { usePatient } from '../hooks/usePatients'
import { getAllAvailableAppointments } from '../services/database'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  MapPin,
  Stethoscope,
  User
} from 'lucide-react'

const SPECIALTIES = [
  { value: 'all', label: 'All Specialties' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'primary_care', label: 'Primary Care' }
]

const SPECIALTY_COLORS = {
  cardiology: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  neurology: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  orthopedics: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  primary_care: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
}

const AppointmentBooking = () => {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const patientId = userId || localStorage.getItem('currentPatientId')
  const { patient } = usePatient(patientId)

  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSpecialty, setFilterSpecialty] = useState('all')
  const [bookedSlot, setBookedSlot] = useState(null)
  const [confirmingSlot, setConfirmingSlot] = useState(null)

  useEffect(() => {
    if (!patientId) {
      navigate('/login')
      return
    }
    loadSlots()
  }, [patientId])

  const loadSlots = async () => {
    setLoading(true)
    try {
      const all = await getAllAvailableAppointments()
      setSlots(all)
    } catch {
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmBook = (slot) => {
    const booking = {
      patientId,
      patientName: patient?.fullName || 'Patient',
      condition: patient?.medicalCondition || '',
      appointmentId: slot.id,
      doctorId: slot.doctorId,
      doctorName: slot.doctorName,
      specialty: slot.specialty,
      clinicName: slot.clinicName,
      address: slot.address,
      time: slot.time,
      erRoom: slot.erRoom,
      roomType: slot.roomType,
      estimatedWaitMinutes: slot.estimatedWaitMinutes,
      bookedAt: new Date().toISOString(),
      type: 'scheduled'
    }
    const existing = JSON.parse(localStorage.getItem('demoBookings') || '[]')
    existing.push(booking)
    localStorage.setItem('demoBookings', JSON.stringify(existing))
    setBookedSlot(booking)
    setConfirmingSlot(null)
  }

  // Group by doctor, show unique doctors with their next few slots
  const filteredSlots = filterSpecialty === 'all'
    ? slots
    : slots.filter(s => s.specialty === filterSpecialty)

  // Group by doctorId
  const byDoctor = {}
  filteredSlots.forEach(slot => {
    if (!byDoctor[slot.doctorId]) {
      byDoctor[slot.doctorId] = { info: slot, slots: [] }
    }
    if (byDoctor[slot.doctorId].slots.length < 4) {
      byDoctor[slot.doctorId].slots.push(slot)
    }
  })
  const doctors = Object.values(byDoctor)

  if (bookedSlot) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Schedule Appointment</h1>
          <Button variant="outline" onClick={() => navigate('/patient/portal')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Portal
          </Button>
        </div>

        <Card className="p-6 border-green-300 bg-green-50/60 dark:border-green-500/40 dark:bg-green-500/10">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-500/20 shrink-0">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-green-600 dark:text-green-400 mb-1">
                Appointment Confirmed
              </p>
              <h3 className="text-xl font-bold text-ink-900 dark:text-white">
                {bookedSlot.doctorName}
              </h3>
              <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">
                {bookedSlot.clinicName} — {bookedSlot.roomType || bookedSlot.erRoom}
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-600 dark:text-ink-300">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Appointment time: {bookedSlot.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {bookedSlot.address}
                </span>
              </div>
              <p className="mt-3 text-sm text-green-700 dark:text-green-300">
                Your appointment is booked. You'll see it in your portal under Scheduled Appointments.
              </p>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => setBookedSlot(null)} variant="outline" size="sm">
                  Book Another
                </Button>
                <Button onClick={() => navigate('/patient/portal')} size="sm">
                  Go to Portal
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Schedule Appointment</h1>
          <p className="text-ink-500 dark:text-ink-300 mt-1">
            Book a future appointment with a specialist
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/patient/portal')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Portal
        </Button>
      </div>

      {/* Specialty Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="h-4 w-4 text-ink-400" />
          <span className="text-sm font-medium text-ink-700 dark:text-ink-300">Specialty:</span>
          <div className="flex gap-2 flex-wrap">
            {SPECIALTIES.map(s => (
              <button
                key={s.value}
                onClick={() => setFilterSpecialty(s.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterSpecialty === s.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:hover:bg-ink-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto" />
            <p className="mt-3 text-sm text-ink-500">Loading available appointments...</p>
          </div>
        </div>
      ) : doctors.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 text-ink-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">No Slots Available</h3>
          <p className="text-sm text-ink-500">Try a different specialty or check back later.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink-500">{doctors.length} provider{doctors.length !== 1 ? 's' : ''} available</p>
          {doctors.map(({ info, slots: docSlots }) => {
            const specialtyColor = SPECIALTY_COLORS[info.specialty] || 'bg-gray-100 text-gray-700'
            const isConfirming = confirmingSlot?.doctorId === info.doctorId

            return (
              <Card key={info.doctorId} className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="rounded-full bg-brand-100 p-3 dark:bg-brand-500/20 shrink-0">
                    <User className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-ink-900 dark:text-white">{info.doctorName}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${specialtyColor}`}>
                        {info.specialty?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-ink-500 mt-0.5">{info.clinicName}</p>
                    <p className="text-xs text-ink-400 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {info.address}
                    </p>
                  </div>
                </div>

                {/* Slot time picker */}
                {isConfirming ? (
                  <div className="rounded-lg bg-brand-50 border border-brand-200 p-4 dark:bg-brand-500/10 dark:border-brand-500/30">
                    <p className="text-sm font-medium text-ink-900 dark:text-white mb-2">
                      Confirm appointment at <strong>{confirmingSlot.time}</strong>?
                    </p>
                    <p className="text-xs text-ink-500 mb-3">
                      <Stethoscope className="h-3 w-3 inline mr-1" />
                      {confirmingSlot.clinicName} · {confirmingSlot.roomType || confirmingSlot.erRoom}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleConfirmBook(confirmingSlot)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm Booking
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmingSlot(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-ink-500 mb-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Available times:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {docSlots.map((slot, i) => (
                        <button
                          key={slot.id || i}
                          onClick={() => setConfirmingSlot(slot)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-ink-200 hover:border-brand-400 hover:bg-brand-50 transition-colors dark:border-ink-700 dark:hover:border-brand-500 dark:hover:bg-brand-500/10"
                        >
                          {slot.time}
                          {slot.estimatedWaitMinutes > 0 && (
                            <span className="ml-1 text-ink-400">~{slot.estimatedWaitMinutes}m wait</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AppointmentBooking
