import type { ReactNode } from 'react'
import { cn } from '../../utils/helpers'

interface DashboardPageHeaderProps {
  title: string
  description: string
  eyebrow?: string
  actions?: ReactNode
  className?: string
}

const DashboardPageHeader = ({ actions, className, description, eyebrow, title }: DashboardPageHeaderProps) => (
  <header className={cn('border-b border-[color:var(--border)] pb-5 md:pb-6', className)}>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-2.5">
        {eyebrow ? (
          <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.16em]">{eyebrow}</p>
        ) : null}
        <h1 className="theme-heading text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        <p className="theme-muted text-sm leading-6">{description}</p>
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-2.5 lg:w-auto lg:justify-end">{actions}</div> : null}
    </div>
  </header>
)

export default DashboardPageHeader
