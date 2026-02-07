import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { usePatient } from '../hooks/usePatients'
import { useMatching } from '../hooks/useMatching'
import { useAuth } from '../contexts/AuthContext'
import { calculateEquityScore } from '../lib/equityEngine'
import { Calendar, MapPin, Clock, Heart, AlertCircle, ArrowLeft } from 'lucide-react'

const PatientMatching = () => {
  const navigate = useNavigate()
  const [patientId, setPatientId] = useState(null)
  const { userId } = useAuth()
  const { patient, loading: patientLoading } = usePatient(patientId)
  const { matches, loading: matchingLoading, findMatches, acceptMatch } = useMatching()
  const [acceptedMatch, setAcceptedMatch] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    // Get patient ID from localStorage
    const savedPatientId = localStorage.getItem('currentPatientId')
    const resolvedId = userId || savedPatientId
    if (resolvedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPatientId(resolvedId)
    } else {
      navigate('/login')
    }
  }, [navigate, userId])

  const handleFindMatches = async () => {
    if (!patient) return
    setAcceptedMatch(null)
    setHasSearched(true)
    await findMatches(patient, 5)
  }

  const handleAcceptMatch = async (match) => {
    if (!patient) return

    const result = await acceptMatch(patient, match)

    if (result.success) {
      setAcceptedMatch({
        doctor: match.appointment.doctorName,
        clinic: match.appointment.clinicName,
        time: match.appointment.time,
        date: match.appointment.date.toDate().toLocaleDateString(),
        matchId: result.matchId
      })
    }
  }

  const getPriorityBadge = (tier) => {
    const badges = {
      1: { label: 'Priority Tier 1', variant: 'destructive' },
      2: { label: 'Priority Tier 2', variant: 'warning' },
      3: { label: 'Priority Tier 3', variant: 'secondary' },
      4: { label: 'Priority Tier 4', variant: 'default' }
    }
    return badges[tier] || badges[4]
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-blue-600 dark:text-blue-400'
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (patientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">Loading your information...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-ink-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-2">Patient Not Found</h2>
        <p className="text-sm text-ink-500 dark:text-ink-300 mb-4">
          We couldn’t load your patient profile. Please contact support or try again later.
        </p>
        <Button onClick={() => navigate('/patient/portal')}>
          Back to Patient Portal
        </Button>
      </div>
    )
  }

  const equityScore = calculateEquityScore(patient)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Find Your Appointment</h1>
          <p className="text-ink-500 dark:text-ink-300 mt-1">
            We'll match you with the best available appointments
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/patient/portal')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Portal
        </Button>
      </div>

      {/* Patient Info Card */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white">{patient.fullName}</h2>
            <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">
              Looking for: <strong>{patient.specialty?.replace('_', ' ')}</strong>
            </p>
          </div>
          <div className="text-right">
            <Badge variant="warning" className="mb-2">Equity Score: {equityScore}</Badge>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Urgency: {patient.urgencyLevel || patient.aiUrgencyScore || 5}/10
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-ink-500 dark:text-ink-400">Condition</p>
            <p className="font-medium text-ink-900 dark:text-white">{patient.medicalCondition}</p>
          </div>
          <div>
            <p className="text-ink-500 dark:text-ink-400">Insurance</p>
            <p className="font-medium text-ink-900 dark:text-white">{patient.insurance}</p>
          </div>
          <div>
            <p className="text-ink-500 dark:text-ink-400">Transportation</p>
            <p className="font-medium text-ink-900 dark:text-white">{patient.transportation}</p>
          </div>
          <div>
            <p className="text-ink-500 dark:text-ink-400">Zip Code</p>
            <p className="font-medium text-ink-900 dark:text-white">{patient.zipCode}</p>
          </div>
        </div>

        <Button
          onClick={handleFindMatches}
          disabled={matchingLoading}
          className="w-full mt-6"
          size="lg"
        >
          {matchingLoading ? '🔄 Finding Best Matches...' : hasSearched ? '🔄 Search Again' : '🔍 Find Appointments'}
        </Button>
      </Card>

      {/* Accepted Match Confirmation */}
      {acceptedMatch && (
        <Card className="p-6 border-green-200 bg-green-50/50 dark:border-green-500/30 dark:bg-green-500/10">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-500/20">
              <Heart className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm uppercase tracking-[0.2em] text-green-600 dark:text-green-400 font-semibold mb-2">
                ✅ Appointment Confirmed!
              </p>
              <h3 className="text-xl font-bold text-ink-900 dark:text-white">{acceptedMatch.doctor}</h3>
              <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{acceptedMatch.clinic}</p>
              <div className="mt-3 flex items-center gap-4 text-sm text-ink-600 dark:text-ink-300">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {acceptedMatch.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {acceptedMatch.time}
                </span>
              </div>
              <p className="mt-4 text-sm text-green-700 dark:text-green-300">
                You'll receive a confirmation email shortly. The doctor has been notified of your match.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Matches List */}
      {matches.length > 0 && !acceptedMatch && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white">
            Your Top {matches.length} Matches
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            Based on your needs, insurance, location, and our equity-aware matching algorithm.
          </p>

          {matches.map((match, index) => {
            const priorityBadge = getPriorityBadge(match.scores.priorityTier)

            return (
              <Card key={match.appointmentId} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">#{index + 1}</span>
                      <div>
                        <h4 className="text-lg font-semibold text-ink-900 dark:text-white">
                          {match.appointment.doctorName}
                        </h4>
                        <p className="text-sm text-ink-500 dark:text-ink-300">
                          {match.appointment.clinicName}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-ink-600 dark:text-ink-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {match.appointment.date.toDate().toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {match.appointment.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {match.appointment.zipCode}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <Badge variant={priorityBadge.variant} className="text-xs">
                        {priorityBadge.label}
                      </Badge>
                      <span className={`text-xl font-bold ${getScoreColor(match.scores.totalMatchScore)}`}>
                        {match.scores.totalMatchScore}/100 Match
                      </span>
                    </div>
                  </div>
                </div>

                <Accordion type="single" collapsible>
                  <AccordionItem value="details" className="border-0">
                    <AccordionTrigger className="py-2 text-sm">
                      Why this match?
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-ink-500 dark:text-ink-400">Urgency Match:</span>
                            <span className="font-semibold">{match.scores.urgencyScore}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-500 dark:text-ink-400">Wait Time:</span>
                            <span className="font-semibold">{match.scores.waitTimeScore}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-500 dark:text-ink-400">Distance:</span>
                            <span className="font-semibold">{match.scores.distanceScore}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-500 dark:text-ink-400">Access Factors:</span>
                            <span className="font-semibold">{match.scores.barrierBonus}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-500 dark:text-ink-400">Insurance:</span>
                            <span className="font-semibold">{match.scores.insuranceMatchScore}/10</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-ink-200 dark:border-ink-700">
                          <p className="text-sm text-ink-600 dark:text-ink-300 italic">
                            {match.scores.reasoningExplanation}
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <Button
                  onClick={() => handleAcceptMatch(match)}
                  className="w-full mt-4"
                  size="lg"
                >
                  ✓ Book This Appointment
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {hasSearched && matches.length === 0 && !matchingLoading && (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-ink-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-ink-900 dark:text-white mb-2">
            No Matches Found
          </h3>
          <p className="text-sm text-ink-500 dark:text-ink-300">
            We couldn't find any available appointments for {patient.specialty?.replace('_', ' ')} right now.
            We'll notify you when appointments become available.
          </p>
        </Card>
      )}
    </div>
  )
}

export default PatientMatching
