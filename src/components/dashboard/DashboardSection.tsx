import type { ReactNode } from 'react'
import { cn } from '../../utils/helpers'

interface DashboardSectionProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

const DashboardSection = ({
  action,
  children,
  className,
  contentClassName,
  description,
  title,
}: DashboardSectionProps) => (
  <section className={cn('space-y-4', className)}>
    <div className="flex items-start justify-between gap-3 border-b border-[color:var(--border)] pb-3">
      <div>
        <h2 className="theme-heading text-base font-semibold md:text-lg">{title}</h2>
        {description ? <p className="theme-muted mt-1 text-sm">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    <div className={cn(contentClassName)}>{children}</div>
  </section>
)

export default DashboardSection
