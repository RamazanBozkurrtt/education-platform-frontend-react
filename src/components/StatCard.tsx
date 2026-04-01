import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Card from './ui/Card'
import type { MetricCard } from '../utils/types'
import { cn } from '../utils/helpers'

const tones = {
  cyan: 'bg-sky-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-500',
}

const StatCard = ({ change, label, tone, trend, value }: MetricCard) => {
  const { t } = useTranslation()

  return (
    <Card className="p-0">
      <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
            trend === 'up'
              ? 'bg-emerald-400/12 text-emerald-200'
              : 'bg-amber-400/12 text-amber-200',
          )}
        >
          {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {change}
        </span>
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className={cn('mb-4 h-1.5 w-14 rounded-full', tones[tone])} />
        <h3 className="text-3xl font-semibold tracking-tight text-white">{value}</h3>
        <p className="mt-3 text-sm text-slate-400">{t('common.comparedToPrevious')}</p>
      </div>
    </Card>
  )
}

export default StatCard
