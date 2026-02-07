import React from 'react'
import { cn } from '../../lib/utils'

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'flex h-11 w-full rounded-xl border border-ink-200 bg-white/80 px-3 text-sm text-ink-900 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand-300 dark:border-ink-700 dark:bg-ink-900/60 dark:text-white',
      className
    )}
    {...props}
  />
))

Input.displayName = 'Input'

export { Input }
