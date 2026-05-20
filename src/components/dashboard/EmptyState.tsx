import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

const EmptyState = ({ action, description, title }: EmptyStateProps) => (
  <div className="rounded-md border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-soft)] px-4 py-5">
    <p className="theme-heading text-sm font-semibold">{title}</p>
    <p className="theme-muted mt-1 text-sm leading-6">{description}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
)

export default EmptyState
