import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

const SectionHeader = ({ title, description, action }: SectionHeaderProps) => (
  <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-400">{description}</p> : null}
    </div>
    {action ? <div>{action}</div> : null}
  </div>
)

export default SectionHeader
