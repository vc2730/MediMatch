import { X } from 'lucide-react'
import { Button } from './ui/button'

const Modal = ({ open, title, description, onClose, children, actions }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-ink-200 bg-white/95 p-6 shadow-2xl dark:border-ink-800 dark:bg-ink-950/95">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ink-900 dark:text-white">{title}</h3>
            {description && <p className="mt-1 text-sm text-ink-500 dark:text-ink-300">{description}</p>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4">{children}</div>
        {actions ? <div className="mt-6 flex justify-end gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}

export default Modal
