import { useEffect, useState } from 'react'
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
import { recommendationService } from '../services/recommendationService'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { buildCoursePlayerPath, resolveContinueLessonId } from '../utils/courseProgress'
import { resolveCourseDurationLabel, resolveLessonDurationLabel } from '../utils/duration'
import { extractAuthRoles, isAdmin, isInstructor } from '../utils/roles'

const DashboardPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isAuthenticated, isBootstrapping, user, claims } = useAuth()
  const { purchasedCourses } = useLibrary()
  const isCurrentUserInstructor = isInstructor(user, claims)
  const audience = (isCurrentUserInstructor || isAdmin(user, claims)) ? 'instructor' : 'student'
  const studentCourseProgressMap = useCourseProgressSummaries(purchasedCourses.map((course) => course.id))
  const [showRecommendationExplain, setShowRecommendationExplain] = useState(false)
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

  const {
    data: recommendationExplainData,
    isLoading: isRecommendationExplainLoading,
  } = useQuery({
    queryKey: ['recommendation-explain', user?.id, language],
    queryFn: () => recommendationService.getRecommendationExplain(),
    enabled: shouldLoadRecommendations && showRecommendationExplain,
  })

  useEffect(() => {
    console.log('[INSTRUCTOR_FLOW] current user:', user)
    console.log('[INSTRUCTOR_FLOW] current roles:', extractAuthRoles(user, claims))
    console.log('[INSTRUCTOR_FLOW] isInstructor:', isCurrentUserInstructor)
  }, [claims, isCurrentUserInstructor, user])

  const formatRate = (value?: number | null) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null
    }

    const normalized = value <= 1 ? value * 100 : value
    const percentage = Math.max(0, Math.min(100, Math.round(normalized)))
    return language === 'tr' ? `%${percentage}` : `${percentage}%`
  }

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

  const nextFocusModule = data.focusCourse.modules.find((module) => !module.completed) ?? null
  const focusCourseContinuePath = buildCoursePlayerPath(data.focusCourse.slug, nextFocusModule?.id)
  const focusCourseHasImage = typeof data.focusCourse.imageUrl === 'string' && data.focusCourse.imageUrl.trim().length > 0
  const focusCourseProgressLabel = data.focusCourse.progress > 0
    ? (language === 'tr' ? 'Devam et' : 'Continue')
    : (language === 'tr' ? 'Kursa basla' : 'Start course')
  const studentCourseProgressResults = purchasedCourses
    .map((course) => studentCourseProgressMap[course.id])
    .filter((result): result is NonNullable<typeof result> => Boolean(result))
  const isStudentProgressLoading = audience === 'student'
    && purchasedCourses.length > 0
    && studentCourseProgressResults.some((result) => result.isLoading || result.isFetching)
  const areAllStudentCoursesCompleted = audience === 'student'
    && purchasedCourses.length > 0
    && !isStudentProgressLoading
    && purchasedCourses.every((course) => {
      const summary = studentCourseProgressMap[course.id]?.data
      const completionPercentage = typeof summary?.overallPercentage === 'number'
        ? summary.overallPercentage
        : course.progress

      return completionPercentage >= 100
    })
  const shouldShowCourseCompletionCongrats = areAllStudentCoursesCompleted
  const focusSectionTitle = shouldShowCourseCompletionCongrats
    ? (language === 'tr' ? 'Tebrikler' : 'Congratulations')
    : (language === 'tr' ? 'Odak kurs' : 'Focus course')
  const focusSectionDescription = shouldShowCourseCompletionCongrats
    ? (language === 'tr'
      ? 'Tum derslerini tamamladin. Yeni hedefler icin hazirsin.'
      : 'You completed all lessons. You are ready for your next goals.')
    : data.focusCourse.description

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

      <RecommendationSection
        action={shouldLoadRecommendations ? (
          <Button
            onClick={() => setShowRecommendationExplain((currentValue) => !currentValue)}
            size="sm"
            variant="ghost"
          >
            {language === 'tr' ? 'Neden bu oneriler?' : 'Why these recommendations?'}
          </Button>
        ) : null}
        description={language === 'tr'
          ? 'Izleme aliskanliklarin ve ilgi alanlarina gore kisisellestirilmis oneriler.'
          : 'Personalized suggestions based on your activity and interests.'}
        emptyDescription={language === 'tr'
          ? 'Henuz oneri olusturmak icin yeterli veri yok. Populer kurslari kesfedebilirsin.'
          : 'There is not enough data to generate recommendations yet. Explore popular courses.'}
        emptyTitle={language === 'tr' ? 'Henuz ozel oneriler yok' : 'No personalized recommendations yet'}
        errorMessage={isDashboardRecommendationError ? 'failed' : null}
        isLoading={isDashboardRecommendationLoading}
        language={language}
        recommendations={dashboardRecommendationData?.recommendations ?? []}
        title={language === 'tr' ? 'Senin Icin Onerilen Kurslar' : 'Recommended For You'}
      />

      {showRecommendationExplain ? (
        <Card className="space-y-3 p-5">
          <p className="theme-heading text-sm font-semibold">
            {language === 'tr' ? 'Oneri ozeti' : 'Recommendation summary'}
          </p>

          {isRecommendationExplainLoading ? (
            <p className="theme-muted text-sm">{language === 'tr' ? 'Aciklama yukleniyor...' : 'Loading explanation...'}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {recommendationExplainData?.favoriteCategories && recommendationExplainData.favoriteCategories.length > 0 ? (
                <div className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">
                  <p className="theme-subtle text-xs">{language === 'tr' ? 'Ilgi kategorileri' : 'Top categories'}</p>
                  <p className="theme-heading mt-1 text-sm">{recommendationExplainData.favoriteCategories.join(', ')}</p>
                </div>
              ) : null}

              {recommendationExplainData?.preferredDurationLabel ? (
                <div className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">
                  <p className="theme-subtle text-xs">{language === 'tr' ? 'Tercih edilen sure' : 'Preferred duration'}</p>
                  <p className="theme-heading mt-1 text-sm">{recommendationExplainData.preferredDurationLabel}</p>
                </div>
              ) : null}

              {formatRate(recommendationExplainData?.averageCompletionRate) ? (
                <div className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">
                  <p className="theme-subtle text-xs">{language === 'tr' ? 'Ortalama tamamlama' : 'Avg completion'}</p>
                  <p className="theme-heading mt-1 text-sm">{formatRate(recommendationExplainData?.averageCompletionRate)}</p>
                </div>
              ) : null}

              {formatRate(recommendationExplainData?.dropoutRate) ? (
                <div className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">
                  <p className="theme-subtle text-xs">{language === 'tr' ? 'Birakma orani' : 'Dropout rate'}</p>
                  <p className="theme-heading mt-1 text-sm">{formatRate(recommendationExplainData?.dropoutRate)}</p>
                </div>
              ) : null}
            </div>
          )}

          {dashboardRecommendationData?.strategy || recommendationExplainData?.recommendationStrategy ? (
            <p className="theme-subtle text-xs">
              {language === 'tr' ? 'Model stratejisi:' : 'Model strategy:'}{' '}
              {recommendationExplainData?.recommendationStrategy ?? dashboardRecommendationData?.strategy}
            </p>
          ) : null}

          {recommendationExplainData?.explanation ? (
            <p className="theme-muted text-sm leading-6">{recommendationExplainData.explanation}</p>
          ) : null}
        </Card>
      ) : null}

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
          description={focusSectionDescription}
          title={focusSectionTitle}
        >
          {shouldShowCourseCompletionCongrats ? (
            <Card className="space-y-4 p-5">
              <p className="theme-heading text-lg font-semibold">
                {language === 'tr' ? 'Tum derslerini tamamladin, tebrikler!' : 'You completed all your lessons, congratulations!'}
              </p>
              <p className="theme-muted text-sm leading-6">
                {language === 'tr'
                  ? 'Yeni bir ogrenme hedefi belirlemek icin yeni kurslara goz atabilirsin.'
                  : 'You can explore new courses to set your next learning goal.'}
              </p>
              <Link to={ROUTES.courses}>
                <Button asChild size="sm">
                  {language === 'tr' ? 'Yeni kurslara goz at' : 'Explore new courses'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
            <div className="grid border-b border-[color:var(--border)] lg:grid-cols-[1.05fr_1fr]">
              <div className="relative min-h-[220px] overflow-hidden bg-[color:var(--surface-soft)]">
                {focusCourseHasImage ? (
                  <img
                    alt={data.focusCourse.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    src={data.focusCourse.imageUrl}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(120deg,var(--surface-soft),var(--surface-hover))]" />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.72))]" />

                <div className="absolute inset-x-4 top-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-[var(--radius-badges)] bg-[color:rgba(255,255,255,0.94)] px-2.5 py-1 text-xs font-semibold text-[color:var(--text-heading)]">
                    {getCourseCategoryLabel(data.focusCourse)}
                  </span>
                  <span className="rounded-[var(--radius-badges)] bg-[color:rgba(20,20,20,0.45)] px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {resolveCourseDurationLabel(data.focusCourse, language)}
                  </span>
                </div>

                <div className="absolute inset-x-4 bottom-4">
                  <p className="text-sm font-medium text-white/90">
                    {language === 'tr' ? 'Odak kurs' : 'Focus course'}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-tight text-white md:text-xl">
                    {data.focusCourse.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-white/80">
                    {data.focusCourse.summary}
                  </p>
                </div>
              </div>

              <div className="space-y-4 px-5 py-5">
                <MetaRow
                  items={[
                    { key: 'progress', label: t('dashboard.progress'), value: `${data.focusCourse.progress}%` },
                    { key: 'lessons', label: t('courseDetail.lessons'), value: String(data.focusCourse.lessons) },
                    { key: 'duration', label: t('courseDetail.duration'), value: resolveCourseDurationLabel(data.focusCourse, language) },
                    { key: 'category', label: language === 'tr' ? 'Kategori' : 'Category', value: getCourseCategoryLabel(data.focusCourse) },
                  ]}
                />

                <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="theme-muted text-xs font-medium">
                      {language === 'tr' ? 'Kurs ilerleme durumu' : 'Course progress'}
                    </p>
                    <span className="theme-heading text-xs font-semibold">{data.focusCourse.progress}%</span>
                  </div>
                  <div className="mt-2">
                    <CourseProgressBar
                      compact
                      language={language}
                      percentage={data.focusCourse.progress}
                    />
                  </div>
                </div>

                {nextFocusModule ? (
                  <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3">
                    <p className="theme-muted text-xs font-medium">
                      {language === 'tr' ? 'Siradaki ders' : 'Next lesson'}
                    </p>
                    <p className="theme-heading mt-1 truncate text-sm font-semibold">{nextFocusModule.title}</p>
                    <p className="theme-muted mt-1 text-xs">{resolveLessonDurationLabel(nextFocusModule, language)}</p>
                  </div>
                ) : (
                  <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3">
                    <p className="theme-muted text-sm leading-6">
                      {language === 'tr'
                        ? 'Bu kurstaki tum dersleri tamamladin. Istersen detaylara donup tekrar yapabilir ya da yeni bir kursa gecebilirsin.'
                        : 'You completed all lessons in this course. You can revisit details or continue with a new course.'}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Link to={focusCourseContinuePath}>
                    <Button asChild size="sm">
                      <CirclePlay className="h-4 w-4" />
                      {focusCourseProgressLabel}
                    </Button>
                  </Link>
                  <Link to={ROUTES.courseDetail(data.focusCourse.slug)}>
                    <Button asChild size="sm" variant="secondary">
                      {language === 'tr' ? 'Detaylari ac' : 'View details'}
                    </Button>
                  </Link>
                </div>

                <TagList hideWhenEmpty label={language === 'tr' ? 'Etiketler' : 'Tags'} tags={data.focusCourse.tags} />
              </div>
            </div>

            {data.focusCourse.modules.length > 0 ? (
              <ul className="space-y-3 px-5 py-5">
                {data.focusCourse.modules.slice(0, 4).map((module, index) => (
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
                            <span className="theme-muted text-xs">{resolveLessonDurationLabel(module, language)}</span>
                          </div>
                        </div>
                      </div>
                      <CirclePlay className="theme-subtle mt-0.5 h-4 w-4 shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="theme-muted px-5 py-5 text-sm">
                {language === 'tr' ? 'Bu kursta henuz ders bulunmuyor.' : 'No lessons are available for this course yet.'}
              </p>
            )}
            </Card>
          )}
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


