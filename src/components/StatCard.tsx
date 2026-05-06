import Card from './ui/Card'
import type { MetricCard } from '../utils/types'
import { cn } from '../utils/helpers'

const tones: Record<MetricCard['tone'], { dot: string; meter: string; meterTrack: string }> = {
  cyan: {
    dot: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300',
    meter: 'bg-cyan-500',
    meterTrack: 'bg-cyan-500/16',
  },
  emerald: {
    dot: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
    meter: 'bg-emerald-500',
    meterTrack: 'bg-emerald-500/16',
  },
  amber: {
    dot: 'bg-amber-500/20 text-amber-600 dark:text-amber-300',
    meter: 'bg-amber-500',
    meterTrack: 'bg-amber-500/16',
  },
  indigo: {
    dot: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300',
    meter: 'bg-indigo-500',
    meterTrack: 'bg-indigo-500/16',
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
