import { useState } from 'react'
import { CheckCircle2, Dot } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

const steps = ['Intake', 'Match', 'Confirm', 'Remind', 'Follow-up']

const Flowglad = () => {
  const [workflowId, setWorkflowId] = useState('')

  const createWorkflow = () => {
    const id = `FG-${Math.floor(100000 + Math.random() * 900000)}`
    setWorkflowId(id)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">FlowGlad</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">Care Journey Automation</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Orchestrate the full patient journey with automated follow-ups and confirmations.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-200">
                {index === 0 ? <CheckCircle2 className="h-4 w-4" /> : <Dot className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{step}</p>
                <p className="text-xs text-ink-500 dark:text-ink-300">
                  {index === 0
                    ? 'Captured intake and risk profile.'
                    : 'Automated outreach and reminders queued.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Button onClick={createWorkflow}>Create FlowGlad Workflow</Button>
        {workflowId && (
          <div className="rounded-xl border border-ink-200 bg-white/80 px-4 py-2 text-sm text-ink-700 shadow-sm dark:border-ink-800 dark:bg-ink-900/60 dark:text-ink-200">
            Workflow ID generated: <span className="font-semibold">{workflowId}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Flowglad
