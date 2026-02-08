import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  Camera,
  CheckCircle,
  Loader2,
  Save,
  Sparkles,
  Upload,
  X
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { useAuth } from '../contexts/AuthContext'
import { usePatient } from '../hooks/usePatients'
import { updateUserProfile } from '../services/database'

const GEMINI_MODEL = 'gemini-2.5-flash'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const SPECIALTIES = [
  'primary_care',
  'cardiology',
  'orthopedics',
  'neurology',
  'emergency',
  'pulmonology',
  'gastroenterology',
  'psychiatry'
]

const PatientProfile = () => {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const patientId = userId || localStorage.getItem('currentPatientId')
  const { patient, loading: patientLoading } = usePatient(patientId)

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [aiError, setAiError] = useState('')
  const [uploadedPhoto, setUploadedPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const [formData, setFormData] = useState({
    medicalCondition: '',
    symptoms: '',
    urgencyLevel: 5,
    specialty: '',
    zipCode: '',
    insurance: '',
    transportation: '',
    language: 'English',
    income: ''
  })

  useEffect(() => {
    if (patient) {
      setFormData({
        medicalCondition: patient.medicalCondition || '',
        symptoms: patient.symptoms || '',
        urgencyLevel: patient.urgencyLevel || 5,
        specialty: patient.specialty || '',
        zipCode: patient.zipCode || '',
        insurance: patient.insurance || '',
        transportation: patient.transportation || '',
        language: patient.language || 'English',
        income: patient.income || ''
      })
    }
  }, [patient])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    setSuccess(false)
  }

  // ─── Photo handling ───────────────────────────────────────────────────────

  const processPhotoFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAiError('Please upload an image file (JPG, PNG, etc.).')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setAiError('Image must be smaller than 4MB.')
      return
    }
    setAiError('')
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
    setUploadedPhoto(file)
  }

  const handlePhotoUpload = (e) => processPhotoFile(e.target.files?.[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    processPhotoFile(e.dataTransfer.files?.[0])
  }

  const removePhoto = () => {
    setUploadedPhoto(null)
    setPhotoPreview(null)
    setAiAnalysis(null)
  }

  const convertImageToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const parseGeminiJson = (text) => {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Could not parse AI response')
    return JSON.parse(match[0])
  }

  // ─── Gemini analysis ──────────────────────────────────────────────────────

  const analyzeWithGemini = async () => {
    if (!formData.medicalCondition && !uploadedPhoto) {
      setAiError('Add a condition description or upload a photo to analyze.')
      return
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      setAiError('Gemini API key not configured.')
      return
    }

    setAiError('')
    setAnalyzing(true)
    try {
      const prompt = `You are an emergency medical triage AI. Based on the patient information below${
        uploadedPhoto ? ' and the attached photo' : ''
      }, determine:
1. Urgency level (1–10, where 10 = immediate life-threatening, 1 = routine)
2. Most appropriate medical specialty
3. Brief clinical reasoning

Patient Info:
- Condition: ${formData.medicalCondition || '(see photo)'}
- Symptoms: ${formData.symptoms || 'not provided'}
${uploadedPhoto ? '- Photo: analyze visible injuries, rashes, swelling, or other visual symptoms.' : ''}

Respond in JSON only:
{
  "urgencyLevel": <1-10>,
  "specialty": "<one of: ${SPECIALTIES.join(', ')}>",
  "reasoning": "<2-3 sentence clinical explanation>"
}`

      const parts = [{ text: prompt }]

      if (uploadedPhoto) {
        const base64 = await convertImageToBase64(uploadedPhoto)
        parts.push({
          inline_data: {
            mime_type: uploadedPhoto.type || 'image/jpeg',
            data: base64
          }
        })
      }

      const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      })

      if (!res.ok) throw new Error(`Gemini API error ${res.status}`)

      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
      const analysis = parseGeminiJson(text)

      const normalizedSpecialty = SPECIALTIES.includes(analysis.specialty)
        ? analysis.specialty
        : 'primary_care'

      setAiAnalysis({ ...analysis, specialty: normalizedSpecialty })
      setFormData(prev => ({
        ...prev,
        urgencyLevel: Number(analysis.urgencyLevel) || prev.urgencyLevel,
        specialty: normalizedSpecialty
      }))
    } catch (err) {
      console.error('Gemini error:', err)
      setAiError('AI analysis failed. Please try again or fill in manually.')
    } finally {
      setAnalyzing(false)
    }
  }

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      await updateUserProfile(patientId, formData)
      setSuccess(true)
      setTimeout(() => navigate('/patient/portal'), 1500)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Loading / not found states ───────────────────────────────────────────

  if (patientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto" />
          <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-ink-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-2">Profile Not Found</h2>
        <Button onClick={() => navigate('/patient/portal')}>Back to Portal</Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/patient/portal')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portal
        </Button>
      </div>

      {/* AI Photo Analysis Card */}
      <Card className="p-6 border-brand-200 dark:border-brand-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-xl bg-brand-100 p-2 dark:bg-brand-500/20">
            <Brain className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white">AI Triage Analysis</h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Upload a photo of your condition — Gemini will assess urgency and type of care needed
            </p>
          </div>
        </div>

        {/* Photo upload area */}
        {!photoPreview ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-brand-400 bg-brand-50 dark:bg-brand-500/10'
                : 'border-ink-200 hover:border-brand-300 dark:border-ink-700 dark:hover:border-brand-500'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Camera className="h-10 w-10 mx-auto mb-3 text-ink-400" />
            <p className="text-sm font-medium text-ink-700 dark:text-ink-300">
              Take a photo or upload an image
            </p>
            <p className="text-xs text-ink-400 mt-1">
              Drag &amp; drop, click to browse, or use your camera · Max 4MB
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-4 pointer-events-none">
              <Upload className="h-4 w-4 mr-2" />
              Choose Photo
            </Button>
          </div>
        ) : (
          <div className="relative">
            <img
              src={photoPreview}
              alt="Condition preview"
              className="w-full max-h-64 object-contain rounded-xl border border-ink-200 dark:border-ink-700"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute top-2 right-2 rounded-full bg-ink-900/60 p-1 text-white hover:bg-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Analyze button */}
        <Button
          type="button"
          onClick={analyzeWithGemini}
          disabled={analyzing}
          className="mt-4 w-full"
          size="lg"
        >
          {analyzing ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing with Gemini...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Analyze &amp; Auto-Fill</>
          )}
        </Button>

        {aiError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {aiError}
          </div>
        )}

        {aiAnalysis && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-500/30 dark:bg-green-500/10">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                AI Assessment Complete
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm mb-2">
              <div className="rounded-lg bg-white/60 px-3 py-2 dark:bg-ink-900/40">
                <p className="text-xs text-ink-500">Urgency</p>
                <p className="font-bold text-ink-900 dark:text-white">{aiAnalysis.urgencyLevel}/10</p>
              </div>
              <div className="rounded-lg bg-white/60 px-3 py-2 dark:bg-ink-900/40">
                <p className="text-xs text-ink-500">Care Type</p>
                <p className="font-bold text-ink-900 dark:text-white capitalize">
                  {aiAnalysis.specialty?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <p className="text-xs text-ink-600 dark:text-ink-300 italic">{aiAnalysis.reasoning}</p>
          </div>
        )}
      </Card>

      {/* Main form */}
      <Card className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white mb-2">
            Update Your Health Information
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            Keep your information current to get the best ER room matches
          </p>
        </div>

        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-500/30 dark:bg-green-500/10">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Profile updated successfully! Redirecting...
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="medicalCondition">Current Medical Condition *</Label>
            <Input
              id="medicalCondition"
              name="medicalCondition"
              value={formData.medicalCondition}
              onChange={handleChange}
              placeholder="e.g., Chest pain, Severe headache, Broken bone"
              required
            />
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Update this if your condition has changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="symptoms">Symptoms</Label>
            <Textarea
              id="symptoms"
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              placeholder="Describe your current symptoms in detail"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="urgencyLevel">Urgency Level (1–10)</Label>
              {aiAnalysis && (
                <span className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI-assessed
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                id="urgencyLevel"
                name="urgencyLevel"
                min="1"
                max="10"
                value={formData.urgencyLevel}
                onChange={handleChange}
                className="flex-1"
              />
              <span className="text-lg font-semibold text-ink-900 dark:text-white w-12 text-center">
                {formData.urgencyLevel}
              </span>
            </div>
            <div className="flex justify-between text-xs text-ink-500 dark:text-ink-400">
              <span>Not urgent</span>
              <span>Life-threatening</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="specialty">Type of Care Needed *</Label>
              {aiAnalysis && (
                <span className="text-xs text-brand-600 dark:text-brand-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> AI-assessed
                </span>
              )}
            </div>
            <Select
              id="specialty"
              name="specialty"
              value={formData.specialty}
              onChange={handleChange}
              required
            >
              <option value="">Select specialty...</option>
              <option value="emergency">General Emergency</option>
              <option value="cardiology">Cardiac Emergency</option>
              <option value="neurology">Neurological Emergency</option>
              <option value="orthopedics">Trauma / Orthopedics</option>
              <option value="pulmonology">Respiratory / Pulmonology</option>
              <option value="gastroenterology">Gastroenterology</option>
              <option value="psychiatry">Psychiatric Emergency</option>
              <option value="primary_care">Urgent Care</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zipCode">Your Zip Code *</Label>
            <Input
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="12345"
              maxLength={5}
              required
            />
          </div>

          <div className="border-t border-ink-200 dark:border-ink-800 pt-6">
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-1">
              Equity Factors
            </h3>
            <p className="text-sm text-ink-500 dark:text-ink-300 mb-6">
              Helps prioritize patients with barriers to healthcare access
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance Status</Label>
                <Select id="insurance" name="insurance" value={formData.insurance} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="Private">Private Insurance</option>
                  <option value="Medicare">Medicare</option>
                  <option value="Medicaid">Medicaid</option>
                  <option value="Uninsured">Uninsured</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transportation">Transportation</Label>
                <Select id="transportation" name="transportation" value={formData.transportation} onChange={handleChange}>
                  <option value="">Select...</option>
                  <option value="Own vehicle">Own Vehicle</option>
                  <option value="Public transit">Public Transit</option>
                  <option value="Ambulance">Ambulance</option>
                  <option value="Limited">Limited / None</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <Select id="language" name="language" value={formData.language} onChange={handleChange}>
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="Mandarin">Mandarin</option>
                  <option value="Vietnamese">Vietnamese</option>
                  <option value="Other">Other</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="income">Income Level</Label>
                <Select id="income" name="income" value={formData.income} onChange={handleChange}>
                  <option value="">Prefer not to say</option>
                  <option value="Low">Low Income</option>
                  <option value="Moderate">Moderate Income</option>
                  <option value="High">High Income</option>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Changes</>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/patient/portal')} disabled={saving}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default PatientProfile
