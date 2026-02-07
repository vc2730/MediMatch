import { Badge } from './ui/badge'
import { Card } from './ui/card'

const PatientQueueItem = ({ patient, score }) => {
  return (
    <Card className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h4 className="text-base font-semibold text-ink-900 dark:text-white">{patient.name}</h4>
        <p className="text-sm text-ink-500 dark:text-ink-300">
          {patient.condition} · {patient.specialty} · {patient.waitTimeDays} days waiting
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="warning">Urgency {patient.urgencyLevel}</Badge>
        <Badge variant="neutral">Equity {score}</Badge>
      </div>
    </Card>
  )
}

export default PatientQueueItem
