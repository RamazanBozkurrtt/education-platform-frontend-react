import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils/helpers'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  icon?: ReactNode
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, helperText, icon, id, label, ...props }, ref) => {
    return (
      <label className="flex w-full flex-col gap-2" htmlFor={id}>
        {label ? <span className="theme-heading text-sm font-semibold">{label}</span> : null}
        <span
          className={cn(
            'group flex h-12 items-center gap-3 rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 transition-colors focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--focus-ring)]',
            error && 'border-[color:var(--danger)] focus-within:border-[color:var(--danger)] focus-within:ring-[color:rgba(138,47,63,0.2)]',
            className,
          )}
        >
          {icon ? <span className="theme-muted">{icon}</span> : null}
          <input
            ref={ref}
            aria-invalid={Boolean(error)}
            className="theme-text theme-placeholder w-full bg-transparent text-sm outline-none"
            id={id}
            {...props}
          />
        </span>
        {error ? (
          <span className="text-xs text-[color:var(--danger)]">{error}</span>
        ) : helperText ? (
          <span className="theme-muted text-xs">{helperText}</span>
        ) : null}
      </label>
    )
  },
)

Input.displayName = 'Input'

export default Input
