import React from 'react'
import { cn } from '../../lib/utils'

const Button = React.forwardRef(
  ({ className, variant = 'default', size = 'md', asChild = false, children, ...props }, ref) => {
    const variants = {
      default:
        'bg-brand-600 text-white shadow-glow hover:bg-brand-700 focus-visible:ring-brand-400',
      secondary:
        'bg-white/80 text-ink-900 border border-ink-200 hover:bg-white dark:bg-ink-900/50 dark:text-white dark:border-ink-700',
      ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800',
      outline:
        'border border-ink-200 text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-100 dark:hover:bg-ink-800'
    }

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-5 text-sm',
      lg: 'h-12 px-6 text-base'
    }

    const classNames = cn(
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2',
      variants[variant],
      sizes[size],
      className
    )

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        className: cn(children.props.className, classNames)
      })
    }

    return (
      <button ref={ref} className={classNames} {...props}>
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
