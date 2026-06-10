import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

const EmptyState = ({ action, description, title }: EmptyStateProps) => (
  <div className="rounded-md border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-soft)] px-5 py-6">
    <p className="theme-heading text-sm font-semibold">{title}</p>
    <p className="theme-muted mt-2 max-w-2xl text-sm leading-6">{description}</p>
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
)

export default EmptyState
