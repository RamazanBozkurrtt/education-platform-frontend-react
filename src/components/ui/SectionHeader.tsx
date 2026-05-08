import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

const SectionHeader = ({ title, description, action }: SectionHeaderProps) => (
  <div className="flex flex-wrap items-start justify-between gap-[var(--element-gap)]">
    <div className="space-y-2">
      <h2 className="theme-heading text-2xl font-semibold leading-[var(--leading-heading-sm)]">{title}</h2>
      {description ? <p className="theme-muted text-sm">{description}</p> : null}
    </div>
    {action ? <div>{action}</div> : null}
  </div>
)

export default SectionHeader
