import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/helpers'

type InfoBadgeTone = 'default' | 'success' | 'warning' | 'danger'

interface InfoBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  tone?: InfoBadgeTone
}

const toneClassMap: Record<InfoBadgeTone, string> = {
  default: 'border-[color:var(--border)] bg-[color:var(--surface-white)] text-[color:var(--text-muted)]',
  success: 'border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] text-[color:var(--text-heading)]',
  warning: 'border-[color:var(--border)] bg-[color:var(--surface-muted-mandarin)] text-[color:var(--text-heading)]',
  danger: 'border-[color:var(--border)] bg-[color:var(--surface-soft-peach)] text-[color:var(--text-heading)]',
}

const InfoBadge = ({ children, className, tone = 'default', ...props }: InfoBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-[var(--radius-badges)] border px-3 py-1 text-xs font-medium',
      toneClassMap[tone],
      className,
    )}
    {...props}
  >
    {children}
  </span>
)

export default InfoBadge
