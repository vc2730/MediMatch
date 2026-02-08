import { useState, useRef } from 'react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Camera, Mic, Video, X, Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

/**
 * Multimodal Intake Component - Innovative Healthcare Triage
 * Captures: Text + Images + Audio + Video for comprehensive AI analysis
 */
const MultimodalIntake = ({ onAnalysisComplete, patient }) => {
  const [textSymptoms, setTextSymptoms] = useState('')
  const [images, setImages] = useState([]) // Array of {file, preview, base64}
  const [audioRecording, setAudioRecording] = useState(null)
  const [videoRecording, setVideoRecording] = useState(null)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const [isRecordingVideo, setIsRecordingVideo] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  const audioRecorderRef = useRef(null)
  const videoRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const videoChunksRef = useRef([])
  const videoPreviewRef = useRef(null)
  const imageInputRef = useRef(null)

  // Image handling
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    const newImages = await Promise.all(files.map(async (file) => {
      const preview = URL.createObjectURL(file)
      const base64 = await fileToBase64(file)
      return { file, preview, base64, name: file.name }
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // Audio recording
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      audioRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const base64 = await blobToBase64(audioBlob)
        setAudioRecording({ blob: audioBlob, base64, duration: '0:00' })
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecordingAudio(true)
    } catch (err) {
      alert('Microphone access denied. Please enable microphone permissions.')
    }
  }

  const stopAudioRecording = () => {
    if (audioRecorderRef.current && isRecordingAudio) {
      audioRecorderRef.current.stop()
      setIsRecordingAudio(false)
    }
  }

  const deleteAudioRecording = () => {
    setAudioRecording(null)
  }

  // Video recording
  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      videoRecorderRef.current = mediaRecorder
      videoChunksRef.current = []

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
        videoPreviewRef.current.play()
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' })
        const base64 = await blobToBase64(videoBlob)
        setVideoRecording({ blob: videoBlob, base64, duration: '0:00' })
        stream.getTracks().forEach(track => track.stop())
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null
      }

      mediaRecorder.start()
      setIsRecordingVideo(true)
    } catch (err) {
      alert('Camera access denied. Please enable camera permissions.')
    }
  }

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && isRecordingVideo) {
      videoRecorderRef.current.stop()
      setIsRecordingVideo(false)
    }
  }

  const deleteVideoRecording = () => {
    setVideoRecording(null)
  }

  // Submit for multimodal analysis
  const handleSubmit = async () => {
    if (!textSymptoms && images.length === 0 && !audioRecording && !videoRecording) {
      alert('Please provide at least one input modality (text, image, audio, or video)')
      return
    }

    setAnalyzing(true)

    const multimodalData = {
      text: textSymptoms,
      images: images.map(img => ({ base64: img.base64, name: img.name })),
      audio: audioRecording ? { base64: audioRecording.base64 } : null,
      video: videoRecording ? { base64: videoRecording.base64 } : null,
      modalitiesUsed: [
        textSymptoms && 'text',
        images.length > 0 && 'images',
        audioRecording && 'audio',
        videoRecording && 'video'
      ].filter(Boolean),
      timestamp: new Date().toISOString()
    }

    // Store in sessionStorage for use by PatientMatching
    sessionStorage.setItem('multimodalIntakeData', JSON.stringify(multimodalData))

    await onAnalysisComplete?.(multimodalData)
    setAnalyzing(false)
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result.split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  const modalityCount = [
    textSymptoms,
    images.length > 0,
    audioRecording,
    videoRecording
  ].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 dark:border-purple-800">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink-900 dark:text-white mb-2">
              Multimodal Triage Assessment
            </h2>
            <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
              Powered by Dedalus AI — Combining text, images, audio, and video for comprehensive symptom analysis
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/40">
                <Camera className="h-3 w-3 mr-1" />
                Vision AI
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/40">
                <Mic className="h-3 w-3 mr-1" />
                Audio Analysis
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/40">
                <Video className="h-3 w-3 mr-1" />
                Movement Detection
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              {modalityCount}/4
            </div>
            <div className="text-xs text-ink-500">Modalities Used</div>
          </div>
        </div>
      </Card>

      {/* Text Input */}
      <Card className="p-6">
        <label className="block text-sm font-semibold text-ink-900 dark:text-white mb-2">
          1. Describe Your Symptoms (Text)
        </label>
        <textarea
          value={textSymptoms}
          onChange={(e) => setTextSymptoms(e.target.value)}
          placeholder="Describe what you're experiencing, when it started, severity, location..."
          className="w-full h-24 px-3 py-2 border border-ink-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-ink-900 dark:border-ink-700 dark:text-white"
        />
        {textSymptoms && <CheckCircle className="h-4 w-4 text-green-600 mt-2" />}
      </Card>

      {/* Image Upload */}
      <Card className="p-6">
        <label className="block text-sm font-semibold text-ink-900 dark:text-white mb-2">
          2. Upload Images (Photos of symptoms, injuries, rashes, etc.)
        </label>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button
          onClick={() => imageInputRef.current?.click()}
          variant="outline"
          className="w-full mb-3"
        >
          <Camera className="h-4 w-4 mr-2" />
          Upload Photos
        </Button>

        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img
                  src={img.preview}
                  alt={`Symptom ${idx + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-ink-200 dark:border-ink-700"
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                  Image {idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Audio Recording */}
      <Card className="p-6">
        <label className="block text-sm font-semibold text-ink-900 dark:text-white mb-2">
          3. Audio Recording (Describe symptoms verbally, cough, breathing sounds)
        </label>
        <p className="text-xs text-ink-500 mb-3">
          AI will analyze speech patterns, respiratory sounds, and vocal distress indicators
        </p>

        {!audioRecording ? (
          <Button
            onClick={isRecordingAudio ? stopAudioRecording : startAudioRecording}
            variant={isRecordingAudio ? 'destructive' : 'outline'}
            className="w-full"
          >
            {isRecordingAudio ? (
              <>
                <div className="animate-pulse h-3 w-3 bg-red-500 rounded-full mr-2" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Start Audio Recording
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <div className="text-sm font-medium text-ink-900 dark:text-white">Audio recorded</div>
              <audio src={URL.createObjectURL(audioRecording.blob)} controls className="w-full mt-2 h-8" />
            </div>
            <button
              onClick={deleteAudioRecording}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </Card>

      {/* Video Recording */}
      <Card className="p-6">
        <label className="block text-sm font-semibold text-ink-900 dark:text-white mb-2">
          4. Video Recording (Show affected area, movement, range of motion)
        </label>
        <p className="text-xs text-ink-500 mb-3">
          AI will analyze visible symptoms, movement patterns, and extract vital signs
        </p>

        {isRecordingVideo && (
          <video
            ref={videoPreviewRef}
            className="w-full h-64 bg-black rounded-lg mb-3"
            autoPlay
            muted
          />
        )}

        {!videoRecording ? (
          <Button
            onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
            variant={isRecordingVideo ? 'destructive' : 'outline'}
            className="w-full"
          >
            {isRecordingVideo ? (
              <>
                <div className="animate-pulse h-3 w-3 bg-red-500 rounded-full mr-2" />
                Stop Video Recording
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                Start Video Recording
              </>
            )}
          </Button>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="flex-1 text-sm font-medium text-ink-900 dark:text-white">
                Video recorded
              </div>
              <button
                onClick={deleteVideoRecording}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <video
              src={URL.createObjectURL(videoRecording.blob)}
              controls
              className="w-full rounded-lg"
            />
          </div>
        )}
      </Card>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={analyzing || modalityCount === 0}
        size="lg"
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {analyzing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            AI Analyzing {modalityCount} Modalities...
          </>
        ) : (
          <>
            <Upload className="h-5 w-5 mr-2" />
            Submit for AI Analysis ({modalityCount} modalities)
          </>
        )}
      </Button>

      {modalityCount === 0 && (
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          Please provide at least one input (text, image, audio, or video)
        </div>
      )}
    </div>
  )
}

export default MultimodalIntake
