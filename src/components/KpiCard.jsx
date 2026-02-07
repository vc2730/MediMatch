import { ArrowUpRight } from 'lucide-react'
import { Card } from './ui/card'

const KpiCard = ({ label, value, trend }) => {
  return (
    <Card className="p-5 transition hover:-translate-y-1 hover:shadow-lg">
      <p className="text-xs uppercase tracking-[0.25em] text-ink-400 dark:text-ink-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-ink-900 dark:text-white">{value}</p>
      {trend && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
          <ArrowUpRight className="h-4 w-4" />
          {trend}
        </span>
      )}
    </Card>
  )
}

export default KpiCard
