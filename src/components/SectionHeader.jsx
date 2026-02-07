import { cn } from '../lib/utils'

const SectionHeader = ({ eyebrow, title, description, action, className }) => {
  return (
    <div className={cn('flex flex-col gap-2 md:flex-row md:items-end md:justify-between', className)}>
      <div>
        {eyebrow && (
          <p className="text-xs uppercase tracking-[0.3em] text-ink-400 dark:text-ink-500">{eyebrow}</p>
        )}
        <h2 className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">{title}</h2>
        {description && <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">{description}</p>}
      </div>
      {action ? <div className="mt-3 md:mt-0">{action}</div> : null}
    </div>
  )
}

export default SectionHeader
