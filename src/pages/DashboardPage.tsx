import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CirclePlay, GraduationCap, LayoutDashboard, UserRoundCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ActivityList from '../components/dashboard/ActivityList'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import MetricTile from '../components/dashboard/MetricTile'
import StatusBadge from '../components/dashboard/StatusBadge'
import InstructorCtaCard from '../components/instructor/InstructorCtaCard'
import CourseProgressBar from '../components/progress/CourseProgressBar'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import MetaRow from '../components/ui/MetaRow'
import QueryErrorState from '../components/ui/QueryErrorState'
import TagList from '../components/ui/TagList'
import { useAuth } from '../hooks/useAuth'
import { useCourseProgressSummaries } from '../hooks/useCourseProgress'
import { useLanguage } from '../hooks/useLanguage'
import { useLibrary } from '../hooks/useLibrary'
import { courseService } from '../services/courseService'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { buildCoursePlayerPath, resolveContinueLessonId } from '../utils/courseProgress'
import { extractAuthRoles, isAdmin, isInstructor } from '../utils/roles'

const DashboardPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isAuthenticated, isBootstrapping, user, claims } = useAuth()
  const { purchasedCourses } = useLibrary()
  const isCurrentUserInstructor = isInstructor(user, claims)
  const audience = (isCurrentUserInstructor || isAdmin(user, claims)) ? 'instructor' : 'student'
  const studentCourseProgressMap = useCourseProgressSummaries(purchasedCourses.map((course) => course.id))

  const { data, error, isLoading } = useQuery({
    queryKey: ['dashboard-overview', user?.id, language, audience],
    queryFn: () => courseService.getDashboardOverview(language, audience),
    enabled: !isBootstrapping && isAuthenticated && Boolean(user),
  })

  useEffect(() => {
    console.log('[INSTRUCTOR_FLOW] current user:', user)
    console.log('[INSTRUCTOR_FLOW] current roles:', extractAuthRoles(user, claims))
    console.log('[INSTRUCTOR_FLOW] isInstructor:', isCurrentUserInstructor)
  }, [claims, isCurrentUserInstructor, user])

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !data) {
    return <Loader label={t('loader.dashboardMetrics')} />
  }

  const getMetricTone = (tone: 'cyan' | 'emerald' | 'amber' | 'indigo') => {
    if (tone === 'emerald') {
      return 'success'
    }

    if (tone === 'amber') {
      return 'warning'
    }

    if (tone === 'indigo') {
      return 'neutral'
    }

    return 'primary'
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        actions={
          <>
            <Link to={ROUTES.courses}>
              <Button asChild>
                {language === 'tr' ? 'Kurslari goruntule' : 'View courses'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            {user && !user.profileCompleted ? (
              <Link to={ROUTES.completeProfile}>
                <Button asChild variant="secondary">
                  <UserRoundCheck className="h-4 w-4" />
                  {language === 'tr' ? 'Profilini tamamla' : 'Complete profile'}
                </Button>
              </Link>
            ) : null}

            {isCurrentUserInstructor ? (
              <Link to={ROUTES.instructorDashboard}>
                <Button asChild variant="secondary">
                  <LayoutDashboard className="h-4 w-4" />
                  {language === 'tr' ? 'Egitmen paneline git' : 'Go to instructor panel'}
                </Button>
              </Link>
            ) : (
              <Link to={ROUTES.becomeInstructor}>
                <Button asChild variant="secondary">
                  <GraduationCap className="h-4 w-4" />
                  {language === 'tr' ? 'Egitmen ol' : 'Become instructor'}
                </Button>
              </Link>
            )}
          </>
        }
        description={language === 'tr'
          ? 'Kurslarini, ilerlemeni ve sonraki adimlarini tek ekranda yonet.'
          : 'Manage your courses, progress, and next actions from one screen.'}
        eyebrow={t('dashboard.eyebrow')}
        title={t('dashboard.title')}
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <MetricTile
            hint={language === 'tr' ? `Tamamlanma ${Math.round(metric.progress)}%` : `${Math.round(metric.progress)}% completed`}
            key={metric.label}
            label={metric.label}
            progress={metric.progress}
            tone={getMetricTone(metric.tone)}
            value={metric.value}
          />
        ))}
      </section>

      <InstructorCtaCard isInstructor={isCurrentUserInstructor} />

      {audience === 'student' ? (
        <DashboardSection
          description={language === 'tr'
            ? 'Kayitli kurslarinda son ilerlemene gore devam et.'
            : 'Continue from your latest lesson in enrolled courses.'}
          title={language === 'tr' ? 'Kurslarim' : 'My courses'}
        >
          {purchasedCourses.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
              <ul className="divide-y divide-[color:var(--border)]">
                {purchasedCourses.slice(0, 4).map((course) => {
                  const summaryResult = studentCourseProgressMap[course.id]
                  const summary = summaryResult?.data ?? null
                  const hasResumeData = Boolean(summary && (summary.overallPercentage > 0 || summary.lastLessonId))
                  const continueLabel = hasResumeData
                    ? (language === 'tr' ? 'Devam et' : 'Continue')
                    : (language === 'tr' ? 'Kursa basla' : 'Start course')
                  const continueLessonId = resolveContinueLessonId(summary, course.modules)
                  const continuePath = buildCoursePlayerPath(course.slug, continueLessonId)

                  return (
                    <li className="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between" key={course.id}>
                      <div className="min-w-0">
                        <p className="theme-heading truncate text-sm font-semibold">{course.title}</p>
                        <p className="theme-muted mt-1 text-xs">{getCourseCategoryLabel(course)}</p>
                        <div className="mt-3 w-[220px] max-w-full">
                          <CourseProgressBar
                            compact
                            completedLessons={summary?.completedLessons}
                            language={language}
                            percentage={summary?.overallPercentage ?? course.progress}
                            totalLessons={summary?.totalLessons}
                          />
                        </div>
                      </div>
                      <Link className="md:shrink-0" to={continuePath}>
                        <Button asChild className="w-full justify-center md:w-auto" size="sm">
                          <CirclePlay className="h-4 w-4" />
                          {continueLabel}
                        </Button>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <p className="theme-muted text-sm">
              {language === 'tr' ? 'Henuz kayitli kursun yok.' : 'You do not have any enrolled courses yet.'}
            </p>
          )}
        </DashboardSection>
      ) : null}

      <section className="grid gap-7 xl:grid-cols-[1.35fr_0.95fr]">
        <DashboardSection
          description={data.focusCourse.description}
          title={language === 'tr' ? 'Odak kurs' : 'Focus course'}
        >
          <Card className="space-y-5 p-0">
            <div className="space-y-4 border-b border-[color:var(--border)] px-5 py-5">
              <h3 className="theme-heading text-base font-semibold tracking-tight md:text-lg">
                {data.focusCourse.title}
              </h3>
              <MetaRow
                items={[
                  { key: 'progress', label: t('dashboard.progress'), value: `${data.focusCourse.progress}%` },
                  { key: 'lessons', label: t('courseDetail.lessons'), value: String(data.focusCourse.lessons) },
                  { key: 'duration', label: t('courseDetail.duration'), value: data.focusCourse.duration },
                  { key: 'category', label: language === 'tr' ? 'Kategori' : 'Category', value: getCourseCategoryLabel(data.focusCourse) },
                ]}
              />

              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3">
                <p className="theme-muted text-xs font-medium">
                  {language === 'tr' ? 'Kurs ilerleme durumu' : 'Course progress'}
                </p>
                <div className="mt-2">
                  <CourseProgressBar
                    compact
                    language={language}
                    percentage={data.focusCourse.progress}
                  />
                </div>
              </div>

              <TagList hideWhenEmpty label={language === 'tr' ? 'Etiketler' : 'Tags'} tags={data.focusCourse.tags} />
            </div>

            {data.focusCourse.modules.length > 0 ? (
              <ul className="space-y-3 px-5 pb-5">
                {data.focusCourse.modules.map((module, index) => (
                  <li key={module.id}>
                    <Link
                      className="flex items-start justify-between gap-4 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]"
                      to={buildCoursePlayerPath(data.focusCourse.slug, module.id)}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="theme-subtle mt-0.5 w-7 text-xs font-semibold">{String(index + 1).padStart(2, '0')}</span>
                        <div className="min-w-0">
                          <p className="theme-heading truncate text-sm font-medium">{module.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-2 py-0.5 text-[11px] font-medium theme-muted">
                              {module.type}
                            </span>
                            <span className="theme-muted text-xs">{module.duration}</span>
                          </div>
                        </div>
                      </div>
                      <CirclePlay className="theme-subtle mt-0.5 h-4 w-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="theme-muted px-5 pb-5 text-sm">
                {language === 'tr' ? 'Bu kursta henuz ders bulunmuyor.' : 'No lessons are available for this course yet.'}
              </p>
            )}
          </Card>
        </DashboardSection>

        <div className="space-y-7">
          <DashboardSection title={t('dashboard.upcomingMilestones')}>
            <ActivityList
              items={data.upcomingMilestones.map((milestone) => ({
                id: milestone.id,
                title: milestone.label,
                meta: milestone.due,
                badge: <StatusBadge>{milestone.status}</StatusBadge>,
              }))}
            />
          </DashboardSection>

          <DashboardSection
            description={t('dashboard.recentActivityDescription')}
            title={t('dashboard.recentActivity')}
          >
            <ActivityList
              items={data.recentActivity.map((activity) => ({
                id: activity.id,
                title: activity.title,
                description: activity.description,
                meta: activity.time,
                badge: <StatusBadge>{activity.tag}</StatusBadge>,
              }))}
            />
          </DashboardSection>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage


