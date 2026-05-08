import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/helpers'

type InfoBadgeTone = 'default' | 'success' | 'warning' | 'danger'

interface InfoBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  tone?: InfoBadgeTone
}

const toneClassMap: Record<InfoBadgeTone, string> = {
  default: 'border-white/10 bg-[color:var(--surface-muted)] text-slate-300',
  success: 'border-emerald-300/35 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-300/35 bg-amber-500/10 text-amber-200',
  danger: 'border-rose-300/35 bg-rose-500/10 text-rose-200',
}

const InfoBadge = ({ children, className, tone = 'default', ...props }: InfoBadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full border px-3 py-1 text-xs',
      toneClassMap[tone],
      className,
    )}
    {...props}
  >
    {children}
  </span>
)

export default InfoBadge
