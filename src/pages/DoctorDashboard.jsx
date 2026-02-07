import { useState, useEffect } from 'react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import { usePatients } from '../hooks/usePatients'
import { useDoctorMatches } from '../hooks/useMatches'
import { updateMatchStatus } from '../services/database'
import { calculateEquityScore } from '../lib/equityEngine'
import { Users, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

const DoctorDashboard = () => {
  const { patients, loading: patientsLoading, usingDemo } = usePatients()
  const [doctorId] = useState('doctor_1') // TODO: Get from auth context
  const { matches, loading: matchesLoading, refresh: refreshMatches } = useDoctorMatches(doctorId)

  // Filter patients by equity score
  const patientsWithScores = patients.map(p => ({
    ...p,
    equityScore: calculateEquityScore(p)
  })).sort((a, b) => b.equityScore - a.equityScore)

  const pendingMatches = matches.filter(m => m.status === 'pending')
  const confirmedMatches = matches.filter(m => m.status === 'confirmed')

  const handleConfirmMatch = async (matchId) => {
    try {
      await updateMatchStatus(matchId, 'confirmed')
      await refreshMatches()
      alert('Match confirmed! Patient will be notified.')
    } catch (error) {
      alert('Error confirming match: ' + error.message)
    }
  }

  const handleRejectMatch = async (matchId) => {
    try {
      await updateMatchStatus(matchId, 'rejected')
      await refreshMatches()
      alert('Match rejected. Appointment slot is now available again.')
    } catch (error) {
      alert('Error rejecting match: ' + error.message)
    }
  }

  const getUrgencyColor = (urgency) => {
    if (urgency >= 8) return 'text-red-600 dark:text-red-400'
    if (urgency >= 6) return 'text-orange-600 dark:text-orange-400'
    if (urgency >= 4) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  if (patientsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900 dark:text-white">Doctor Dashboard</h1>
        <p className="text-ink-500 dark:text-ink-300 mt-1">
          Manage patient matches and view waiting patients
        </p>
      </div>

      {usingDemo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Demo Mode:</strong> Using hardcoded demo data.
              <a href="/seed-demo-data.html" className="ml-2 underline hover:no-underline">
                Seed Real Data
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-brand-100 p-2 dark:bg-brand-900/30">
              <Users className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Waiting Patients</p>
              <p className="text-2xl font-bold text-ink-900 dark:text-white">{patients.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
              <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Pending Matches</p>
              <p className="text-2xl font-bold text-ink-900 dark:text-white">{pendingMatches.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Confirmed</p>
              <p className="text-2xl font-bold text-ink-900 dark:text-white">{confirmedMatches.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">High Urgency</p>
              <p className="text-2xl font-bold text-ink-900 dark:text-white">
                {patients.filter(p => (p.urgencyLevel || p.aiUrgencyScore || 0) >= 7).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Pending Match Requests */}
      {pendingMatches.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink-900 dark:text-white mb-4">
            Pending Match Requests ({pendingMatches.length})
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-300 mb-4">
            Review and confirm or reject patient matches for your appointments.
          </p>

          <div className="space-y-3">
            {pendingMatches.map(match => {
              const patient = patients.find(p => p.id === match.patientId)
              if (!patient) return null

              return (
                <div key={match.id} className="border border-ink-200 dark:border-ink-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-ink-900 dark:text-white">
                          {patient.fullName}
                        </h4>
                        <Badge variant="warning">
                          Priority Tier {match.priorityTier}
                        </Badge>
                        <span className={`text-sm font-semibold ${getUrgencyColor(match.urgencyScore)}`}>
                          Urgency: {match.urgencyScore}/10
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-ink-600 dark:text-ink-300">
                        <p><strong>Condition:</strong> {patient.medicalCondition}</p>
                        <p><strong>Specialty:</strong> {patient.specialty}</p>
                        <p><strong>Insurance:</strong> {patient.insurance}</p>
                        <p><strong>Wait Time:</strong> {patient.waitTimeDays} days</p>
                      </div>

                      <div className="mt-3 text-xs text-ink-500 dark:text-ink-400">
                        <p><strong>Match Score:</strong> {match.totalMatchScore}/100</p>
                        <p className="italic">{match.reasoningExplanation}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleConfirmMatch(match.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectMatch(match.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Waiting Patients List */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-ink-900 dark:text-white mb-4">
          Waiting Patients ({patients.length})
        </h2>
        <p className="text-sm text-ink-500 dark:text-ink-300 mb-4">
          Patients waiting for appointments, sorted by equity priority score.
        </p>

        {patients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500 dark:text-ink-400">No patients waiting currently.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {patientsWithScores.map(patient => (
              <Accordion key={patient.id} type="single" collapsible>
                <AccordionItem value="details" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <p className="font-semibold text-ink-900 dark:text-white">
                            {patient.fullName}
                          </p>
                          <p className="text-xs text-ink-500 dark:text-ink-400">
                            {patient.specialty} · {patient.insurance}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge variant="warning">
                          Equity: {patient.equityScore}
                        </Badge>
                        <span className={`text-sm font-semibold ${getUrgencyColor(patient.urgencyLevel || patient.aiUrgencyScore || 5)}`}>
                          {patient.urgencyLevel || patient.aiUrgencyScore || 5}/10
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4 text-sm pt-3 pb-2">
                      <div>
                        <p className="text-ink-500 dark:text-ink-400">Condition</p>
                        <p className="font-medium text-ink-900 dark:text-white">
                          {patient.medicalCondition}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-500 dark:text-ink-400">Symptoms</p>
                        <p className="font-medium text-ink-900 dark:text-white">
                          {patient.symptoms}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-500 dark:text-ink-400">Wait Time</p>
                        <p className="font-medium text-ink-900 dark:text-white">
                          {patient.waitTimeDays} days
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-500 dark:text-ink-400">Transportation</p>
                        <p className="font-medium text-ink-900 dark:text-white">
                          {patient.transportation}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-500 dark:text-ink-400">Insurance</p>
                        <p className="font-medium text-ink-900 dark:text-white">
                          {patient.insurance}
                        </p>
                      </div>
                      <div>
                        <p className="text-ink-500 dark:text-ink-400">Zip Code</p>
                        <p className="font-medium text-ink-900 dark:text-white">
                          {patient.zipCode}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default DoctorDashboard
