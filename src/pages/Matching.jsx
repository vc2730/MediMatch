import { useState, useEffect } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { usePatients } from '../hooks/usePatients'
import { useMatching } from '../hooks/useMatching'
import { useMatchReasoning } from '../hooks/useMatchReasoning'
import { calculateEquityScore } from '../lib/equityEngine'
import { Calendar, MapPin, Clock, Heart, AlertCircle } from 'lucide-react'

const Matching = () => {
  const { patients, loading: patientsLoading, usingDemo } = usePatients()
  const { matches, loading: matchingLoading, findMatches, acceptMatch } = useMatching()

  const [selectedId, setSelectedId] = useState(null)
  const [acceptedMatch, setAcceptedMatch] = useState(null)
  const { reasoning, generate, loading: reasoningLoading, error: reasoningError } = useMatchReasoning(
    acceptedMatch?.matchId
  )

  // Auto-select first patient when loaded
  useEffect(() => {
    if (patients.length > 0 && !selectedId) {
      setSelectedId(patients[0].id)
    }
  }, [patients, selectedId])

  // Add equity scores to patients
  const patientsWithScores = patients.map((patient) => ({
    ...patient,
    equityScore: calculateEquityScore(patient)
  }))

  // Sort by equity score (highest first)
  const sortedPatients = [...patientsWithScores].sort((a, b) => b.equityScore - a.equityScore)

  const selectedPatient = sortedPatients.find((patient) => patient.id === selectedId)

  const handleMatch = async () => {
    if (!selectedPatient) return
    setAcceptedMatch(null)
    await findMatches(selectedPatient, 5)
  }

  const handleAcceptMatch = async (match) => {
    if (!selectedPatient) return

    const result = await acceptMatch(selectedPatient, match)

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
      1: { label: 'Tier 1: Urgent + Barriers', variant: 'destructive' },
      2: { label: 'Tier 2: High Urgency', variant: 'warning' },
      3: { label: 'Tier 3: Long Wait', variant: 'secondary' },
      4: { label: 'Tier 4: Standard', variant: 'default' }
    }
    return badges[tier] || badges[4]
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-blue-600 dark:text-blue-400'
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (patientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">Loading patients...</p>
        </div>
      </div>
    )
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-ink-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-2">No Patients Found</h2>
        <p className="text-sm text-ink-500 dark:text-ink-300 mb-4">
          Please seed demo data first or add patients manually.
        </p>
        <Button onClick={() => window.location.href = '/seed-demo-data.html'}>
          Seed Demo Data
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {usingDemo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Using Demo Data:</strong> Firestore is empty. Run seeding or using hardcoded demo patients.
              <a href="/seed-demo-data.html" className="ml-2 underline hover:no-underline">
                Seed Data Now
              </a>
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Equity Priority List</h2>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
            {sortedPatients.length} patient(s) waiting for appointments. Select to run matching algorithm.
          </p>

          <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
            {sortedPatients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                onClick={() => setSelectedId(patient.id)}
                className={`flex w-full flex-col gap-2 rounded-xl border px-4 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40 dark:hover:bg-ink-800/60 ${
                  selectedId === patient.id
                    ? 'border-brand-300 bg-brand-50/60 dark:border-brand-500/60 dark:bg-ink-800/80'
                    : 'border-ink-200/70 bg-white/60 dark:border-ink-800/60 dark:bg-ink-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{patient.fullName}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-300">
                      {patient.medicalCondition || patient.symptoms} · {patient.specialty}
                    </p>
                  </div>
                  <Badge variant="warning">{patient.equityScore}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-ink-500 dark:text-ink-300">
                  <span>⏱ {patient.waitTimeDays || 0} days</span>
                  <span>🚨 Urgency {patient.urgencyLevel || patient.aiUrgencyScore || 5}</span>
                  <span>🚌 {patient.transportation}</span>
                  <span>💳 {patient.insurance}</span>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Patient Match</h2>
            {selectedPatient ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm text-ink-500 dark:text-ink-300">Patient</p>
                  <p className="text-base font-semibold text-ink-900 dark:text-white">{selectedPatient.fullName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-ink-500 dark:text-ink-300">Condition</p>
                    <p className="font-medium text-ink-900 dark:text-white">{selectedPatient.medicalCondition}</p>
                  </div>
                  <div>
                    <p className="text-ink-500 dark:text-ink-300">Specialty</p>
                    <p className="font-medium text-ink-900 dark:text-white capitalize">{selectedPatient.specialty.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-ink-500 dark:text-ink-300">Urgency</p>
                    <p className="font-medium text-ink-900 dark:text-white">Level {selectedPatient.urgencyLevel || selectedPatient.aiUrgencyScore}/10</p>
                  </div>
                  <div>
                    <p className="text-ink-500 dark:text-ink-300">Wait Time</p>
                    <p className="font-medium text-ink-900 dark:text-white">{selectedPatient.waitTimeDays} days</p>
                  </div>
                  <div>
                    <p className="text-ink-500 dark:text-ink-300">Insurance</p>
                    <p className="font-medium text-ink-900 dark:text-white">{selectedPatient.insurance}</p>
                  </div>
                  <div>
                    <p className="text-ink-500 dark:text-ink-300">Transportation</p>
                    <p className="font-medium text-ink-900 dark:text-white">{selectedPatient.transportation}</p>
                  </div>
                </div>

                <Button
                  onClick={handleMatch}
                  disabled={matchingLoading}
                  className="w-full"
                >
                  {matchingLoading ? '🔄 Finding Matches...' : '🔍 Run Equity Match'}
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">Select a patient to view details.</p>
            )}
          </Card>

          {acceptedMatch && (
            <Card className="p-6 border-green-200 bg-green-50/50 dark:border-green-500/30 dark:bg-green-500/10">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-500/20">
                  <Heart className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-green-600 dark:text-green-400 font-semibold">✅ Match Confirmed</p>
                  <h3 className="mt-2 text-lg font-semibold text-ink-900 dark:text-white">{acceptedMatch.doctor}</h3>
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
                  <p className="mt-3 text-xs text-green-700 dark:text-green-300">
                    Match ID: {acceptedMatch.matchId}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={generate}
                      disabled={reasoningLoading || reasoning?.status === 'generating'}
                    >
                      {reasoning?.status === 'ready' ? 'Regenerate reasoning' : 'Generate reasoning'}
                    </Button>
                    {reasoning?.status && (
                      <Badge variant="neutral" className="text-xs">
                        {reasoning.status}
                      </Badge>
                    )}
                  </div>
                  {reasoning?.equityExplanation && (
                    <p className="mt-3 text-xs text-ink-600 dark:text-ink-300">
                      {reasoning.equityExplanation}
                    </p>
                  )}
                  {reasoningError && (
                    <p className="mt-3 text-xs text-red-600 dark:text-red-400">{reasoningError}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {matches.length > 0 && !acceptedMatch && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-ink-900 dark:text-white">
                Top {matches.length} Matches Found
              </h3>

              {matches.map((match, index) => {
                const priorityBadge = getPriorityBadge(match.scores.priorityTier)

                return (
                  <Card key={match.appointmentId} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-brand-600 dark:text-brand-400">#{index + 1}</span>
                          <h4 className="text-base font-semibold text-ink-900 dark:text-white">
                            {match.appointment.doctorName}
                          </h4>
                        </div>
                        <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">
                          {match.appointment.clinicName}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-600 dark:text-ink-300">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {match.appointment.date.toDate().toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {match.appointment.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.appointment.zipCode}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant={priorityBadge.variant} className="text-xs">
                            {priorityBadge.label}
                          </Badge>
                          <span className={`text-lg font-bold ${getScoreColor(match.scores.totalMatchScore)}`}>
                            {match.scores.totalMatchScore}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    <Accordion type="single" collapsible className="mt-3">
                      <AccordionItem value="details" className="border-0">
                        <AccordionTrigger className="py-2 text-xs">
                          View Scoring Details
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-xs">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-ink-500 dark:text-ink-400">Urgency:</span>
                                <span className="ml-2 font-semibold">{match.scores.urgencyScore}/10</span>
                              </div>
                              <div>
                                <span className="text-ink-500 dark:text-ink-400">Wait Time:</span>
                                <span className="ml-2 font-semibold">{match.scores.waitTimeScore}/10</span>
                              </div>
                              <div>
                                <span className="text-ink-500 dark:text-ink-400">Distance:</span>
                                <span className="ml-2 font-semibold">{match.scores.distanceScore}/10</span>
                              </div>
                              <div>
                                <span className="text-ink-500 dark:text-ink-400">Barriers:</span>
                                <span className="ml-2 font-semibold">{match.scores.barrierBonus}/10</span>
                              </div>
                              <div>
                                <span className="text-ink-500 dark:text-ink-400">Insurance:</span>
                                <span className="ml-2 font-semibold">{match.scores.insuranceMatchScore}/10</span>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-ink-200 dark:border-ink-700">
                              <p className="text-ink-600 dark:text-ink-300 italic">
                                {match.scores.reasoningExplanation}
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <Button
                      onClick={() => handleAcceptMatch(match)}
                      className="w-full mt-3"
                      size="sm"
                    >
                      ✓ Accept This Match
                    </Button>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Matching
