import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

const Modal = ({ children, description, onClose, open, title }: ModalProps) => {
  useEffect(() => {
    if (!open) {
      return undefined
    }

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--overlay)] px-4">
      <div className="theme-surface-strong w-full max-w-2xl rounded-[var(--radius-cards)] border border-[color:var(--border)] p-8 shadow-[var(--shadow-sm)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="theme-heading text-2xl font-semibold leading-[var(--leading-heading-sm)]">{title}</h3>
            {description ? <p className="theme-muted mt-2 text-sm">{description}</p> : null}
          </div>
          <Button aria-label="Close modal" onClick={onClose} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default Modal
