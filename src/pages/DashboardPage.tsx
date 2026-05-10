import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CirclePlay, GraduationCap, LayoutDashboard, UserRoundCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import InstructorCtaCard from '../components/instructor/InstructorCtaCard'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import InfoBadge from '../components/ui/InfoBadge'
import Loader from '../components/ui/Loader'
import MetaRow from '../components/ui/MetaRow'
import QueryErrorState from '../components/ui/QueryErrorState'
import SectionHeader from '../components/ui/SectionHeader'
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

  return (
    <div className="space-y-[var(--section-gap)]">
      <PageHeader
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {data.metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <InstructorCtaCard isInstructor={isCurrentUserInstructor} />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card>
          <SectionHeader
            description={data.focusCourse.description}
            title={data.focusCourse.title}
          />

          <MetaRow
            className="mt-4"
            items={[
              { key: 'progress', label: t('dashboard.progress'), value: `${data.focusCourse.progress}%` },
              { key: 'lessons', label: t('courseDetail.lessons'), value: String(data.focusCourse.lessons) },
              { key: 'duration', label: t('courseDetail.duration'), value: data.focusCourse.duration },
              { key: 'category', label: language === 'tr' ? 'Kategori' : 'Category', value: getCourseCategoryLabel(data.focusCourse) },
            ]}
          />

          <div className="mt-4 border-t border-[color:var(--border)] pt-4">
            <TagList hideWhenEmpty label={language === 'tr' ? 'Etiketler' : 'Tags'} tags={data.focusCourse.tags} />
          </div>

          <div className="mt-5 space-y-3">
            {data.focusCourse.modules.map((module, index) => (
              <div
                key={module.id}
                className="flex items-center justify-between gap-4 rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="theme-heading flex h-9 w-9 items-center justify-center rounded-[var(--radius-navigation)] bg-[color:var(--surface-muted)] text-xs font-semibold">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <p className="theme-heading font-medium">{module.title}</p>
                    <p className="theme-muted mt-1 text-xs">
                      {module.type} · {module.duration}
                    </p>
                  </div>
                </div>
                <CirclePlay className="theme-subtle h-5 w-5" />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionHeader title={t('dashboard.upcomingMilestones')} />
            <div className="mt-4 space-y-3">
              {data.upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="theme-heading text-sm font-medium">{milestone.label}</p>
                    <InfoBadge>{milestone.status}</InfoBadge>
                  </div>
                  <p className="theme-muted mt-2 text-xs">{milestone.due}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader
              description={t('dashboard.recentActivityDescription')}
              title={t('dashboard.recentActivity')}
            />
            <div className="mt-4 space-y-3">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="theme-heading text-sm font-medium">{activity.title}</p>
                    <InfoBadge>{activity.tag}</InfoBadge>
                  </div>
                  <p className="theme-muted mt-2 text-sm">{activity.description}</p>
                  <p className="theme-subtle mt-2 text-xs">{activity.time}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage

