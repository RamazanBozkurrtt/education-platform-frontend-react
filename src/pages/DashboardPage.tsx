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
import RecommendationSection from '../components/recommendations/RecommendationSection'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useAuth } from '../hooks/useAuth'
import { useCourseProgressSummaries } from '../hooks/useCourseProgress'
import { useLanguage } from '../hooks/useLanguage'
import { useLibrary } from '../hooks/useLibrary'
import { courseService } from '../services/courseService'
import { recommendationService } from '../services/recommendationService'
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
  const shouldLoadRecommendations = !isBootstrapping && isAuthenticated && Boolean(user)

  const { data, error, isLoading } = useQuery({
    queryKey: ['dashboard-overview', user?.id, language, audience],
    queryFn: () => courseService.getDashboardOverview(language, audience),
    enabled: !isBootstrapping && isAuthenticated && Boolean(user),
  })

  const {
    data: dashboardRecommendationData,
    isLoading: isDashboardRecommendationLoading,
    isError: isDashboardRecommendationError,
  } = useQuery({
    queryKey: ['dashboard-recommendations', user?.id, language],
    queryFn: () => recommendationService.getDashboardRecommendations(6),
    enabled: shouldLoadRecommendations,
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
                {language === 'tr' ? 'Kursları görüntüle' : 'View courses'}
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
                  {language === 'tr' ? 'Eğitmen paneline git' : 'Go to instructor panel'}
                </Button>
              </Link>
            ) : (
              <Link to={ROUTES.becomeInstructor}>
                <Button asChild variant="secondary">
                  <GraduationCap className="h-4 w-4" />
                  {language === 'tr' ? 'Eğitmen ol' : 'Become instructor'}
                </Button>
              </Link>
            )}
          </>
        }
        description={language === 'tr'
          ? 'Kurslarını, ilerlemeni ve sonraki adımlarını tek ekranda yönet.'
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

      <RecommendationSection
        description={language === 'tr'
          ? 'İzleme alışkanlıkların ve ilgi alanlarına göre kişiselleştirilmiş öneriler.'
          : 'Personalized suggestions based on your activity and interests.'}
        emptyDescription={language === 'tr'
          ? 'Henüz öneri oluşturmak için yeterli veri yok. Popüler kursları keşfedebilirsin.'
          : 'There is not enough data to generate recommendations yet. Explore popular courses.'}
        emptyTitle={language === 'tr' ? 'Henüz özel öneriler yok' : 'No personalized recommendations yet'}
        errorMessage={isDashboardRecommendationError ? 'failed' : null}
        isLoading={isDashboardRecommendationLoading}
        language={language}
        loadingMessage={language === 'tr'
          ? 'Sizin için önerdiğimiz kurslar yükleniyor lütfen bekleyiniz'
          : 'Recommended courses for you are loading. Please wait.'}
        recommendations={dashboardRecommendationData?.recommendations ?? []}
        title={language === 'tr' ? 'Senin İçin Önerilen Kurslar' : 'Recommended For You'}
      />

      {audience === 'student' ? (
        <DashboardSection
          description={language === 'tr'
            ? 'Kayitli kurslarinda son ilerlemene gore devam et.'
            : 'Continue from your latest lesson in enrolled courses.'}
          title={language === 'tr' ? 'Kurslarım' : 'My courses'}
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
              {language === 'tr' ? 'Henüz kayıtlı kursun yok.' : 'You do not have any enrolled courses yet.'}
            </p>
          )}
        </DashboardSection>
      ) : null}

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
    </div>
  )
}

export default DashboardPage


