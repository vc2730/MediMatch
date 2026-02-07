import { cn } from '../lib/utils'

const EmptyState = ({ title, description, action, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-10 text-center dark:border-ink-800 dark:bg-ink-900/40',
        className
      )}
    >
      <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">{title}</p>
      {description && <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
