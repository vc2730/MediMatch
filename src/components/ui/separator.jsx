import React from 'react'
import { cn } from '../../lib/utils'

const Separator = React.forwardRef(({ className, orientation = 'horizontal', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'bg-ink-200/70 dark:bg-ink-700/70',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className
    )}
    {...props}
  />
))

Separator.displayName = 'Separator'

export { Separator }
