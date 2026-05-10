import Card from './ui/Card'
import type { MetricCard } from '../utils/types'
import { cn } from '../utils/helpers'

const tones: Record<MetricCard['tone'], { dot: string; meter: string; meterTrack: string }> = {
  cyan: {
    dot: 'bg-[color:var(--surface-sky-haze)] text-[color:var(--text-heading)]',
    meter: 'bg-[color:var(--primary)]',
    meterTrack: 'bg-[color:var(--surface-sky-haze)]',
  },
  emerald: {
    dot: 'bg-[color:var(--surface-soft-peach)] text-[color:var(--text-heading)]',
    meter: 'bg-[color:var(--color-muted-sage)]',
    meterTrack: 'bg-[color:var(--surface-soft-peach)]',
  },
  amber: {
    dot: 'bg-[color:var(--surface-muted-mandarin)] text-[color:var(--text-heading)]',
    meter: 'bg-[color:var(--primary)]',
    meterTrack: 'bg-[color:var(--surface-muted-mandarin)]',
  },
  indigo: {
    dot: 'bg-[color:var(--surface-muted)] text-[color:var(--text-heading)]',
    meter: 'bg-[color:var(--primary)]',
    meterTrack: 'bg-[color:var(--surface-muted)]',
  },
}

const StatCard = ({ label, progress, tone, value }: MetricCard) => {
  return (
    <Card className="p-5">
      <p className="theme-heading text-sm font-semibold leading-5">{label}</p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <h3 className="theme-heading text-[2.1rem] font-semibold leading-none tracking-tight">{value}</h3>
        <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-md', tones[tone].dot)}>
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </span>
      </div>

      <div className="mt-5">
        <div className={cn('h-2 rounded-full', tones[tone].meterTrack)}>
          <div
            className={cn('h-2 rounded-full transition-all duration-300', tones[tone].meter)}
            style={{ width: `${Math.min(100, Math.max(0, Number.isFinite(progress) ? progress : 0))}%` }}
          />
        </div>
      </div>
    </Card>
  )
}

export default StatCard
