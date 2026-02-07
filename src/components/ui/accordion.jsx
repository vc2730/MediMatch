import React, { createContext, useContext, useMemo, useState } from 'react'
import { cn } from '../../lib/utils'

const AccordionContext = createContext(null)

function Accordion({ type = 'single', collapsible = true, children, className }) {
  const [value, setValue] = useState('')
  const contextValue = useMemo(
    () => ({ type, value, setValue, collapsible }),
    [type, value, collapsible]
  )
  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

function useAccordion() {
  const context = useContext(AccordionContext)
  if (!context) {
    throw new Error('Accordion components must be used within Accordion')
  }
  return context
}

const AccordionItem = ({ value, className, children }) => {
  return <div className={cn('rounded-xl border border-ink-200/80 dark:border-ink-800/80', className)}>{children}</div>
}

const AccordionTrigger = ({ value, className, children }) => {
  const { value: activeValue, setValue, collapsible } = useAccordion()
  const isOpen = activeValue === value
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-ink-800 dark:text-ink-100',
        className
      )}
      onClick={() => {
        if (isOpen && collapsible) {
          setValue('')
        } else {
          setValue(value)
        }
      }}
    >
      {children}
      <span className={cn('text-xs text-ink-500 transition', isOpen && 'rotate-180')}>▾</span>
    </button>
  )
}

const AccordionContent = ({ value, className, children }) => {
  const { value: activeValue } = useAccordion()
  const isOpen = activeValue === value
  if (!isOpen) return null
  return <div className={cn('px-4 pb-4 text-sm text-ink-600 dark:text-ink-300', className)}>{children}</div>
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
