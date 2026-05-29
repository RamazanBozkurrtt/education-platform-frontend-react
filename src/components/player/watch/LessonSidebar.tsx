import { GraduationCap, LockKeyhole, X } from 'lucide-react'
import CourseProgressBar from '../../progress/CourseProgressBar'
import LessonSidebarItem from './LessonSidebarItem'
import { cn } from '../../../utils/helpers'
import type { CourseProgressSummary, CourseModule, LessonProgress } from '../../../utils/types'

interface LessonSidebarProps {
  courseTitle: string
  language: 'en' | 'tr'
  lessons: CourseModule[]
  activeLessonId: string | null
  lessonProgressByLessonId: Record<string, LessonProgress>
  courseProgressSummary?: CourseProgressSummary | null
  showFinalExamEntry?: boolean
  isFinalExamLocked?: boolean
  finalExamLabel?: string
  finalExamHint?: string
  isDesktopOpen: boolean
  isMobileOpen: boolean
  onMobileClose: () => void
  onLessonSelect: (lessonId: string) => void
  onFinalExamSelect?: () => void
}

interface SidebarContentProps {
  courseTitle: string
  language: 'en' | 'tr'
  lessons: CourseModule[]
  activeLessonId: string | null
  lessonProgressByLessonId: Record<string, LessonProgress>
  courseProgressSummary?: CourseProgressSummary | null
  showFinalExamEntry?: boolean
  isFinalExamLocked?: boolean
  finalExamLabel?: string
  finalExamHint?: string
  onLessonSelect: (lessonId: string) => void
  onFinalExamSelect?: () => void
  onClose?: () => void
}

const SidebarContent = ({
  activeLessonId,
  courseProgressSummary,
  courseTitle,
  finalExamHint,
  finalExamLabel,
  isFinalExamLocked = true,
  language,
  lessonProgressByLessonId,
  lessons,
  onClose,
  onFinalExamSelect,
  onLessonSelect,
  showFinalExamEntry = false,
}: SidebarContentProps) => {
  const lessonsLabel = language === 'tr' ? 'ders' : 'lessons'
  const contentTitle = language === 'tr' ? 'Ders listesi' : 'Lesson list'
  const contentDescription = language === 'tr' ? 'Kurs icerigini buradan takip edebilirsin.' : 'Follow the course content from here.'

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
      <div className="border-b border-[color:var(--border)] px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[color:var(--text-subtle)]">{contentTitle}</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--text-heading)]">{courseTitle}</p>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">{lessons.length} {lessonsLabel}</p>
          </div>

          {onClose ? (
            <button
              aria-label={language === 'tr' ? 'Ders listesini kapat' : 'Close lesson list'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-heading)]"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <p className="mt-2 text-xs text-[color:var(--text-muted)]">{contentDescription}</p>

        {courseProgressSummary ? (
          <div className="mt-3 border-t border-[color:var(--border)] pt-3">
            <CourseProgressBar
              compact
              completedLessons={courseProgressSummary.completedLessons}
              language={language}
              percentage={courseProgressSummary.overallPercentage}
              totalLessons={courseProgressSummary.totalLessons}
            />
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <LessonSidebarItem
              index={index}
              isActive={lesson.id === activeLessonId}
              key={lesson.id}
              language={language}
              lesson={lesson}
              lessonProgress={lessonProgressByLessonId[lesson.id]}
              onSelect={onLessonSelect}
            />
          ))}

          {showFinalExamEntry && onFinalExamSelect ? (
            <button
              className={cn(
                'group mt-3 w-full rounded-[var(--radius-cards)] border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-strong)]',
                isFinalExamLocked
                  ? 'border-[color:var(--border)] bg-[color:var(--surface-soft)] hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
                  : 'border-[color:var(--primary)] bg-[color:color-mix(in_srgb,var(--primary)_10%,var(--surface-soft))] hover:border-[color:color-mix(in_srgb,var(--primary)_65%,var(--border-strong))]',
              )}
              onClick={onFinalExamSelect}
              type="button"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-6 shrink-0 text-center text-[11px] font-semibold tracking-wide text-[color:var(--text-subtle)]">
                  EX
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-sm font-semibold text-[color:var(--text-heading)]">
                      {finalExamLabel ?? (language === 'tr' ? 'Final sinavi' : 'Final exam')}
                    </p>
                    {isFinalExamLocked ? (
                      <LockKeyhole className="h-4 w-4 shrink-0 text-[color:var(--text-muted)]" />
                    ) : (
                      <GraduationCap className="h-4 w-4 shrink-0 text-[color:var(--primary)]" />
                    )}
                  </div>

                  <p className="mt-1.5 text-[11px] text-[color:var(--text-muted)]">
                    {finalExamHint ?? (isFinalExamLocked
                      ? (language === 'tr' ? 'Tum dersleri tamamladiktan sonra acilir.' : 'Unlocks after all lessons are completed.')
                      : (language === 'tr' ? 'Sinav hazir, baslayabilirsin.' : 'Exam is ready to start.'))}
                  </p>
                </div>
              </div>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const LessonSidebar = ({
  activeLessonId,
  courseProgressSummary,
  courseTitle,
  finalExamHint,
  finalExamLabel,
  isFinalExamLocked,
  isDesktopOpen,
  isMobileOpen,
  language,
  lessonProgressByLessonId,
  lessons,
  onFinalExamSelect,
  onLessonSelect,
  onMobileClose,
  showFinalExamEntry,
}: LessonSidebarProps) => (
  <>
    <aside
      className={cn(
        'hidden h-full min-h-0 transition-[width] duration-300 ease-out lg:block',
        isDesktopOpen ? 'w-[360px] xl:w-[390px]' : 'w-0',
      )}
    >
      <div
        className={cn(
          'h-full transition-all duration-300 ease-out',
          isDesktopOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-3 opacity-0',
        )}
      >
        <SidebarContent
          activeLessonId={activeLessonId}
          courseProgressSummary={courseProgressSummary}
          courseTitle={courseTitle}
          finalExamHint={finalExamHint}
          finalExamLabel={finalExamLabel}
          isFinalExamLocked={isFinalExamLocked}
          language={language}
          lessonProgressByLessonId={lessonProgressByLessonId}
          lessons={lessons}
          onFinalExamSelect={onFinalExamSelect}
          onLessonSelect={onLessonSelect}
          showFinalExamEntry={showFinalExamEntry}
        />
      </div>
    </aside>

    {isMobileOpen ? (
      <div className="fixed inset-0 z-50 lg:hidden">
        <button
          aria-label={language === 'tr' ? 'Ders listesi arka plani' : 'Lesson list backdrop'}
          className="absolute inset-0 bg-black/55"
          onClick={onMobileClose}
          type="button"
        />

        <aside className="absolute right-0 top-0 h-full w-[min(92vw,390px)] p-3">
          <SidebarContent
            activeLessonId={activeLessonId}
            courseProgressSummary={courseProgressSummary}
            courseTitle={courseTitle}
            finalExamHint={finalExamHint}
            finalExamLabel={finalExamLabel}
            isFinalExamLocked={isFinalExamLocked}
            language={language}
            lessonProgressByLessonId={lessonProgressByLessonId}
            lessons={lessons}
            onClose={onMobileClose}
            onFinalExamSelect={onFinalExamSelect}
            onLessonSelect={onLessonSelect}
            showFinalExamEntry={showFinalExamEntry}
          />
        </aside>
      </div>
    ) : null}
  </>
)

export default LessonSidebar
