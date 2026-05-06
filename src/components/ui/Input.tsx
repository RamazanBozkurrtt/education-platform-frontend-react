import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../utils/helpers'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  icon?: ReactNode
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, helperText, icon, id, label, ...props }, ref) => {
    const { theme } = useTheme()
    const isLight = theme === 'light'

    return (
      <label className="flex w-full flex-col gap-2" htmlFor={id}>
        {label ? <span className="theme-text text-sm font-medium">{label}</span> : null}
        <span
          className={cn(
            'group flex h-12 items-center gap-3 rounded-2xl border px-4 transition focus-within:border-cyan-300/40 focus-within:ring-2 focus-within:ring-cyan-300/20',
            isLight ? 'border-slate-200/90 bg-slate-100/55' : 'theme-surface-strong border-white/10',
            error && 'border-rose-400/45 focus-within:border-rose-400/55 focus-within:ring-rose-400/20',
            className,
          )}
        >
          {icon ? <span className="theme-muted">{icon}</span> : null}
          <input
            ref={ref}
            aria-invalid={Boolean(error)}
            className="theme-text theme-placeholder w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            id={id}
            {...props}
          />
        </span>
        {error ? (
          <span className="text-xs text-rose-300">{error}</span>
        ) : helperText ? (
          <span className="theme-subtle text-xs">{helperText}</span>
        ) : null}
      </label>
    )
  },
)

Input.displayName = 'Input'

export default Input
