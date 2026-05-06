import { useQuery } from '@tanstack/react-query'
import { ArrowRight, BadgeCheck, BookOpen, CheckCircle2, Clock3, PlayCircle, ShoppingCart, Users2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { courseService } from '../services/courseService'
import { ROUTES } from '../utils/constants'
import { formatCurrency } from '../utils/helpers'

const CourseDetailPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { addCourse, isInCart } = useCart()
  const { isPurchased } = useLibrary()
  const { slug = '' } = useParams()
  const { data, error, isLoading } = useQuery({
    queryKey: ['course', language, slug],
    queryFn: () => courseService.getCourseBySlug(slug, language),
  })

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !data) {
    return <Loader label={t('loader.courseDetails')} />
  }

  const purchased = isPurchased(data.id)

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          purchased ? (
            <Link to={ROUTES.coursePlayer(data.slug)}>
              <Button asChild>
                <PlayCircle className="h-4 w-4" />
                {t('common.watchCourse')}
              </Button>
            </Link>
          ) : isInCart(data.id) ? (
            <Link to={ROUTES.cart}>
              <Button asChild variant="secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {t('common.goToCart')}
              </Button>
            </Link>
          ) : (
            <Button onClick={() => addCourse(data.id)}>
              <ShoppingCart className="h-4 w-4" />
              {t('common.addToCart')}
            </Button>
          )
        }
        description={data.description}
        eyebrow={data.category}
        title={data.title}
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden p-0">
          <div className={`h-1.5 bg-gradient-to-r ${data.accent}`} />
          <div className="space-y-8 p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { icon: Clock3, label: t('courseDetail.duration'), value: data.duration },
                { icon: BookOpen, label: t('courseDetail.lessons'), value: t('courseDetail.lessonsValue', { count: data.lessons }) },
                { icon: Users2, label: t('courseDetail.enrolled'), value: t('courseDetail.enrolledValue', { students: data.students }) },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                  <item.icon className="h-5 w-5 text-cyan-200" />
                  <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">{t('courseDetail.whatYouWillMaster')}</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {data.outcomes.map((outcome) => (
                  <div key={outcome} className="flex gap-3 rounded-2xl border border-white/8 bg-white/4 p-4">
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-200" />
                    <p className="text-sm leading-6 text-slate-300">{outcome}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">{t('courseDetail.moduleBreakdown')}</h2>
              <div className="mt-5 space-y-3">
                {data.modules.map((module, index) => (
                  <div key={module.id} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/80 text-sm font-semibold text-cyan-200">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <p className="font-medium text-white">{module.title}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {module.type} - {module.duration}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {module.completed ? t('common.completed') : t('common.upcoming')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="border-sky-300/16 bg-sky-400/8">
            <p className="text-xs uppercase tracking-[0.22em] text-sky-100">{t('payment.orderSummary')}</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">{t('common.price')}</p>
                <p className="mt-2 text-4xl font-semibold text-white">{formatCurrency(data.price)}</p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                {data.level}
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-300">{t('courseDetail.purchaseDescription')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {purchased ? (
                <Link to={ROUTES.coursePlayer(data.slug)}>
                  <Button asChild>
                    <PlayCircle className="h-4 w-4" />
                    {t('common.watchCourse')}
                  </Button>
                </Link>
              ) : isInCart(data.id) ? (
                <Link to={ROUTES.cart}>
                  <Button asChild variant="secondary">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {t('common.goToCart')}
                  </Button>
                </Link>
              ) : (
                <Button onClick={() => addCourse(data.id)}>
                  <ShoppingCart className="h-4 w-4" />
                  {t('common.addToCart')}
                </Button>
              )}
              {!purchased ? (
                <Link to={ROUTES.payment}>
                  <Button asChild variant="ghost">
                    {t('common.continueToPayment')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">{t('courseDetail.instructor')}</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{data.instructor.name}</h3>
            <p className="mt-2 text-sm text-slate-400">{data.instructor.role}</p>
            <p className="mt-5 text-sm leading-7 text-slate-300">{data.instructor.bio}</p>
          </Card>

          <Card className="border-cyan-300/16 bg-cyan-400/8">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-100">{t('courseDetail.progressSnapshot')}</p>
            <p className="mt-4 text-4xl font-semibold text-white">{data.progress}%</p>
            <div className="mt-4 h-2 rounded-full bg-slate-900/60">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-cyan-300 to-blue-400"
                style={{ width: `${data.progress}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-slate-300">{t('courseDetail.continueDescription')}</p>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-white">{t('courseDetail.courseTags')}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default CourseDetailPage
