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
import { CheckCircle, Loader2, Upload, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`
const SPECIALTIES = [
  'primary_care',
  'cardiology',
  'orthopedics',
  'neurology',
  'dermatology',
  'emergency',
  'gastroenterology',
  'pulmonology',
  'endocrinology',
  'psychiatry',
  'ophthalmology',
  'ent'
]

const Intake = () => {
  const navigate = useNavigate()
  const { user, isDoctor, isPatient, login } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiError, setAiError] = useState('')
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
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

  const processPhotoFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAiError('Please upload an image file (JPG, PNG, GIF).')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setAiError('Image must be smaller than 4MB.')
      return
    }

    setAiError('')
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result)
    }
    reader.readAsDataURL(file)
    setUploadedPhoto(file)
  }

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0]
    processPhotoFile(file)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    processPhotoFile(file)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removePhoto = () => {
    setUploadedPhoto(null)
    setPhotoPreview(null)
  }

  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result.split(',')[1]
        resolve(base64String)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const parseGeminiJson = (text) => {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse AI response')
    }
    return JSON.parse(jsonMatch[0])
  }

  const analyzeWithGemini = async () => {
    if (!formData.condition || !formData.symptoms) {
      setAiError('Please fill in the primary condition and symptoms before analyzing.')
      return
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      setAiError('Missing Gemini API key. Add VITE_GEMINI_API_KEY to your .env.local file.')
      return
    }

    setAiError('')
    setAnalyzing(true)
    try {
      const basePrompt = `You are a medical triage assistant. Based on the following patient information${
        uploadedPhoto ? ' and the provided image' : ''
      }, provide:
1. An urgency level score (1-10, where 10 is emergency/immediate and 1 is routine)
2. The recommended medical specialty

Patient Information:
- Primary Condition: ${formData.condition}
- Symptoms & Details: ${formData.symptoms}
${uploadedPhoto ? '\n- Visual Information: Analyze the provided image for any visible symptoms, conditions, or relevant medical details.' : ''}

Please respond in JSON format:
{
  "urgencyLevel": <number 1-10>,
  "specialty": "<specialty_name>",
  "reasoning": "<brief explanation${uploadedPhoto ? ', including observations from the image' : ''}>"
}

Valid specialties are: ${SPECIALTIES.join(', ')}.`

      const parts = [{ text: basePrompt }]

      if (uploadedPhoto) {
        const base64Image = await convertImageToBase64(uploadedPhoto)
        const mimeType = uploadedPhoto.type || 'image/jpeg'
        // Store for Dedalus multimodal care coordination
        sessionStorage.setItem('symptomImageBase64', base64Image)
        sessionStorage.setItem('symptomImageMime', mimeType)
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Image
          }
        })
      }

      const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get analysis from Gemini API')
      }

      const data = await response.json()
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const analysis = parseGeminiJson(generatedText)
      const normalizedSpecialty = SPECIALTIES.includes(analysis.specialty) ? analysis.specialty : 'primary_care'

      setAiAnalysis(analysis)
      setFormData((prev) => ({
        ...prev,
        urgency: String(analysis.urgencyLevel || prev.urgency),
        specialty: normalizedSpecialty
      }))
      return analysis
    } catch (error) {
      console.error('Error analyzing with Gemini:', error)
      setAiError('Error getting AI analysis. Please try again.')
      return null
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      // Auto-run Gemini analysis if condition + symptoms filled but not yet analyzed
      let freshAnalysis = aiAnalysis
      if (!freshAnalysis && formData.condition && formData.symptoms) {
        freshAnalysis = await analyzeWithGemini()
      }

      // Store symptom image for Dedalus multimodal coordination if not already stored
      if (uploadedPhoto && !sessionStorage.getItem('symptomImageBase64')) {
        const base64Image = await convertImageToBase64(uploadedPhoto)
        sessionStorage.setItem('symptomImageBase64', base64Image)
        sessionStorage.setItem('symptomImageMime', uploadedPhoto.type || 'image/jpeg')
      }

      const patientId = isPatient && user?.uid ? user.uid : `patient_${Date.now()}`

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
        urgencyLevel: freshAnalysis?.urgencyLevel ? parseInt(freshAnalysis.urgencyLevel) : parseInt(formData.urgency),
        specialty: freshAnalysis?.specialty || formData.specialty,
        aiReasoning: freshAnalysis?.reasoning || null,

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

      if (!isDoctor) {
        login(patientId, 'patient')
        navigate('/patient/matching')
      } else {
        navigate('/doctor/dashboard')
      }
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

          {/* Insurance and Transportation */}
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

          {/* AI Analysis Button */}
          <div className="border-t border-ink-200 dark:border-ink-700 pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-ink-900 dark:text-white mb-2">
                  AI-Powered Urgency & Specialty Analysis (Optional)
                </h3>
                <p className="text-sm text-ink-500 dark:text-ink-300 mb-4">
                  Not sure about urgency or specialty? Upload a photo (optional) and click below to get AI recommendations that will automatically fill the fields.
                </p>
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label htmlFor="photo-upload">Upload Photo (Optional)</Label>
                {!photoPreview ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`rounded-lg border-2 border-dashed px-6 py-8 text-sm transition ${
                      isDragging
                        ? 'border-brand-500 bg-brand-50/70 text-brand-700 dark:bg-brand-500/10'
                        : 'border-ink-300 dark:border-ink-600 bg-ink-50 dark:bg-ink-800 text-ink-600 dark:text-ink-300'
                    }`}
                  >
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label htmlFor="photo-upload" className="flex cursor-pointer items-center justify-center gap-2">
                      <Upload className="h-5 w-5" />
                      <span>Drag & drop or click to upload a photo of symptoms or condition</span>
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-lg border border-ink-200 dark:border-ink-700 p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={photoPreview}
                        alt="Uploaded symptom"
                        className="h-8 w-8 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink-900 dark:text-white">
                          Photo uploaded successfully
                        </p>
                        <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
                          This image will be analyzed along with your symptoms
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="rounded-lg p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  Supported formats: JPG, PNG, GIF. Max size: 4MB
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={analyzeWithGemini}
                disabled={analyzing || !formData.condition || !formData.symptoms}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing{uploadedPhoto ? ' with photo' : ''}...
                  </>
                ) : (
                  `Get Urgency and Specialty Analysis${uploadedPhoto ? ' (with photo)' : ''}`
                )}
              </Button>

              {aiError && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                  {aiError}
                </div>
              )}

              {/* Display AI Analysis Results */}
              {aiAnalysis && (
                <div className="rounded-lg border border-brand-200 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                    <h4 className="font-semibold text-brand-900 dark:text-brand-200">
                      Analysis Complete
                    </h4>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-brand-600 dark:text-brand-400">Urgency Level</Label>
                      <div className="text-2xl font-bold text-brand-900 dark:text-brand-100">
                        {aiAnalysis.urgencyLevel}/10
                      </div>
                      <p className="text-xs text-brand-700 dark:text-brand-300">
                        {aiAnalysis.urgencyLevel >= 8
                          ? 'High Priority'
                          : aiAnalysis.urgencyLevel >= 5
                            ? 'Moderate Priority'
                            : 'Low Priority'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-brand-600 dark:text-brand-400">Recommended Specialty</Label>
                      <div className="text-lg font-semibold text-brand-900 dark:text-brand-100 capitalize">
                        {String(aiAnalysis.specialty || '').replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  {aiAnalysis.reasoning && (
                    <div className="pt-2 border-t border-brand-200 dark:border-brand-500/40">
                      <Label className="text-xs text-brand-600 dark:text-brand-400">AI Reasoning</Label>
                      <p className="text-sm text-brand-700 dark:text-brand-300 mt-1">
                        {aiAnalysis.reasoning}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Urgency and Specialty Fields */}
          <div className="border-t border-ink-200 dark:border-ink-700 pt-4">
            <h3 className="font-semibold text-ink-900 dark:text-white mb-4">
              Urgency & Specialty
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
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

              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty Needed *</Label>
                <Select id="specialty" name="specialty" value={formData.specialty} onChange={handleChange}>
                  <SelectItem value="primary_care">Primary Care</SelectItem>
                  <SelectItem value="cardiology">Cardiology</SelectItem>
                  <SelectItem value="orthopedics">Orthopedics</SelectItem>
                  <SelectItem value="neurology">Neurology</SelectItem>
                  <SelectItem value="dermatology">Dermatology</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="gastroenterology">Gastroenterology</SelectItem>
                  <SelectItem value="pulmonology">Pulmonology</SelectItem>
                  <SelectItem value="endocrinology">Endocrinology</SelectItem>
                  <SelectItem value="psychiatry">Psychiatry</SelectItem>
                  <SelectItem value="ophthalmology">Ophthalmology</SelectItem>
                  <SelectItem value="ent">ENT</SelectItem>
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
