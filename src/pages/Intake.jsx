import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectItem } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { saveUserProfile } from '../services/database'
import { Timestamp } from 'firebase/firestore'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Intake = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    condition: '',
    symptoms: '',
    urgency: '5',
    specialty: 'primary_care',
    zip: '',
    insurance: 'Medicaid',
    transportation: 'Public transit',
    phone: '',
    email: ''
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      // Generate unique patient ID
      const patientId = `patient_${Date.now()}`

      // Calculate wait time days (starts at 0)
      const registeredDate = new Date()

      // Prepare patient data for Firestore
      const patientData = {
        role: 'patient',
        fullName: formData.name,
        email: formData.email || `${patientId}@medimatch.com`,
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
        income: formData.insurance === 'Medicaid' || formData.insurance === 'Uninsured' ? 'Low' : 'Medium',

        // Tracking
        waitTimeDays: 0,
        registeredAt: Timestamp.fromDate(registeredDate),
        createdAt: Timestamp.now(),
        lastMatchedAt: null,
        totalMatches: 0
      }

      console.log('Saving patient to Firestore:', patientId)
      await saveUserProfile(patientId, patientData)

      console.log('✅ Patient saved successfully')

      // Store patient ID in localStorage and auth context
      login(patientId, 'patient')

      // Navigate to patient matching page
      navigate('/patient/matching')
    } catch (error) {
      console.error('Error submitting intake:', error)
      alert('Error submitting form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">New Patient</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">Patient Intake Form</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Complete this form to get matched with available appointments based on your needs.
        </p>
      </div>

      <Card className="p-6">
        <form className="grid gap-6" onSubmit={handleSubmit}>
          {/* Personal Information */}
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jane@example.com"
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

          {/* Medical Information */}
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

          {/* Equity Factors */}
          <div className="border-t border-ink-200 dark:border-ink-700 pt-4">
            <h3 className="font-semibold text-ink-900 dark:text-white mb-4">
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
                  Submitting...
                </>
              ) : (
                'Submit & Find Matches'
              )}
            </Button>
          </div>
        </form>
      </Card>

      <div className="text-xs text-ink-500 dark:text-ink-400 text-center">
        <p>* Required fields</p>
        <p className="mt-1">Your information will be used to match you with the best available appointments.</p>
      </div>
    </div>
  )
}

export default Intake
