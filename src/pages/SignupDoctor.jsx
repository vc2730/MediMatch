import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'
import { registerDoctor, getAuthErrorMessage } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'

const SignupDoctor = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    clinicName: '',
    specialty: 'primary_care',
    zip: '',
    licenseNumber: '',
    yearsExperience: '',
    totalPatients: ''
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setSubmitting(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      setSubmitting(false)
      return
    }

    try {
      // Prepare doctor data for Firestore
      const doctorData = {
        fullName: formData.name,
        phone: formData.phone || 'Not provided',
        clinicName: formData.clinicName,
        specialty: formData.specialty,
        specialties: [formData.specialty],
        zipCode: formData.zip,
        licenseNumber: formData.licenseNumber,
        acceptedInsurance: ['Medicaid', 'Medicare', 'Commercial PPO', 'Private'],
        availableSlots: 0,
        totalMatches: 0,
        stats: {
          yearsExperience: parseInt(formData.yearsExperience) || 0,
          totalPatients: parseInt(formData.totalPatients) || 0,
          rating: 5.0
        }
      }

      console.log('Registering doctor...')
      const { user } = await registerDoctor(
        formData.email,
        formData.password,
        doctorData
      )

      console.log('✅ Doctor registered successfully')

      // Update auth context
      login(user.uid, 'doctor', doctorData)

      // Navigate to doctor dashboard
      navigate('/doctor/dashboard')
    } catch (err) {
      console.error('Error signing up:', err)
      setError(getAuthErrorMessage(err.code))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-ink-50 dark:from-ink-950 dark:to-green-950 p-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-ink-900 dark:text-white mb-2">
            Create Doctor Account
          </h1>
          <p className="text-ink-600 dark:text-ink-300">
            Join MediMatch to connect with patients who need your care
          </p>
        </div>

        <Card className="p-8">
          <form className="grid gap-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-ink-900 dark:text-white">Account Information</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Dr. John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="dr.smith@example.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-ink-500 dark:text-ink-400">At least 6 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="border-t border-ink-200 dark:border-ink-700 pt-4 space-y-4">
              <h3 className="font-semibold text-ink-900 dark:text-white">Professional Information</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clinicName">Clinic/Hospital Name *</Label>
                  <Input
                    id="clinicName"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
                    placeholder="City Medical Center"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialty">Primary Specialty *</Label>
                  <Select id="specialty" name="specialty" value={formData.specialty} onChange={handleChange}>
                    <SelectItem value="primary_care">Primary Care</SelectItem>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="orthopedics">Orthopedics</SelectItem>
                    <SelectItem value="neurology">Neurology</SelectItem>
                    <SelectItem value="dermatology">Dermatology</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Medical License Number *</Label>
                  <Input
                    id="licenseNumber"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="MD123456"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">Clinic ZIP Code *</Label>
                <Input
                  id="zip"
                  name="zip"
                  value={formData.zip}
                  onChange={handleChange}
                  placeholder="10001"
                  required
                />
              </div>
            </div>

            {/* Professional Stats */}
            <div className="border-t border-ink-200 dark:border-ink-700 pt-4 space-y-4">
              <h3 className="font-semibold text-ink-900 dark:text-white">Professional Experience</h3>
              <p className="text-sm text-ink-500 dark:text-ink-400">
                These stats will be visible to patients browsing the doctor directory.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Years of Experience *</Label>
                  <Input
                    id="yearsExperience"
                    name="yearsExperience"
                    type="number"
                    min="0"
                    max="70"
                    value={formData.yearsExperience}
                    onChange={handleChange}
                    placeholder="10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="totalPatients">Total Patients Treated *</Label>
                  <Input
                    id="totalPatients"
                    name="totalPatients"
                    type="number"
                    min="0"
                    value={formData.totalPatients}
                    onChange={handleChange}
                    placeholder="500"
                    required
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-500/30">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Your initial rating will be set to 5.0 stars. This will be updated based on patient feedback.
                </p>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-500/30">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Note:</strong> By default, your profile will accept Medicaid, Medicare, Commercial PPO, and Private insurance.
                You can update this in your dashboard settings after registration.
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Doctor Account'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ink-600 dark:text-ink-300">
              Already have an account?{' '}
              <Link to="/login" className="text-green-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-ink-600 dark:text-ink-300"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        <div className="text-xs text-ink-500 dark:text-ink-400 text-center mt-4">
          <p>* Required fields</p>
        </div>
      </div>
    </div>
  )
}

export default SignupDoctor
