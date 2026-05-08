import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CirclePlay, Rocket, Sparkles, Target } from 'lucide-react'
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
import Modal from '../components/ui/Modal'
import QueryErrorState from '../components/ui/QueryErrorState'
import SectionHeader from '../components/ui/SectionHeader'
import TagList from '../components/ui/TagList'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { ROUTES } from '../utils/constants'
import { extractAuthRoles, isAdmin, isInstructor } from '../utils/roles'

const DashboardPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isAuthenticated, isBootstrapping, user, claims } = useAuth()
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false)
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
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Button onClick={() => setIsGoalsModalOpen(true)} variant="secondary">
              <Target className="h-4 w-4" />
              {t('dashboard.quarterlyGoals')}
            </Button>
            <Link to={ROUTES.courses}>
              <Button asChild>
                {t('common.exploreCatalog')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </>
        }
        description={t('dashboard.description')}
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
              { key: 'category', label: 'Kategori', value: data.focusCourse.category },
            ]}
          />

          <div className="mt-4 border-t border-white/8 pt-4">
            <TagList hideWhenEmpty label="Etiketler" tags={data.focusCourse.tags} />
          </div>

          <div className="mt-5 space-y-3">
            {data.focusCourse.modules.map((module, index) => (
              <div
                key={module.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-white/8 bg-[color:var(--surface-muted)] px-4 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--surface-strong)] text-xs font-semibold text-slate-100">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <p className="font-medium text-white">{module.title}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {module.type} · {module.duration}
                    </p>
                  </div>
                </div>
                <CirclePlay className="h-5 w-5 text-slate-500" />
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionHeader title={t('dashboard.upcomingMilestones')} />
            <div className="mt-4 space-y-3">
              {data.upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="rounded-lg border border-white/8 bg-[color:var(--surface-muted)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-100">{milestone.label}</p>
                    <InfoBadge>{milestone.status}</InfoBadge>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{milestone.due}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-[color:var(--primary)]" />
              <div>
                <h3 className="text-base font-semibold text-white">{t('dashboard.recentActivity')}</h3>
                <p className="text-sm text-slate-400">{t('dashboard.recentActivityDescription')}</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="rounded-lg border border-white/8 bg-[color:var(--surface-muted)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-100">{activity.title}</p>
                    <InfoBadge>{activity.tag}</InfoBadge>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{activity.description}</p>
                  <p className="mt-2 text-xs text-slate-500">{activity.time}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[color:var(--primary)]" />
              <p className="text-sm font-semibold text-white">{t('dashboard.operationalInsight')}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {t('dashboard.operationalInsightText')}
            </p>
          </Card>
        </div>
      </section>

      <Modal
        description={t('dashboard.quarterlyGoalsDescription')}
        onClose={() => setIsGoalsModalOpen(false)}
        open={isGoalsModalOpen}
        title={t('dashboard.quarterlyGoalsTitle')}
      >
        <div className="space-y-3">
          {[
            t('dashboard.quarterlyGoalOne'),
            t('dashboard.quarterlyGoalTwo'),
            t('dashboard.quarterlyGoalThree'),
          ].map((goal) => (
            <div key={goal} className="rounded-lg border border-white/8 bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-slate-200">
              {goal}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

export default DashboardPage
