import type { SyntheticEvent } from 'react'
import { ArrowRight, CirclePlay } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { resolveServiceUrl } from '../config/api'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import EmptyState from '../components/dashboard/EmptyState'
import MetricTile from '../components/dashboard/MetricTile'
import StatusBadge from '../components/dashboard/StatusBadge'
import TableShell from '../components/dashboard/TableShell'
import CourseProgressBar from '../components/progress/CourseProgressBar'
import Button from '../components/ui/Button'
import { useCourseProgressSummaries } from '../hooks/useCourseProgress'
import { useLanguage } from '../hooks/useLanguage'
import { API_ENDPOINTS } from '../services/endpoints'
import { useLibrary } from '../hooks/useLibrary'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryFilterKeys, getCourseCategoryLabels } from '../utils/courseCategory'
import { buildCoursePlayerPath, resolveContinueLessonId } from '../utils/courseProgress'

const MyCoursesPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
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
  const labels = {
    course: language === 'tr' ? 'Kurs' : 'Course',
    category: language === 'tr' ? 'Kategori' : 'Category',
    actions: language === 'tr' ? 'Islem' : 'Action',
  }
  const continueButtonLabel = language === 'tr' ? 'Devam et' : 'Continue'
  const startButtonLabel = language === 'tr' ? 'Kursa basla' : 'Start course'

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

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile hint={t('myCourses.stats.purchased')} label={t('myCourses.stats.purchased')} tone="primary" value={String(purchasedCourses.length)} />
        <MetricTile hint={t('myCourses.stats.lessons')} label={t('myCourses.stats.lessons')} tone="neutral" value={String(totalLessons)} />
        <MetricTile hint={t('myCourses.stats.progress')} label={t('myCourses.stats.progress')} progress={averageProgress} tone="success" value={`%${averageProgress}`} />
        <MetricTile hint={t('myCourses.stats.categories')} label={t('myCourses.stats.categories')} tone="warning" value={String(categoryCount)} />
      </section>

      <DashboardSection title={t('myCourses.title')}>
        {hasCourses ? (
          <TableShell>
            <table className="min-w-[980px] w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-soft)] text-left">
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{labels.course}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{labels.category}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{t('courseDetail.lessons')}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{t('courseDetail.duration')}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{t('dashboard.progress')}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{labels.actions}</th>
                </tr>
              </thead>
              <tbody>
                {purchasedCourses.map((course) => {
                  const categoryLabels = getCourseCategoryLabels(course)
                  const fallbackImageSrc = resolveServiceUrl(API_ENDPOINTS.courses.image.public(course.id))
                  const progressSummary = courseProgressMap[course.id]?.data ?? null
                  const overallPercentage = progressSummary?.overallPercentage ?? course.progress
                  const continueLessonId = resolveContinueLessonId(progressSummary, course.modules)
                  const continuePath = buildCoursePlayerPath(course.slug, continueLessonId)
                  const rowContinueLabel = (progressSummary && (progressSummary.overallPercentage > 0 || progressSummary.lastLessonId))
                    ? continueButtonLabel
                    : startButtonLabel

                  return (
                    <tr className="border-b border-[color:var(--border)] align-top last:border-b-0" key={course.id}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          <Link
                            className="shrink-0 overflow-hidden rounded-[var(--radius-navigation)] border border-[color:var(--border)]"
                            to={ROUTES.courseDetail(course.slug)}
                          >
                            <img
                              alt={course.title}
                              className="h-16 w-24 object-cover"
                              data-fallback-src={fallbackImageSrc}
                              loading="lazy"
                              onError={handleImageError}
                              src={course.imageUrl || fallbackImageSrc}
                            />
                          </Link>
                          <div className="min-w-0">
                            <p className="theme-heading line-clamp-2 font-medium">{course.title}</p>
                            <p className="theme-muted mt-1 line-clamp-2 text-xs">{course.summary}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex max-w-[220px] flex-wrap gap-1.5">
                          {categoryLabels.length > 0
                            ? categoryLabels.slice(0, 3).map((categoryLabel) => (
                              <StatusBadge
                                className="rounded-full border-[color:var(--border-strong)] bg-[color:var(--surface-soft)] px-2.5 normal-case tracking-normal"
                                key={`${course.id}-${categoryLabel}`}
                              >
                                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />
                                {categoryLabel}
                              </StatusBadge>
                            ))
                            : (
                              <StatusBadge className="rounded-full border-[color:var(--border-strong)] bg-[color:var(--surface-soft)] px-2.5 normal-case tracking-normal">
                                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[color:var(--primary)]" />
                                General
                              </StatusBadge>
                            )}
                        </div>
                      </td>
                      <td className="theme-muted px-4 py-3.5">{t('courseCard.lessonsValue', { count: course.lessons })}</td>
                      <td className="theme-muted px-4 py-3.5">{course.duration}</td>
                      <td className="px-4 py-3.5">
                        <div className="w-[140px]">
                          <CourseProgressBar
                            compact
                            completedLessons={progressSummary?.completedLessons}
                            language={language}
                            percentage={overallPercentage}
                            totalLessons={progressSummary?.totalLessons}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Link to={continuePath}>
                            <Button asChild className="min-w-[116px] whitespace-nowrap" size="sm">
                              <CirclePlay className="h-4 w-4" />
                              {rowContinueLabel}
                            </Button>
                          </Link>
                          <Link to={ROUTES.courseDetail(course.slug)}>
                            <Button asChild size="sm" variant="ghost">
                              {t('common.viewDetails')}
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableShell>
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
