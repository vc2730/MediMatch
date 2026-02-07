import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card } from './ui/card'
import { cn } from '../lib/utils'

const QuickActionCard = ({ title, description, to, icon: Icon, className, showArrow = true }) => {
  return (
    <Link to={to} className={cn('group block', className)}>
      <Card className="h-full border border-ink-200/60 p-6 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg dark:border-ink-800/70">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">{description}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="rounded-2xl bg-ink-100 p-3 text-ink-700 transition group-hover:bg-brand-100 group-hover:text-brand-700 dark:bg-ink-800 dark:text-ink-200">
              {Icon ? <Icon className="h-5 w-5" /> : null}
            </div>
            {showArrow && (
              <ArrowRight className="h-4 w-4 text-ink-400 transition group-hover:translate-x-1 group-hover:text-brand-600" />
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

export default QuickActionCard
