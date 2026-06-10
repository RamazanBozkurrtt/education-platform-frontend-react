import type { LucideIcon } from 'lucide-react'
import { cn } from '../../utils/helpers'

export interface MetaItem {
  key: string
  label: string
  value: string
  icon?: LucideIcon
}

interface MetaRowProps {
  items: MetaItem[]
  className?: string
}

const MetaRow = ({ items, className }: MetaRowProps) => (
  <div className={cn('flex flex-wrap gap-2', className)}>
    {items.map((item) => {
      const Icon = item.icon

      return (
        <div
          className="inline-flex items-center gap-2 rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-white)] px-3 py-1"
          key={item.key}
        >
          {Icon ? <Icon className="h-3.5 w-3.5 text-[color:var(--text-muted)]" /> : null}
          <span className="text-xs text-[color:var(--text-muted)]">{item.label}:</span>
          <span className="text-xs font-semibold text-[color:var(--text-heading)]">{item.value}</span>
        </div>
      )
    })}
  </div>
)

export default MetaRow
