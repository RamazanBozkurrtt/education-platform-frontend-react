import type { SyntheticEvent } from 'react'
import { ArrowRight, BookOpen, CheckCircle2, CirclePlay, Clock3, Layers3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { resolveServiceUrl } from '../config/api'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import EmptyState from '../components/dashboard/EmptyState'
import CourseProgressBar from '../components/progress/CourseProgressBar'
import Button from '../components/ui/Button'
import { useCourseProgressSummaries } from '../hooks/useCourseProgress'
import { useLanguage } from '../hooks/useLanguage'
import { API_ENDPOINTS } from '../services/endpoints'
import { useLibrary } from '../hooks/useLibrary'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryFilterKeys, getCourseCategoryLabels } from '../utils/courseCategory'
import { buildCoursePlayerPath, resolveContinueLessonId } from '../utils/courseProgress'
import { resolveCourseDurationLabel } from '../utils/duration'

const getLocalizedCopy = (language: 'en' | 'tr') => ({
  action: language === 'tr' ? 'Aksiyon' : 'Action',
  category: language === 'tr' ? 'Kategori' : 'Category',
  completed: language === 'tr' ? 'Tamamlandi' : 'Completed',
  course: language === 'tr' ? 'Kurs' : 'Course',
  general: language === 'tr' ? 'Genel' : 'General',
  instructor: language === 'tr' ? 'Egitmen' : 'Instructor',
  level: language === 'tr' ? 'Seviye' : 'Level',
  nextLesson: language === 'tr' ? 'Siradaki ders' : 'Next lesson',
  noLevel: language === 'tr' ? 'Seviye belirtilmedi' : 'No level set',
  notStarted: language === 'tr' ? 'Baslanmadi' : 'Not started',
  ongoing: language === 'tr' ? 'Devam ediyor' : 'In progress',
  overview: language === 'tr' ? 'Ozet' : 'Overview',
  progress: language === 'tr' ? 'Ilerleme' : 'Progress',
  readyToStart: language === 'tr' ? 'Ilk ders hazir' : 'First lesson ready',
  startCourse: language === 'tr' ? 'Kursa basla' : 'Start course',
  continueCourse: language === 'tr' ? 'Devam et' : 'Continue',
})

const MyCoursesPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const copy = getLocalizedCopy(language)
  const { purchasedCourses } = useLibrary()
  const courseProgressMap = useCourseProgressSummaries(purchasedCourses.map((course) => course.id))
  const hasCourses = purchasedCourses.length > 0
  const totalLessons = purchasedCourses.reduce((sum, course) => sum + course.lessons, 0)
  const averageProgress = hasCourses
    ? Math.round(
      purchasedCourses.reduce((sum, course) => {
        const summary = courseProgressMap[course.id]?.data
        return sum + (summary?.overallPercentage ?? course.progress)
      }, 0) / purchasedCourses.length,
    )
    : 0
  const categoryCount = new Set(
    purchasedCourses.flatMap((course) => getCourseCategoryFilterKeys(course)),
  ).size
  const summaryMetrics = [
    {
      icon: BookOpen,
      label: t('myCourses.stats.purchased'),
      value: String(purchasedCourses.length),
    },
    {
      icon: CheckCircle2,
      label: t('myCourses.stats.lessons'),
      value: String(totalLessons),
    },
    {
      icon: Clock3,
      label: t('myCourses.stats.progress'),
      value: `%${averageProgress}`,
    },
    {
      icon: Layers3,
      label: t('myCourses.stats.categories'),
      value: String(categoryCount),
    },
  ]

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget
    const fallbackSrc = target.dataset.fallbackSrc

    if (!fallbackSrc || target.dataset.fallbackApplied === 'true') {
      return
    }

    target.dataset.fallbackApplied = 'true'
    target.src = fallbackSrc
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        actions={
          <Link to={ROUTES.courses}>
            <Button asChild variant="secondary">
              {t('myCourses.exploreMore')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
        description={t('myCourses.description')}
        eyebrow={t('myCourses.eyebrow')}
        title={t('myCourses.title')}
      />

      <section
        aria-label={copy.overview}
        className="grid overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] md:grid-cols-4"
      >
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <div className="flex items-center gap-3 border-b border-[color:var(--border)] px-4 py-3 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0" key={metric.label}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--text-muted)]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="theme-subtle truncate text-[11px] font-semibold uppercase tracking-[0.08em]">{metric.label}</p>
                <p className="theme-heading mt-0.5 text-xl font-semibold leading-tight">{metric.value}</p>
              </div>
            </div>
          )
        })}
      </section>

      <DashboardSection
        description={t('myCourses.description')}
        title={t('myCourses.title')}
      >
        {hasCourses ? (
          <div className="overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
            <div className="hidden grid-cols-[minmax(330px,1.5fr)_minmax(190px,0.7fr)_minmax(220px,0.8fr)_minmax(180px,0.75fr)_150px] border-b border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-left md:grid">
              <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.08em]">{copy.course}</p>
              <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.08em]">{copy.category}</p>
              <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.08em]">{copy.progress}</p>
              <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.08em]">{t('courseDetail.duration')}</p>
              <p className="theme-subtle text-right text-xs font-semibold uppercase tracking-[0.08em]">{copy.action}</p>
            </div>

            <div className="divide-y divide-[color:var(--border)]">
              {purchasedCourses.map((course) => {
                const categoryLabels = getCourseCategoryLabels(course)
                const fallbackImageSrc = resolveServiceUrl(API_ENDPOINTS.courses.image.public(course.id))
                const progressSummary = courseProgressMap[course.id]?.data ?? null
                const overallPercentage = progressSummary?.overallPercentage ?? course.progress
                const normalizedProgress = Math.min(100, Math.max(0, Math.round(overallPercentage)))
                const continueLessonId = resolveContinueLessonId(progressSummary, course.modules)
                const continuePath = buildCoursePlayerPath(course.slug, continueLessonId)
                const durationLabel = resolveCourseDurationLabel(course, language)
                const rowContinueLabel = (progressSummary && (progressSummary.overallPercentage > 0 || progressSummary.lastLessonId))
                  ? copy.continueCourse
                  : copy.startCourse
                const statusLabel = normalizedProgress >= 100
                  ? copy.completed
                  : normalizedProgress > 0 || progressSummary?.lastLessonId
                    ? copy.ongoing
                    : copy.notStarted
                const lastLessonTitle = course.modules.find((module) => module.id === progressSummary?.lastLessonId)?.title
                const nextLessonLabel = lastLessonTitle ?? course.modules[0]?.title ?? copy.readyToStart
                const primaryCategory = categoryLabels[0] ?? course.category ?? copy.general
                const additionalCategoryCount = Math.max(0, categoryLabels.length - 1)
                const levelLabel = course.level?.levelName || course.levelKey || copy.noLevel

                return (
                  <article
                    className="grid gap-4 px-4 py-4 transition-colors hover:bg-[color:var(--surface-hover)] md:grid-cols-[minmax(330px,1.5fr)_minmax(190px,0.7fr)_minmax(220px,0.8fr)_minmax(180px,0.75fr)_150px] md:items-center"
                    key={course.id}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Link
                        aria-label={course.title}
                        className="shrink-0 overflow-hidden rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)]"
                        to={ROUTES.courseDetail(course.slug)}
                      >
                        <img
                          alt={course.title}
                          className="h-16 w-24 object-cover md:h-[58px] md:w-[86px]"
                          data-fallback-src={fallbackImageSrc}
                          loading="lazy"
                          onError={handleImageError}
                          src={course.imageUrl || fallbackImageSrc}
                        />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link className="theme-heading line-clamp-2 font-semibold leading-snug hover:text-[color:var(--primary)]" to={ROUTES.courseDetail(course.slug)}>
                            {course.title}
                          </Link>
                          <span className="inline-flex h-6 items-center rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2 text-[11px] font-semibold text-[color:var(--text-muted)]">
                            {statusLabel}
                          </span>
                        </div>
                        <p className="theme-muted mt-1 truncate text-xs">
                          {copy.instructor}: {course.instructor.name}
                        </p>
                        <p className="theme-subtle mt-1 line-clamp-2 text-xs leading-5 md:max-w-xl">{course.summary}</p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-2 md:block">
                      <div>
                        <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.08em] md:hidden">{copy.category}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5 md:mt-0">
                          <span className="inline-flex min-h-6 items-center rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2 text-xs font-medium text-[color:var(--text-heading)]">
                            {primaryCategory}
                          </span>
                          {additionalCategoryCount > 0 ? (
                            <span className="inline-flex min-h-6 items-center rounded-sm border border-[color:var(--border)] px-2 text-xs font-medium text-[color:var(--text-muted)]">
                              +{additionalCategoryCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="md:mt-2">
                        <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.08em] md:hidden">{copy.level}</p>
                        <p className="theme-muted mt-1 truncate text-xs md:mt-0">{levelLabel}</p>
                      </div>
                    </div>

                    <div>
                      <p className="theme-subtle mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] md:hidden">{copy.progress}</p>
                      <CourseProgressBar
                        compact
                        completedLessons={progressSummary?.completedLessons}
                        language={language}
                        percentage={overallPercentage}
                        totalLessons={progressSummary?.totalLessons}
                      />
                      <p className="theme-subtle mt-2 line-clamp-1 text-xs">
                        {copy.nextLesson}: {nextLessonLabel}
                      </p>
                    </div>

                    <div className="grid gap-1.5 text-sm sm:grid-cols-2 md:block">
                      <p className="theme-muted flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[color:var(--text-subtle)]" />
                        {t('courseCard.lessonsValue', { count: course.lessons })}
                      </p>
                      <p className="theme-muted flex items-center gap-2 md:mt-2">
                        <Clock3 className="h-4 w-4 text-[color:var(--text-subtle)]" />
                        {durationLabel}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Link className="flex-1 sm:flex-none" to={continuePath}>
                        <Button asChild className="w-full min-w-[128px] whitespace-nowrap" size="sm">
                          <CirclePlay className="h-4 w-4" />
                          {rowContinueLabel}
                        </Button>
                      </Link>
                      <Link className="flex-1 sm:flex-none" to={ROUTES.courseDetail(course.slug)}>
                        <Button asChild className="w-full whitespace-nowrap" size="sm" variant="ghost">
                          {t('common.viewDetails')}
                        </Button>
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            action={(
              <Link className="inline-flex" to={ROUTES.courses}>
                <Button asChild>
                  {t('myCourses.exploreMore')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            description={t('myCourses.emptyDescription')}
            title={t('myCourses.emptyTitle')}
          />
        )}
      </DashboardSection>
    </div>
  )
}

export default MyCoursesPage
