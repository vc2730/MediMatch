import { ArrowUpRight } from 'lucide-react'
import { Card } from './ui/card'
import { cn } from '../lib/utils'

const StatCard = ({ label, value, trend, icon: Icon, className }) => {
  return (
    <Card className={cn('flex items-center justify-between gap-4 p-5', className)}>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-ink-400 dark:text-ink-300">{label}</p>
        <h3 className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">{value}</h3>
        {trend && (
          <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
            <ArrowUpRight className="h-4 w-4" />
            {trend}
          </span>
        )}
      </div>
      <div className="rounded-2xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
        {Icon ? <Icon className="h-6 w-6" /> : null}
      </div>
    </Card>
  )
}

export default StatCard
