import { useMemo, useState } from 'react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { priorityPatients } from '../lib/demoData'
import { calculateEquityScore } from '../lib/equityEngine'

const Matching = () => {
  const patients = useMemo(
    () =>
      priorityPatients.map((patient) => ({
        ...patient,
        score: calculateEquityScore(patient)
      })),
    []
  )

  const [selectedId, setSelectedId] = useState(patients[0]?.id)
  const [matchResult, setMatchResult] = useState(null)
  const [matchStatus, setMatchStatus] = useState('idle')
  const [workflowId, setWorkflowId] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)

  const selectedPatient = patients.find((patient) => patient.id === selectedId)

  const handleMatch = () => {
    if (!selectedPatient) return
    setMatchResult({
      facility: 'Summit Specialty Center',
      slot: 'Tomorrow · 9:30 AM',
      reason: 'Closest capacity with equity score alignment',
      clinicAddress: '201 Mission Street, San Francisco, CA'
    })
    setMatchStatus('pending')
    setWorkflowId('')
  }

  const handleAccept = () => {
    setMatchStatus('accepted')
    setWorkflowId(`FG-${Math.floor(100000 + Math.random() * 900000)}`)
  }

  const handleReject = () => {
    setMatchStatus('rejected')
    setWorkflowId('')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Equity Priority List</h2>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Select a patient to review their profile and generate a match.
        </p>
        <div className="mt-4 space-y-3">
          {patients.length === 0 ? (
            <EmptyState title="No patients in queue" description="Intake a patient to begin matching." />
          ) : (
            patients.map((patient) => (
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
                    <p className="text-sm font-semibold text-ink-900 dark:text-white">{patient.name}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-300">
                      {patient.condition} · {patient.specialty}
                    </p>
                  </div>
                  <Badge variant="warning">{patient.score}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-ink-500 dark:text-ink-300">
                  <span>Wait {patient.waitTimeDays} days</span>
                  <span>Urgency {patient.urgencyLevel}</span>
                  <span>{patient.transportation}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Patient Match</h2>
          {selectedPatient ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm text-ink-500 dark:text-ink-300">Patient</p>
                <p className="text-base font-semibold text-ink-900 dark:text-white">{selectedPatient.name}</p>
              </div>
              <div className="grid gap-3 text-sm text-ink-600 dark:text-ink-300">
                <p>Condition: {selectedPatient.condition}</p>
                <p>Urgency: Level {selectedPatient.urgencyLevel}</p>
                <p>Insurance: {selectedPatient.insurance}</p>
                <p>Transportation: {selectedPatient.transportation}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleMatch}>Run Match</Button>
                <Button variant="outline" onClick={() => setDetailsOpen(true)}>
                  View Patient Details
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-500 dark:text-ink-300">Select a patient to view details.</p>
          )}
        </Card>

        {matchResult && (
          <Card className="p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Match Result</p>
            <h3 className="mt-2 text-lg font-semibold text-ink-900 dark:text-white">{matchResult.facility}</h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
              Slot: {matchResult.slot} · {matchResult.clinicAddress}
            </p>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-300">{matchResult.reason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={handleAccept}>Accept</Button>
              <Button variant="outline" onClick={handleReject}>
                Reject
              </Button>
            </div>
            {matchStatus === 'accepted' && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                Match accepted. Trigger FlowGlad workflow: <span className="font-semibold">{workflowId}</span>
              </div>
            )}
            {matchStatus === 'rejected' && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
                Match rejected. Update slot preferences or run a new match.
              </div>
            )}
          </Card>
        )}

        <Accordion type="single" collapsible className="space-y-2">
          <AccordionItem value="explain">
            <AccordionTrigger value="explain">Explain This Match (K2 Think)</AccordionTrigger>
            <AccordionContent value="explain">
              Equity weighting prioritized the longest waiting patient with high urgency and limited transportation. The
              suggested facility aligns to open slots within 12 miles and a higher Medicaid acceptance rate.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Modal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        title="Patient details"
        description="Full intake profile and risk flags."
        actions={
          <Button variant="outline" onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedPatient ? (
          <div className="grid gap-4 text-sm text-ink-600 dark:text-ink-300">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Demographics</p>
                <p className="mt-2">Age: {selectedPatient.age}</p>
                <p>Gender: {selectedPatient.gender}</p>
                <p>ZIP: {selectedPatient.zip}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Constraints</p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {selectedPatient.constraints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Symptoms</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                {selectedPatient.symptoms.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-500">Risk flags</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedPatient.riskFlags.map((flag) => (
                  <Badge key={flag} variant="warning">
                    {flag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default Matching
