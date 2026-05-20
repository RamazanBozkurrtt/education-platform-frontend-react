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
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import MetaRow from '../components/ui/MetaRow'
import QueryErrorState from '../components/ui/QueryErrorState'
import TagList from '../components/ui/TagList'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { extractAuthRoles, isAdmin, isInstructor } from '../utils/roles'

const DashboardPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isAuthenticated, isBootstrapping, user, claims } = useAuth()
  const isCurrentUserInstructor = isInstructor(user, claims)
  const audience = (isCurrentUserInstructor || isAdmin(user, claims)) ? 'instructor' : 'student'

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

      <section className="grid gap-7 xl:grid-cols-[1.35fr_0.95fr]">
        <DashboardSection
          description={data.focusCourse.description}
          title={data.focusCourse.title}
        >
          <div className="space-y-5">
            <MetaRow
              items={[
                { key: 'progress', label: t('dashboard.progress'), value: `${data.focusCourse.progress}%` },
                { key: 'lessons', label: t('courseDetail.lessons'), value: String(data.focusCourse.lessons) },
                { key: 'duration', label: t('courseDetail.duration'), value: data.focusCourse.duration },
                { key: 'category', label: language === 'tr' ? 'Kategori' : 'Category', value: getCourseCategoryLabel(data.focusCourse) },
              ]}
            />

            <div className="border-t border-[color:var(--border)] pt-4">
              <TagList hideWhenEmpty label={language === 'tr' ? 'Etiketler' : 'Tags'} tags={data.focusCourse.tags} />
            </div>

            <div className="overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
              <ul className="divide-y divide-[color:var(--border)]">
                {data.focusCourse.modules.map((module, index) => (
                  <li className="flex items-center justify-between gap-4 px-4 py-3.5" key={module.id}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="theme-subtle w-7 text-xs font-semibold">{String(index + 1).padStart(2, '0')}</span>
                      <div className="min-w-0">
                        <p className="theme-heading truncate text-sm font-medium">{module.title}</p>
                        <p className="theme-muted mt-0.5 text-xs">{module.type} · {module.duration}</p>
                      </div>
                    </div>
                    <CirclePlay className="theme-subtle h-4 w-4 shrink-0" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
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


