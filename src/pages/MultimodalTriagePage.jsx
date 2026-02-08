import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import MultimodalIntake from '../components/MultimodalIntake'
import { analyzeMultimodalSymptoms } from '../services/multimodalTriage'
import { useAuth } from '../contexts/AuthContext'
import { usePatient } from '../hooks/usePatients'
import {
  ArrowLeft,
  Brain,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Activity,
  Eye,
  Mic,
  Video as VideoIcon,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

const MultimodalTriagePage = () => {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const patientId = userId || localStorage.getItem('currentPatientId')
  const { patient } = usePatient(patientId)

  const [analysis, setAnalysis] = useState(null)
  const [showFullAnalysis, setShowFullAnalysis] = useState(false)

  const handleAnalysisComplete = async (multimodalData) => {
    console.log('🎯 Starting multimodal analysis...')

    const result = await analyzeMultimodalSymptoms({
      ...multimodalData,
      patient
    })

    setAnalysis(result)
    console.log('✅ Analysis complete:', result)

    // Store for use in PatientMatching
    sessionStorage.setItem('multimodalAnalysis', JSON.stringify(result))

    // Update patient urgency based on AI analysis
    if (result.urgencyScore && result.triageLevel) {
      sessionStorage.setItem('aiTriageLevel', result.triageLevel)
      sessionStorage.setItem('aiUrgencyScore', result.urgencyScore)
    }
  }

  const proceedToMatching = () => {
    navigate('/patient/matching')
  }

  const getSeverityColor = (severity) => {
    if (severity === 'severe' || severity === 'critical') return 'text-red-600'
    if (severity === 'moderate') return 'text-orange-600'
    return 'text-yellow-600'
  }

  const getTriageColor = (level) => {
    if (level <= 1) return 'bg-red-600 text-white'
    if (level === 2) return 'bg-orange-500 text-white'
    if (level === 3) return 'bg-yellow-500 text-white'
    return 'bg-blue-500 text-white'
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-900 dark:text-white flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            AI-Powered Multimodal Triage
          </h1>
          <p className="text-ink-500 dark:text-ink-300 mt-2">
            Advanced symptom assessment using vision, audio, and movement analysis
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/patient/portal')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Multimodal Intake Form */}
      {!analysis && (
        <MultimodalIntake
          onAnalysisComplete={handleAnalysisComplete}
          patient={patient}
        />
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Success Header */}
          <Card className="p-6 border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/40">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-ink-900 dark:text-white mb-2">
                  Multimodal Analysis Complete
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getTriageColor(analysis.triageLevel)} font-bold`}>
                    ESI Level {analysis.triageLevel}
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40">
                    Urgency: {analysis.urgencyScore}/10
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40">
                    Confidence: {Math.round((analysis.confidenceScore || 0.85) * 100)}%
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-900/40">
                    {analysis.model || 'Dedalus AI'}
                  </Badge>
                </div>

                {/* Modalities Analyzed */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {analysis.modalitiesAnalyzed?.text && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-ink-900 dark:text-white">Text Description</span>
                    </div>
                  )}
                  {analysis.modalitiesAnalyzed?.images > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-ink-900 dark:text-white">
                        {analysis.modalitiesAnalyzed.images} Image{analysis.modalitiesAnalyzed.images > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {analysis.modalitiesAnalyzed?.audio && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
                      <Mic className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-ink-900 dark:text-white">Audio Recording</span>
                    </div>
                  )}
                  {analysis.modalitiesAnalyzed?.video && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700">
                      <VideoIcon className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-ink-900 dark:text-white">Video Recording</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Chief Complaint */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2 flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-600" />
              Chief Complaint
            </h3>
            <p className="text-ink-600 dark:text-ink-300">{analysis.chiefComplaint}</p>
          </Card>

          {/* Critical Red Flags */}
          {analysis.criticalRedFlags && analysis.criticalRedFlags.length > 0 && (
            <Card className="p-6 border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Critical Red Flags — Immediate Attention Required
              </h3>
              <ul className="space-y-2">
                {analysis.criticalRedFlags.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-red-800 dark:text-red-300">
                    <span className="text-lg">⚠️</span>
                    <span className="font-medium">{flag}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Multimodal Findings Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Visual Findings */}
            {analysis.visualFindings && analysis.visualFindings.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold text-ink-900 dark:text-white mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-purple-600" />
                  Visual Findings ({analysis.visualFindings.length})
                </h4>
                <div className="space-y-2">
                  {analysis.visualFindings.map((finding, idx) => (
                    <div key={idx} className="text-sm">
                      <div className={`font-medium ${getSeverityColor(finding.severity)}`}>
                        {finding.finding}
                      </div>
                      <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                        {finding.clinicalSignificance}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Audio Findings */}
            {analysis.audioFindings && analysis.audioFindings.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold text-ink-900 dark:text-white mb-3 flex items-center gap-2">
                  <Mic className="h-4 w-4 text-green-600" />
                  Audio Findings ({analysis.audioFindings.length})
                </h4>
                <div className="space-y-2">
                  {analysis.audioFindings.map((finding, idx) => (
                    <div key={idx} className="text-sm">
                      <div className={`font-medium ${getSeverityColor(finding.severity)}`}>
                        {finding.finding}
                      </div>
                      <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                        {finding.clinicalSignificance}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Video Findings */}
            {analysis.videoFindings && analysis.videoFindings.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold text-ink-900 dark:text-white mb-3 flex items-center gap-2">
                  <VideoIcon className="h-4 w-4 text-red-600" />
                  Movement Analysis ({analysis.videoFindings.length})
                </h4>
                <div className="space-y-2">
                  {analysis.videoFindings.map((finding, idx) => (
                    <div key={idx} className="text-sm">
                      <div className={`font-medium ${getSeverityColor(finding.severity)}`}>
                        {finding.finding}
                      </div>
                      <div className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                        {finding.clinicalSignificance}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Extracted Vitals */}
          {analysis.extractedVitals && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-600" />
                AI-Extracted Vital Signs
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {analysis.extractedVitals.respiratoryRate && (
                  <div>
                    <div className="text-ink-500">Respiratory Rate</div>
                    <div className="font-bold text-ink-900 dark:text-white text-lg">
                      {analysis.extractedVitals.respiratoryRate}
                    </div>
                  </div>
                )}
                {analysis.extractedVitals.approximateHeartRate && (
                  <div>
                    <div className="text-ink-500">Heart Rate</div>
                    <div className="font-bold text-ink-900 dark:text-white text-lg">
                      {analysis.extractedVitals.approximateHeartRate}
                    </div>
                  </div>
                )}
                {analysis.extractedVitals.oxygenSaturation && (
                  <div>
                    <div className="text-ink-500">O₂ Saturation</div>
                    <div className="font-bold text-ink-900 dark:text-white text-lg">
                      {analysis.extractedVitals.oxygenSaturation}
                    </div>
                  </div>
                )}
                {analysis.extractedVitals.consciousnessLevel && (
                  <div>
                    <div className="text-ink-500">Consciousness</div>
                    <div className="font-bold text-ink-900 dark:text-white text-lg">
                      {analysis.extractedVitals.consciousnessLevel}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Differential Diagnosis */}
          {analysis.differentialDiagnosis && analysis.differentialDiagnosis.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-4">
                Differential Diagnosis
              </h3>
              <div className="space-y-3">
                {analysis.differentialDiagnosis.map((dx, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-ink-50 dark:bg-ink-800/50">
                    <div className="flex-1">
                      <div className="font-semibold text-ink-900 dark:text-white">{dx.condition}</div>
                      <div className="text-sm text-ink-600 dark:text-ink-300 mt-1">{dx.reasoning}</div>
                    </div>
                    <Badge variant={dx.likelihood === 'high' ? 'default' : 'secondary'}>
                      {dx.likelihood}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Multimodal Insights */}
          {analysis.multimodalInsights && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Why Multimodal Analysis Matters
              </h3>
              <p className="text-ink-700 dark:text-ink-200 italic">
                {analysis.multimodalInsights}
              </p>
            </Card>
          )}

          {/* Show Full Analysis Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFullAnalysis(!showFullAnalysis)}
            className="w-full"
          >
            {showFullAnalysis ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Hide Full Analysis
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show Full Technical Analysis
              </>
            )}
          </Button>

          {showFullAnalysis && (
            <Card className="p-6 bg-ink-50 dark:bg-ink-900/50">
              <pre className="text-xs text-ink-600 dark:text-ink-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(analysis, null, 2)}
              </pre>
            </Card>
          )}

          {/* Action Button */}
          <Button
            onClick={proceedToMatching}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Proceed to ER Room Matching →
          </Button>
        </div>
      )}
    </div>
  )
}

export default MultimodalTriagePage
