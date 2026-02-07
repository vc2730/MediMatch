import React from 'react'
import { cn } from '../../lib/utils'

const Badge = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    neutral: 'bg-ink-100 text-ink-600 dark:bg-ink-700/60 dark:text-ink-200'
  }

  return (
    <span
      ref={ref}
      className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', variants[variant], className)}
      {...props}
    />
  )
})

Badge.displayName = 'Badge'

export { Badge }
