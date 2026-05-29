interface CourseProgressBarProps {
  percentage: number
  completedLessons?: number
  totalLessons?: number
  language: 'en' | 'tr'
  compact?: boolean
}

const clampPercentage = (value: number) => Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0))

const CourseProgressBar = ({
  compact = false,
  completedLessons,
  language,
  percentage,
  totalLessons,
}: CourseProgressBarProps) => {
  const normalizedPercentage = clampPercentage(percentage)
  const lessonSummary = typeof completedLessons === 'number' && typeof totalLessons === 'number'
    ? `${completedLessons}/${totalLessons}`
    : null

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="theme-muted">
          {language === 'tr' ? 'Ilerleme' : 'Progress'}
          {lessonSummary ? ` (${lessonSummary})` : ''}
        </span>
        <span className="theme-heading font-medium">{Math.round(normalizedPercentage)}%</span>
      </div>
      <div className={`rounded-full bg-[color:var(--surface-muted)] ${compact ? 'h-1.5' : 'h-2'}`}>
        <div
          className={`h-full rounded-full bg-[color:var(--primary)] ${compact ? '' : 'transition-[width] duration-200'}`}
          style={{ width: `${normalizedPercentage}%` }}
        />
      </div>
    </div>
  )
}

export default CourseProgressBar
