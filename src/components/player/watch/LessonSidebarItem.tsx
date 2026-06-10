import { CheckCircle2, Clock3, PlayCircle } from 'lucide-react'
import LessonProgressBadge from '../../progress/LessonProgressBadge'
import { resolveLessonProgressStatus } from '../../../utils/courseProgress'
import { resolveLessonDurationLabel } from '../../../utils/duration'
import { cn } from '../../../utils/helpers'
import type { CourseModule, LessonProgress } from '../../../utils/types'

interface LessonSidebarItemProps {
  lesson: CourseModule
  index: number
  isActive: boolean
  language: 'en' | 'tr'
  lessonProgress?: LessonProgress
  onSelect: (lessonId: string) => void
}

const LessonSidebarItem = ({
  index,
  isActive,
  language,
  lesson,
  lessonProgress,
  onSelect,
}: LessonSidebarItemProps) => {
  const status = resolveLessonProgressStatus(lessonProgress)
  const watchedPercentage = Math.max(0, Math.min(100, Math.round(lessonProgress?.watchedPercentage ?? 0)))

  return (
    <button
      className={cn(
        'group w-full rounded-[var(--radius-cards)] border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-strong)]',
        isActive
          ? 'border-[color:var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_10%,var(--surface-soft))]'
          : 'border-[color:var(--border)] bg-[color:var(--surface-soft)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]',
      )}
      onClick={() => onSelect(lesson.id)}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 w-6 shrink-0 text-center text-[11px] font-semibold tracking-wide text-[color:var(--text-subtle)]">
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate text-sm font-semibold text-[color:var(--text-heading)]">{lesson.title}</p>
            {status === 'completed' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--success)]" />
            ) : isActive ? (
              <PlayCircle className="h-4 w-4 shrink-0 text-[color:var(--primary)]" />
            ) : null}
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[color:var(--text-muted)]">
            <Clock3 className="h-3.5 w-3.5" />
            <span className="truncate">{resolveLessonDurationLabel(lesson, language)}</span>
          </div>

          <div className="mt-2">
            <LessonProgressBadge
              language={language}
              status={status}
              watchedPercentage={lessonProgress?.watchedPercentage}
            />
          </div>

          {status === 'in_progress' ? (
            <div className="mt-2 h-1.5 rounded-full bg-[color:var(--surface-muted)]">
              <div
                className="h-full rounded-full bg-[color:var(--primary)] transition-[width] duration-300"
                style={{ width: `${watchedPercentage}%` }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </button>
  )
}

export default LessonSidebarItem
