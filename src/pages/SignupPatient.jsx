import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { registerPatient, getAuthErrorMessage } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'

const SignupPatient = () => {
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
    condition: '',
    symptoms: '',
    urgency: '5',
    specialty: 'primary_care',
    zip: '',
    insurance: 'Medicaid',
    transportation: 'Public transit'
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
      // Prepare patient data for Firestore
      const patientData = {
        fullName: formData.name,
        phone: formData.phone || 'Not provided',

        // Medical info
        medicalCondition: formData.condition,
        symptoms: formData.symptoms,
        urgencyLevel: parseInt(formData.urgency),
        specialty: formData.specialty,

        // Demographic & equity info
        zipCode: formData.zip,
        insurance: formData.insurance,
        transportation: formData.transportation,
        language: 'English',
        income: formData.insurance === 'Medicaid' || formData.insurance === 'Uninsured' ? 'Low' : 'Medium'
      }

      console.log('Registering patient...')
      const { user, patientId } = await registerPatient(
        formData.email,
        formData.password,
        patientData
      )

      console.log('✅ Patient registered successfully')

      // Update auth context
      login(user.uid, 'patient', patientData)

      // Navigate to patient portal
      navigate('/patient/portal')
    } catch (err) {
      console.error('Error signing up:', err)
      setError(getAuthErrorMessage(err.code))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-ink-50 dark:from-ink-950 dark:to-brand-950 p-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-ink-900 dark:text-white mb-2">
            Create Patient Account
          </h1>
          <p className="text-ink-600 dark:text-ink-300">
            Sign up to find appointments and get matched with healthcare providers
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
                    placeholder="Jane Smith"
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
                    placeholder="jane@example.com"
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
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
            </div>

            {/* Medical Information */}
            <div className="border-t border-ink-200 dark:border-ink-700 pt-4 space-y-4">
              <h3 className="font-semibold text-ink-900 dark:text-white">Medical Information</h3>

              <div className="space-y-2">
                <Label htmlFor="condition">Primary Condition *</Label>
                <Input
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  placeholder="e.g., Chest pain, Headaches, Joint pain"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Symptoms & Details</Label>
                <Textarea
                  id="symptoms"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  placeholder="Describe your symptoms, when they started, and any relevant details..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty Needed *</Label>
                  <Select id="specialty" name="specialty" value={formData.specialty} onChange={handleChange}>
                    <SelectItem value="primary_care">Primary Care</SelectItem>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="orthopedics">Orthopedics</SelectItem>
                    <SelectItem value="neurology">Neurology</SelectItem>
                    <SelectItem value="dermatology">Dermatology</SelectItem>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level *</Label>
                  <Select id="urgency" name="urgency" value={formData.urgency} onChange={handleChange}>
                    <SelectItem value="10">10 - Emergency (Immediate)</SelectItem>
                    <SelectItem value="9">9 - Very Urgent</SelectItem>
                    <SelectItem value="8">8 - Urgent</SelectItem>
                    <SelectItem value="7">7 - High</SelectItem>
                    <SelectItem value="6">6 - Moderate-High</SelectItem>
                    <SelectItem value="5">5 - Moderate</SelectItem>
                    <SelectItem value="4">4 - Low-Moderate</SelectItem>
                    <SelectItem value="3">3 - Low</SelectItem>
                    <SelectItem value="2">2 - Very Low</SelectItem>
                    <SelectItem value="1">1 - Routine</SelectItem>
                  </Select>
                </div>
              </div>
            </div>

            {/* Equity Factors */}
            <div className="border-t border-ink-200 dark:border-ink-700 pt-4 space-y-4">
              <h3 className="font-semibold text-ink-900 dark:text-white">
                Additional Information (helps with matching)
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="insurance">Insurance Type *</Label>
                  <Select id="insurance" name="insurance" value={formData.insurance} onChange={handleChange}>
                    <SelectItem value="Medicaid">Medicaid</SelectItem>
                    <SelectItem value="Medicare">Medicare</SelectItem>
                    <SelectItem value="Commercial PPO">Commercial PPO</SelectItem>
                    <SelectItem value="Private">Private Insurance</SelectItem>
                    <SelectItem value="Uninsured">Uninsured</SelectItem>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transportation">Transportation Access *</Label>
                  <Select
                    id="transportation"
                    name="transportation"
                    value={formData.transportation}
                    onChange={handleChange}
                  >
                    <SelectItem value="Personal vehicle">Personal Vehicle</SelectItem>
                    <SelectItem value="Family driver">Family/Friend Driver</SelectItem>
                    <SelectItem value="Public transit">Public Transit</SelectItem>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Community shuttle">Community Shuttle</SelectItem>
                    <SelectItem value="Rideshare support">Rideshare Support</SelectItem>
                    <SelectItem value="Limited">Limited/No Transportation</SelectItem>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account & Continue'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ink-600 dark:text-ink-300">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 hover:underline font-medium">
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
          <p className="mt-1">Your information will be used to match you with the best available appointments.</p>
        </div>
      </div>
    </div>
  )
}

export default SignupPatient
