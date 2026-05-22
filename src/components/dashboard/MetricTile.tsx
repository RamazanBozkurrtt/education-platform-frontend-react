import { cn } from '../../utils/helpers'

type MetricTone = 'neutral' | 'primary' | 'success' | 'warning'

interface MetricTileProps {
  label: string
  value: string
  hint?: string
  progress?: number
  tone?: MetricTone
}

const toneClassMap: Record<MetricTone, string> = {
  neutral: 'border-l-[color:var(--border-strong)]',
  primary: 'border-l-[color:var(--primary)]',
  success: 'border-l-[color:var(--success)]',
  warning: 'border-l-[color:var(--warning)]',
}

const MetricTile = ({ hint, label, progress, tone = 'neutral', value }: MetricTileProps) => (
  <article className={cn('rounded-md border border-l-2 border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4', toneClassMap[tone])}>
    <p className="theme-muted text-xs font-medium uppercase tracking-[0.08em]">{label}</p>
    <p className="theme-heading mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    {typeof progress === 'number' ? (
      <div className="mt-3 space-y-1.5">
        <div className="h-1 overflow-hidden rounded bg-[color:var(--surface-muted)]">
          <div
            className="h-full bg-[color:var(--primary)] transition-[width] duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
        <p className="theme-subtle text-xs">{hint ?? `${Math.round(progress)}%`}</p>
      </div>
    ) : hint ? (
      <p className="theme-subtle mt-2 text-xs">{hint}</p>
    ) : null}
  </article>
)

export default MetricTile
