import type { ReactNode } from 'react'
import { cn } from '../../utils/helpers'

export interface ActivityListItem {
  id: string
  title: string
  description?: string
  meta?: string
  badge?: ReactNode
}

interface ActivityListProps {
  items: ActivityListItem[]
  className?: string
}

const ActivityList = ({ className, items }: ActivityListProps) => (
  <ul className={cn('divide-y divide-[color:var(--border)] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]', className)}>
    {items.map((item) => (
      <li className="px-4 py-3.5" key={item.id}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="theme-heading truncate text-sm font-medium">{item.title}</p>
            {item.description ? <p className="theme-muted mt-1 text-sm">{item.description}</p> : null}
            {item.meta ? <p className="theme-subtle mt-1.5 text-xs">{item.meta}</p> : null}
          </div>
          {item.badge ? <div className="shrink-0">{item.badge}</div> : null}
        </div>
      </li>
    ))}
  </ul>
)

export default ActivityList
