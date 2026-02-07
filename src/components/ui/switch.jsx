import React from 'react'
import { cn } from '../../lib/utils'

const Switch = React.forwardRef(({ className, checked, onCheckedChange, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange?.(!checked)}
    className={cn(
      'inline-flex h-6 w-11 items-center rounded-full border border-transparent transition-colors',
      checked ? 'bg-brand-600' : 'bg-ink-300 dark:bg-ink-700',
      className
    )}
    {...props}
  >
    <span
      className={cn(
        'inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white transition',
        checked ? 'translate-x-5' : 'translate-x-0.5'
      )}
    />
  </button>
))

Switch.displayName = 'Switch'

export { Switch }
