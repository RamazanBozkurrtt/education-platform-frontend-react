import { ArrowRight, CirclePlay } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import EmptyState from '../components/dashboard/EmptyState'
import MetricTile from '../components/dashboard/MetricTile'
import StatusBadge from '../components/dashboard/StatusBadge'
import TableShell from '../components/dashboard/TableShell'
import Button from '../components/ui/Button'
import { useLanguage } from '../hooks/useLanguage'
import { useLibrary } from '../hooks/useLibrary'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryFilterKeys, getCourseCategoryLabel } from '../utils/courseCategory'

const MyCoursesPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { purchasedCourses } = useLibrary()
  const hasCourses = purchasedCourses.length > 0
  const totalLessons = purchasedCourses.reduce((sum, course) => sum + course.lessons, 0)
  const averageProgress = hasCourses
    ? Math.round(
      purchasedCourses.reduce((sum, course) => sum + course.progress, 0) / purchasedCourses.length,
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
            <table className="min-w-[860px] w-full border-collapse text-sm">
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
                {purchasedCourses.map((course) => (
                  <tr className="border-b border-[color:var(--border)] last:border-b-0" key={course.id}>
                    <td className="px-4 py-3.5">
                      <p className="theme-heading font-medium">{course.title}</p>
                      <p className="theme-muted mt-1 line-clamp-1 text-xs">{course.summary}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge>{getCourseCategoryLabel(course)}</StatusBadge>
                    </td>
                    <td className="theme-muted px-4 py-3.5">{t('courseCard.lessonsValue', { count: course.lessons })}</td>
                    <td className="theme-muted px-4 py-3.5">{course.duration}</td>
                    <td className="px-4 py-3.5">
                      <div className="w-[140px]">
                        <p className="theme-muted mb-1 text-xs">{t('dashboard.progressComplete', { progress: course.progress })}</p>
                        <div className="h-1.5 rounded bg-[color:var(--surface-muted)]">
                          <div className="h-full rounded bg-[color:var(--primary)]" style={{ width: `${course.progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link to={ROUTES.coursePlayer(course.slug)}>
                          <Button asChild size="sm">
                            <CirclePlay className="h-4 w-4" />
                            {t('myCourses.continueLearning')}
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
                ))}
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

