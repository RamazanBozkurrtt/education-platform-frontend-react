import { CheckCircle2 } from 'lucide-react'
import type { LessonProgressStatus } from '../../utils/courseProgress'

interface LessonProgressBadgeProps {
  status: LessonProgressStatus
  watchedPercentage?: number
  language: 'en' | 'tr'
}

const LessonProgressBadge = ({ language, status, watchedPercentage = 0 }: LessonProgressBadgeProps) => {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--text-heading)]">
        <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--primary)]" />
        {language === 'tr' ? 'Tamamlandi' : 'Completed'}
      </span>
    )
  }

  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-2 text-xs theme-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />
        {language === 'tr' ? 'Devam ediyor' : 'In progress'}
        <span className="theme-subtle">{Math.round(watchedPercentage)}%</span>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2 text-xs theme-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--text-muted)]/60" />
      {language === 'tr' ? 'Baslanmadi' : 'Not started'}
    </span>
  )
}

export default LessonProgressBadge
