import React from 'react'
import { cn } from '../../lib/utils'

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[120px] w-full resize-none rounded-xl border border-ink-200 bg-white/80 px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand-300 dark:border-ink-700 dark:bg-ink-900/60 dark:text-white',
      className
    )}
    {...props}
  />
))

Textarea.displayName = 'Textarea'

export { Textarea }
