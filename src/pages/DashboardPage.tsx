import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CirclePlay, Rocket, Sparkles, Target } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import Modal from '../components/ui/Modal'
import { courseService } from '../services/courseService'
import { ROUTES } from '../utils/constants'

const DashboardPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-overview', language],
    queryFn: () => courseService.getDashboardOverview(language),
  })

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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/8 px-6 py-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-xl">
                <div className={`mb-5 h-1.5 w-20 rounded-full bg-gradient-to-r ${data.focusCourse.accent}`} />
                <span className="rounded-full border border-white/12 bg-slate-950/30 px-3 py-1 text-xs font-semibold text-slate-100">
                  {t('dashboard.focusCourse')}
                </span>
                <h2 className="mt-5 text-3xl font-semibold text-white">{data.focusCourse.title}</h2>
                <p className="mt-4 max-w-lg text-sm leading-7 text-slate-200/90">
                  {data.focusCourse.description}
                </p>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-white/4 px-5 py-4 lg:min-w-[240px]">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('common.currentStatus')}</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {t('dashboard.progressComplete', { progress: data.focusCourse.progress })}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {t('dashboard.progressMeta', {
                    lessons: data.focusCourse.lessons,
                    duration: data.focusCourse.duration,
                  })}
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
            <div>
              <div className="flex flex-wrap gap-2">
                {data.focusCourse.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-6 space-y-4">
                {data.focusCourse.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <p className="font-medium text-white">{module.title}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {module.type} - {module.duration}
                        </p>
                      </div>
                    </div>
                    <CirclePlay className="h-5 w-5 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-sky-400/16 bg-sky-500/8">
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-100">{t('dashboard.progress')}</p>
                <p className="mt-3 text-4xl font-semibold text-white">{data.focusCourse.progress}%</p>
                <div className="mt-4 h-2 rounded-full bg-slate-900/70">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400"
                    style={{ width: `${data.focusCourse.progress}%` }}
                  />
                </div>
                <p className="mt-4 text-sm text-slate-300">{t('dashboard.keepMomentum')}</p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-white">{t('dashboard.upcomingMilestones')}</p>
                <div className="mt-4 space-y-4">
                  {data.upcomingMilestones.map((milestone) => (
                    <div key={milestone.id} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-slate-100">{milestone.label}</p>
                        <span className="rounded-full bg-white/6 px-3 py-1 text-xs text-slate-300">
                          {milestone.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{milestone.due}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/12 text-emerald-200">
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('dashboard.recentActivity')}</h3>
                <p className="text-sm text-slate-400">{t('dashboard.recentActivityDescription')}</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-100">{activity.title}</p>
                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                      {activity.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{activity.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">{activity.time}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-slate-400/12 bg-white/4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-sky-300" />
              <p className="text-sm font-semibold text-white">{t('dashboard.operationalInsight')}</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">
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
        <div className="space-y-4">
          {[
            t('dashboard.quarterlyGoalOne'),
            t('dashboard.quarterlyGoalTwo'),
            t('dashboard.quarterlyGoalThree'),
          ].map((goal) => (
            <div key={goal} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-slate-200">
              {goal}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

export default DashboardPage
