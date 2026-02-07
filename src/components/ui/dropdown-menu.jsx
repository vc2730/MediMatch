import React, { createContext, useContext, useMemo, useState } from 'react'
import { cn } from '../../lib/utils'

const DropdownMenuContext = createContext(null)

function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false)
  const value = useMemo(() => ({ open, setOpen }), [open])
  return <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>
}

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenu components must be used within DropdownMenu')
  }
  return context
}

const DropdownMenuTrigger = React.forwardRef(({ asChild = false, children, ...props }, ref) => {
  const { open, setOpen } = useDropdownMenu()
  const triggerProps = {
    onClick: (event) => {
      children.props?.onClick?.(event)
      setOpen(!open)
    },
    ...props
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, triggerProps)
  }

  return (
    <button type="button" ref={ref} {...triggerProps}>
      {children}
    </button>
  )
})

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuContent = React.forwardRef(({ className, align = 'end', children, ...props }, ref) => {
  const { open } = useDropdownMenu()

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 mt-2 min-w-[12rem] rounded-xl border border-ink-200/80 bg-white/95 p-1 shadow-xl backdrop-blur dark:border-ink-800/80 dark:bg-ink-900/95',
        align === 'end' ? 'right-0' : 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

DropdownMenuContent.displayName = 'DropdownMenuContent'

const DropdownMenuItem = React.forwardRef(({ className, onSelect, ...props }, ref) => {
  const { setOpen } = useDropdownMenu()

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 dark:text-ink-100 dark:hover:bg-ink-800',
        className
      )}
      onClick={(event) => {
        onSelect?.(event)
        setOpen(false)
      }}
      {...props}
    />
  )
})

DropdownMenuItem.displayName = 'DropdownMenuItem'

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }
