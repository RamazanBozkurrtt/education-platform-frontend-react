import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Clock3, ListVideo, LockKeyhole, PlayCircle, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import { useCart } from '../hooks/useCart'
import { useLanguage } from '../hooks/useLanguage'
import { useLibrary } from '../hooks/useLibrary'
import { courseService } from '../services/courseService'
import { ROUTES } from '../utils/constants'

const sampleVideoSources = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
]

const CoursePlayerPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { slug = '' } = useParams()
  const { addCourse, isInCart } = useCart()
  const { isPurchased } = useLibrary()
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const { data, isLoading } = useQuery({
    queryKey: ['course-player', language, slug],
    queryFn: () => courseService.getCourseBySlug(slug, language),
  })

  useEffect(() => {
    setActiveModuleIndex(0)
  }, [data?.id])

  if (isLoading || !data) {
    return <Loader label={t('loader.courseDetails')} />
  }

  const purchased = isPurchased(data.id)
  const activeModule = data.modules[activeModuleIndex] ?? data.modules[0]
  const activeVideoSource = sampleVideoSources[activeModuleIndex % sampleVideoSources.length]

  if (!purchased) {
    return (
      <div className="space-y-6">
        <PageHeader
          description={t('player.lockedDescription')}
          eyebrow={data.category}
          title={t('player.lockedTitle')}
        />

        <Card className="overflow-hidden p-0">
          <div className={`h-1.5 bg-gradient-to-r ${data.accent}`} />
          <div className="grid gap-8 p-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-amber-400/10 text-amber-200">
                <LockKeyhole className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-3xl font-semibold text-white">{data.title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{data.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {data.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Card className="h-fit border-amber-300/16 bg-amber-400/8">
              <p className="text-xs uppercase tracking-[0.22em] text-amber-100">{t('player.accessRequired')}</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">{t('player.accessExplanation')}</p>
              <div className="mt-6 space-y-3">
                {isInCart(data.id) ? (
                  <Link className="block" to={ROUTES.cart}>
                    <Button asChild className="w-full justify-center" variant="secondary">
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      {t('common.goToCart')}
                    </Button>
                  </Link>
                ) : (
                  <Button className="w-full justify-center" onClick={() => addCourse(data.id)}>
                    <ShoppingCart className="h-4 w-4" />
                    {t('common.addToCart')}
                  </Button>
                )}
                <Link className="block" to={ROUTES.courseDetail(data.slug)}>
                  <Button asChild className="w-full justify-center" variant="ghost">
                    {t('common.backToCourse')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link to={ROUTES.courseDetail(data.slug)}>
            <Button asChild variant="secondary">
              {t('common.backToCourse')}
            </Button>
          </Link>
        }
        description={t('player.description')}
        eyebrow={t('player.eyebrow')}
        title={data.title}
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="overflow-hidden p-0">
          <div className={`h-1.5 bg-gradient-to-r ${data.accent}`} />
          <div className="p-6">
            <div className="overflow-hidden rounded-[28px] border border-white/8 bg-slate-950/70">
              <video
                className="aspect-video w-full bg-slate-950 object-cover"
                controls
                key={`${data.id}-${activeModule.id}`}
                preload="metadata"
              >
                <source src={activeVideoSource} type="video/mp4" />
              </video>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_260px]">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">{t('player.nowPlaying')}</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">{activeModule.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">{data.description}</p>
              </div>
              <Card className="h-fit border-sky-300/16 bg-sky-400/8">
                <p className="text-xs uppercase tracking-[0.22em] text-sky-100">{t('player.moduleMeta')}</p>
                <div className="mt-4 space-y-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <span>{t('player.lessonType')}</span>
                    <span>{activeModule.type}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>{t('player.runtime')}</span>
                    <span>{activeModule.duration}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>{t('player.accessStatus')}</span>
                    <span>{t('player.purchasedAccess')}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                <ListVideo className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t('player.courseContent')}</p>
                <p className="text-sm text-slate-400">{t('player.chooseLesson')}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {data.modules.map((module, index) => {
                const active = module.id === activeModule.id

                return (
                  <button
                    key={module.id}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      active
                        ? 'border-cyan-300/28 bg-cyan-400/12'
                        : 'border-white/8 bg-white/4 hover:border-white/14 hover:bg-white/6'
                    }`}
                    onClick={() => setActiveModuleIndex(index)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-white">{module.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {module.duration}
                          </span>
                          <span>{module.type}</span>
                        </div>
                      </div>
                      <PlayCircle className={`h-5 w-5 shrink-0 ${active ? 'text-cyan-200' : 'text-slate-500'}`} />
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">{t('courseDetail.instructor')}</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">{data.instructor.name}</h3>
            <p className="mt-2 text-sm text-slate-400">{data.instructor.role}</p>
            <p className="mt-5 text-sm leading-7 text-slate-300">{data.instructor.bio}</p>
          </Card>

          <Card className="border-emerald-300/16 bg-emerald-400/8">
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">{t('player.outcomes')}</p>
            <div className="mt-4 space-y-3">
              {data.outcomes.slice(0, 3).map((outcome) => (
                <div key={outcome} className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-slate-100">
                  {outcome}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default CoursePlayerPage
