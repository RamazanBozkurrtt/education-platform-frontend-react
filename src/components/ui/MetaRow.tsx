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
  <div className={cn('flex flex-wrap gap-2.5', className)}>
    {items.map((item) => {
      const Icon = item.icon

      return (
        <div
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[color:var(--surface-muted)] px-3 py-1.5"
          key={item.key}
        >
          {Icon ? <Icon className="h-3.5 w-3.5 text-slate-500" /> : null}
          <span className="text-xs text-slate-400">{item.label}:</span>
          <span className="text-xs font-medium text-slate-200">{item.value}</span>
        </div>
      )
    })}
  </div>
)

export default MetaRow
