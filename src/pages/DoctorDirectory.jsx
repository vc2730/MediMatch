import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Search,
  Star,
  Stethoscope,
  Users
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { getAllDoctors } from '../services/database'

const DoctorDirectory = () => {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('all')

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true)
        const doctorsList = await getAllDoctors()
        setDoctors(doctorsList)
      } catch (err) {
        console.error('Error fetching doctors:', err)
        setError('Unable to load doctor directory')
      } finally {
        setLoading(false)
      }
    }
    fetchDoctors()
  }, [])

  const specialties = [
    { value: 'all', label: 'All Specialties' },
    { value: 'primary_care', label: 'Primary Care' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'orthopedics', label: 'Orthopedics' },
    { value: 'neurology', label: 'Neurology' },
    { value: 'dermatology', label: 'Dermatology' },
    { value: 'emergency', label: 'Emergency Medicine' },
    { value: 'gastroenterology', label: 'Gastroenterology' },
    { value: 'pulmonology', label: 'Pulmonology' },
    { value: 'endocrinology', label: 'Endocrinology' },
    { value: 'psychiatry', label: 'Psychiatry' },
    { value: 'ophthalmology', label: 'Ophthalmology' },
    { value: 'ent', label: 'ENT' }
  ]

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch =
      doctor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.clinicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSpecialty =
      specialtyFilter === 'all' ||
      doctor.specialty === specialtyFilter

    return matchesSearch && matchesSpecialty
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">Loading doctors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Find Your Doctor</h1>
            <p className="text-sm opacity-90">Browse our network of healthcare providers</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-6 text-white/90">
          <Users className="h-5 w-5" />
          <span className="text-lg font-semibold">{doctors.length} Providers Available</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search by name, clinic, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950/60 text-ink-900 dark:text-white placeholder:text-ink-400"
            />
          </div>
          <select
            value={specialtyFilter}
            onChange={(e) => setSpecialtyFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950/60 text-ink-900 dark:text-white"
          >
            {specialties.map(spec => (
              <option key={spec.value} value={spec.value}>{spec.label}</option>
            ))}
          </select>
        </div>
      </Card>

      {filteredDoctors.length === 0 ? (
        <Card className="p-12 text-center">
          <Stethoscope className="h-12 w-12 mx-auto mb-4 text-ink-400" />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">No doctors found</h3>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            Try adjusting your search or filters
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <Card key={doctor.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                    {doctor.fullName?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-ink-900 dark:text-white">
                      Dr. {doctor.fullName || 'Unknown'}
                    </h3>
                    <Badge variant="secondary" className="mt-1">
                      {doctor.specialty?.replace('_', ' ') || 'General Practice'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm text-ink-600 dark:text-ink-300">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{doctor.clinicName || 'Private Practice'}</p>
                    {doctor.address && (
                      <p className="text-xs">{doctor.address}, {doctor.city}, {doctor.state} {doctor.zipCode}</p>
                    )}
                  </div>
                </div>

                {doctor.languages && doctor.languages.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <Users className="h-4 w-4 flex-shrink-0" />
                    <span>Languages: {doctor.languages.join(', ')}</span>
                  </div>
                )}

                {doctor.insuranceAccepted && doctor.insuranceAccepted.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <Award className="h-4 w-4 flex-shrink-0" />
                    <span>Accepts: {doctor.insuranceAccepted.slice(0, 3).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Doctor Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 p-3 rounded-lg bg-ink-50 dark:bg-ink-900/60">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {doctor.stats?.totalPatients || 0}
                  </div>
                  <div className="text-xs text-ink-500 dark:text-ink-400">Patients</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {doctor.stats?.yearsExperience || 0}
                  </div>
                  <div className="text-xs text-ink-500 dark:text-ink-400">Years Exp</div>
                </div>
                <div className="text-center flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {doctor.stats?.rating || '5.0'}
                    </span>
                  </div>
                  <div className="text-xs text-ink-500 dark:text-ink-400">Rating</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild className="flex-1" size="sm">
                  <Link to={`/patient/appointments?doctor=${doctor.id}`}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Book
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/patient/profile/${doctor.id}`}>
                    View Profile
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default DoctorDirectory
