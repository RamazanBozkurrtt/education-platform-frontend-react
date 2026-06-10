import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/helpers'

type StatusTone = 'default' | 'success' | 'warning' | 'danger'

interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  tone?: StatusTone
}

const toneClasses: Record<StatusTone, string> = {
  default: 'border-[color:var(--border)] text-[color:var(--text-muted)]',
  success: 'border-[color:var(--success)]/35 text-[color:var(--success)]',
  warning: 'border-[color:var(--warning)]/35 text-[color:var(--warning)]',
  danger: 'border-[color:var(--danger)]/35 text-[color:var(--danger)]',
}

const StatusBadge = ({ children, className, tone = 'default', ...props }: StatusBadgeProps) => (
  <span
    className={cn(
      'inline-flex h-6 items-center rounded-sm border px-2 text-[11px] font-medium uppercase tracking-[0.06em]',
      toneClasses[tone],
      className,
    )}
    {...props}
  >
    {children}
  </span>
)

export default StatusBadge
