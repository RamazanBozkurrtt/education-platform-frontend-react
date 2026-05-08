import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Clock3, ListVideo, LockKeyhole, PlayCircle, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import InfoBadge from '../components/ui/InfoBadge'
import Loader from '../components/ui/Loader'
import MetaRow from '../components/ui/MetaRow'
import QueryErrorState from '../components/ui/QueryErrorState'
import SectionHeader from '../components/ui/SectionHeader'
import TagList from '../components/ui/TagList'
import { useCart } from '../hooks/useCart'
import { useLanguage } from '../hooks/useLanguage'
import { useLibrary } from '../hooks/useLibrary'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { courseMediaService } from '../services/courseMediaService'
import { courseService } from '../services/courseService'
import { ROUTES } from '../utils/constants'

const PLAYBACK_URL_REFRESH_BUFFER_MS = 3_000

const CoursePlayerPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { slug = '' } = useParams()
  const { addCourse, isInCart } = useCart()
  const { isPurchased } = useLibrary()
  const [activeModuleIndex, setActiveModuleIndex] = useState(0)
  const [activeVideoSource, setActiveVideoSource] = useState('')
  const [activeVideoExpiresAtMs, setActiveVideoExpiresAtMs] = useState<number | null>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoErrorMessage, setVideoErrorMessage] = useState<string | null>(null)
  const playbackRequestIdRef = useRef(0)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const pendingResumeRef = useRef<{ currentTime: number; shouldResumePlayback: boolean } | null>(null)
  const failedRefreshSourceRef = useRef<string | null>(null)

  const { data, error, isLoading } = useQuery({
    queryKey: ['course-player', language, slug],
    queryFn: () => courseService.getCourseBySlug(slug, language),
  })

  const purchased = data ? isPurchased(data.id) : false
  const activeModule = data ? (data.modules[activeModuleIndex] ?? data.modules[0]) : undefined
  const activeCourseId = data?.id ?? null
  const activeLessonId = activeModule?.id ?? null

  const loadPlaybackUrl = useCallback(async (
    params: { courseId: string; lessonId: string; preservePlaybackState?: boolean },
  ) => {
    if (params.preservePlaybackState) {
      const videoElement = videoElementRef.current
      if (videoElement) {
        pendingResumeRef.current = {
          currentTime: videoElement.currentTime,
          shouldResumePlayback: !videoElement.paused && !videoElement.ended,
        }
      }
    } else {
      pendingResumeRef.current = null
    }

    setIsVideoLoading(true)
    setVideoErrorMessage(null)

    const requestId = ++playbackRequestIdRef.current

    try {
      const { url, expiresAtMs } = await courseMediaService.getLessonPlaybackUrl(params.courseId, params.lessonId)

      if (requestId !== playbackRequestIdRef.current) {
        return
      }

      setActiveVideoSource(url)
      setActiveVideoExpiresAtMs(expiresAtMs)
      failedRefreshSourceRef.current = null
    } catch (loadError) {
      if (requestId !== playbackRequestIdRef.current) {
        return
      }

      setActiveVideoSource('')
      setActiveVideoExpiresAtMs(null)
      pendingResumeRef.current = null
      setVideoErrorMessage(normalizeApiError(loadError).message)
    } finally {
      if (requestId === playbackRequestIdRef.current) {
        setIsVideoLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    setActiveModuleIndex(0)
  }, [data?.id])

  useEffect(() => {
    if (!purchased || !activeCourseId || !activeLessonId) {
      setVideoErrorMessage(null)
      setIsVideoLoading(false)
      setActiveVideoSource('')
      setActiveVideoExpiresAtMs(null)
      pendingResumeRef.current = null
      failedRefreshSourceRef.current = null
      return
    }

    void loadPlaybackUrl({ courseId: activeCourseId, lessonId: activeLessonId })
  }, [activeCourseId, activeLessonId, loadPlaybackUrl, purchased])

  const handleVideoPlay = () => {
    if (!activeCourseId || !activeLessonId || !activeVideoExpiresAtMs) {
      return
    }

    const isExpiredOrNearExpiry = Date.now() >= activeVideoExpiresAtMs - PLAYBACK_URL_REFRESH_BUFFER_MS

    if (!isExpiredOrNearExpiry) {
      return
    }

    void loadPlaybackUrl({
      courseId: activeCourseId,
      lessonId: activeLessonId,
      preservePlaybackState: true,
    })
  }

  const handleVideoLoadedMetadata = () => {
    const pendingResume = pendingResumeRef.current
    const videoElement = videoElementRef.current

    if (!pendingResume || !videoElement) {
      return
    }

    const hasDuration = Number.isFinite(videoElement.duration) && videoElement.duration > 0

    if (hasDuration && pendingResume.currentTime > 0 && pendingResume.currentTime < videoElement.duration) {
      videoElement.currentTime = pendingResume.currentTime
    }

    pendingResumeRef.current = null

    if (pendingResume.shouldResumePlayback) {
      void videoElement.play().catch(() => undefined)
    }
  }

  const handleVideoError = () => {
    if (!activeCourseId || !activeLessonId || !purchased || !activeVideoSource) {
      return
    }

    const refreshKey = `${activeCourseId}:${activeLessonId}:${activeVideoSource}`

    if (failedRefreshSourceRef.current === refreshKey) {
      return
    }

    failedRefreshSourceRef.current = refreshKey
    void loadPlaybackUrl({
      courseId: activeCourseId,
      lessonId: activeLessonId,
      preservePlaybackState: true,
    })
  }

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !data) {
    return <Loader label={t('loader.courseDetails')} />
  }

  const activeModuleId = activeModule?.id ?? null
  const activeModuleTitle = activeModule?.title ?? t('player.chooseLesson')
  const activeModuleType = activeModule?.type ?? '-'
  const activeModuleDuration = activeModule?.duration ?? '-'

  if (!purchased) {
    return (
      <div className="space-y-6">
        <PageHeader
          description={t('player.lockedDescription')}
          eyebrow={data.category}
          title={t('player.lockedTitle')}
        />

        <Card>
          <SectionHeader
            description={t('player.accessExplanation')}
            title={data.title}
          />

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-amber-500/10 text-amber-200">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <InfoBadge tone="warning">{t('player.accessRequired')}</InfoBadge>
          </div>

          <MetaRow
            className="mt-5"
            items={[
              { key: 'duration', icon: Clock3, label: t('player.runtime'), value: data.duration },
              { key: 'type', label: t('player.lessonType'), value: data.level },
            ]}
          />

          <div className="mt-5 border-t border-white/8 pt-5">
            <TagList hideWhenEmpty label={language === 'tr' ? 'Etiketler' : 'Tags'} tags={data.tags} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {isInCart(data.id) ? (
              <Link className="block" to={ROUTES.cart}>
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
            <Link className="block" to={ROUTES.courseDetail(data.slug)}>
              <Button asChild variant="ghost">
                {t('common.backToCourse')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
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
        <Card>
          <div className="overflow-hidden rounded-lg border border-white/8 bg-slate-950/70">
            {activeModule ? (
              <video
                className="aspect-video w-full bg-slate-950 object-cover"
                controls
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                key={`${data.id}-${activeModule.id}`}
                onContextMenu={(event) => event.preventDefault()}
                onError={handleVideoError}
                onLoadedMetadata={handleVideoLoadedMetadata}
                onPlay={handleVideoPlay}
                preload="metadata"
                ref={videoElementRef}
                src={activeVideoSource || undefined}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-400">
                {t('player.chooseLesson')}
              </div>
            )}
          </div>

          {isVideoLoading ? (
            <p className="mt-3 text-sm text-cyan-200">{t('loader.courseDetails')}</p>
          ) : null}
          {videoErrorMessage ? (
            <p className="mt-3 text-sm text-rose-300">{videoErrorMessage}</p>
          ) : null}

          <div className="mt-5 border-t border-white/8 pt-5">
            <SectionHeader title={activeModuleTitle} />
            <MetaRow
              className="mt-3"
              items={[
                { key: 'moduleType', label: t('player.lessonType'), value: activeModuleType },
                { key: 'moduleDuration', icon: Clock3, label: t('player.runtime'), value: activeModuleDuration },
                { key: 'access', label: t('player.accessStatus'), value: t('player.purchasedAccess') },
              ]}
            />
            <p className="mt-4 text-sm leading-7 text-slate-300">{data.description}</p>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionHeader
              description={t('player.chooseLesson')}
              title={t('player.courseContent')}
            />

            <div className="mt-5 space-y-3">
              {data.modules.map((module, index) => {
                const active = module.id === activeModuleId

                return (
                  <button
                    key={module.id}
                    className={`w-full rounded-lg border px-4 py-4 text-left transition ${
                      active
                        ? 'border-cyan-300/28 bg-cyan-400/12'
                        : 'border-white/8 bg-[color:var(--surface-muted)] hover:border-white/14'
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
                      {active ? <PlayCircle className="h-5 w-5 shrink-0 text-cyan-200" /> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card>
            <SectionHeader title={t('courseDetail.instructor')} />
            <h3 className="mt-3 text-xl font-semibold text-white">{data.instructor.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{data.instructor.role}</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">{data.instructor.bio}</p>
          </Card>

          <Card>
            <SectionHeader title={t('player.outcomes')} />
            <div className="mt-4 space-y-3">
              {data.outcomes.slice(0, 3).map((outcome) => (
                <div key={outcome} className="rounded-lg border border-white/8 bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-slate-200">
                  {outcome}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <ListVideo className="h-4 w-4 text-slate-400" />
              <p className="text-sm text-slate-300">{data.modules.length} ders</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}

export default CoursePlayerPage
