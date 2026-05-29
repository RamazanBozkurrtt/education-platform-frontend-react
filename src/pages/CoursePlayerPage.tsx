import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ListVideo, PanelRightClose, PanelRightOpen, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import CourseVideoPlayer from '../components/player/CourseVideoPlayer'
import ResumePlaybackPrompt from '../components/player/ResumePlaybackPrompt'
import LessonSidebar from '../components/player/watch/LessonSidebar'
import WatchPageBackButton from '../components/player/watch/WatchPageBackButton'
import CourseProgressBar from '../components/progress/CourseProgressBar'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import ThemeToggle from '../components/ui/ThemeToggle'
import { useCart } from '../hooks/useCart'
import { useCourseLessonProgress, useCourseProgressSummary } from '../hooks/useCourseProgress'
import { useLanguage } from '../hooks/useLanguage'
import { useLibrary } from '../hooks/useLibrary'
import { useVideoProgressTracking } from '../hooks/useVideoProgressTracking'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { emitAppToast } from '../shared/notifications/appToast'
import { courseMediaService } from '../services/courseMediaService'
import { courseService } from '../services/courseService'
import { cn } from '../utils/helpers'
import { ROUTES } from '../utils/constants'
import type { LessonProgress } from '../utils/types'

const PLAYBACK_URL_REFRESH_BUFFER_MS = 3_000

type VideoLoadState = 'idle' | 'ready' | 'missing' | 'error'

const isMissingVideoError = (error: unknown) => {
  const appError = normalizeApiError(error)

  if (appError.kind === 'not_found' || appError.httpStatus === 404) {
    return true
  }

  const normalizedCode = appError.code?.trim().toUpperCase()

  if (!normalizedCode) {
    return false
  }

  return normalizedCode.includes('VIDEO') && (normalizedCode.includes('NOT') || normalizedCode.includes('MISSING'))
}

const CourseWatchPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const { slug = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedLessonId = searchParams.get('lessonId')?.trim() || null
  const { addCourse, isInCart } = useCart()
  const { isPurchased } = useLibrary()

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)
  const [activeVideoSource, setActiveVideoSource] = useState('')
  const [activeVideoExpiresAtMs, setActiveVideoExpiresAtMs] = useState<number | null>(null)
  const [isVideoLoading, setIsVideoLoading] = useState(false)
  const [videoErrorMessage, setVideoErrorMessage] = useState<string | null>(null)
  const [videoLoadState, setVideoLoadState] = useState<VideoLoadState>('idle')
  const [showLessonCompletedFeedback, setShowLessonCompletedFeedback] = useState(false)
  const [isLessonSidebarOpen, setIsLessonSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const playbackRequestIdRef = useRef(0)
  const videoElementRef = useRef<HTMLVideoElement | null>(null)
  const pendingResumeRef = useRef<{ currentTime: number; shouldResumePlayback: boolean } | null>(null)
  const failedRefreshSourceRef = useRef<string | null>(null)

  const { data, error, isLoading } = useQuery({
    queryKey: ['course-player', language, slug],
    queryFn: () => courseService.getCourseBySlug(slug, language),
  })

  const purchased = data ? isPurchased(data.id) : false
  const lessons = data?.modules ?? []

  const activeLesson = useMemo(() => {
    if (!data) {
      return undefined
    }

    if (activeLessonId) {
      return data.modules.find((module) => module.id === activeLessonId) ?? data.modules[0]
    }

    return data.modules[0]
  }, [activeLessonId, data])

  const activeCourseId = data?.id ?? null
  const resolvedActiveLessonId = activeLesson?.id ?? null

  const { data: courseLessonProgress = [] } = useCourseLessonProgress(purchased ? activeCourseId : null)
  const { data: courseProgressSummary } = useCourseProgressSummary(purchased ? activeCourseId : null)

  const lessonProgressByLessonId = useMemo(
    () => courseLessonProgress.reduce<Record<string, LessonProgress>>((accumulator, lessonProgress) => {
      if (!lessonProgress.lessonId) {
        return accumulator
      }

      accumulator[lessonProgress.lessonId] = lessonProgress
      return accumulator
    }, {}),
    [courseLessonProgress],
  )

  const {
    lessonProgress: activeLessonProgress,
    resumePromptOpen,
    resumePromptSecond,
    handleVideoEnded,
    handleVideoLoadedMetadata: handleTrackedVideoLoadedMetadata,
    handleVideoPause,
    handleVideoTimeUpdate,
    handleRestartFromPrompt,
    handleResumeFromPrompt,
  } = useVideoProgressTracking({
    courseId: purchased ? activeCourseId : null,
    lessonId: purchased ? resolvedActiveLessonId : null,
    enabled: Boolean(purchased && activeCourseId && resolvedActiveLessonId),
    language,
    videoRef: videoElementRef,
    onLessonCompleted: () => {
      setShowLessonCompletedFeedback(true)
    },
  })

  useEffect(() => {
    if (!data) {
      return
    }

    const lessonIds = new Set(data.modules.map((module) => module.id))
    const firstLessonId = data.modules[0]?.id ?? null
    const nextLessonId = requestedLessonId && lessonIds.has(requestedLessonId)
      ? requestedLessonId
      : firstLessonId

    setActiveLessonId((current) => (current === nextLessonId ? current : nextLessonId))

    if (!nextLessonId && requestedLessonId) {
      setSearchParams({}, { replace: true })
      return
    }

    if (nextLessonId && requestedLessonId !== nextLessonId) {
      setSearchParams({ lessonId: nextLessonId }, { replace: true })
    }
  }, [data, requestedLessonId, setSearchParams])

  useEffect(() => {
    if (!showLessonCompletedFeedback) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setShowLessonCompletedFeedback(false)
    }, 3_000)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [showLessonCompletedFeedback])

  useEffect(() => {
    setShowLessonCompletedFeedback(false)
  }, [resolvedActiveLessonId])

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileSidebarOpen])

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
      setActiveVideoSource('')
      setActiveVideoExpiresAtMs(null)
      failedRefreshSourceRef.current = null
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
      setVideoLoadState('ready')
      failedRefreshSourceRef.current = null
    } catch (loadError) {
      if (requestId !== playbackRequestIdRef.current) {
        return
      }

      setActiveVideoSource('')
      setActiveVideoExpiresAtMs(null)
      pendingResumeRef.current = null

      if (isMissingVideoError(loadError)) {
        setVideoLoadState('missing')
        setVideoErrorMessage(null)
      } else {
        setVideoLoadState('error')
        setVideoErrorMessage(normalizeApiError(loadError).message)
      }
    } finally {
      if (requestId === playbackRequestIdRef.current) {
        setIsVideoLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!purchased || !activeCourseId || !resolvedActiveLessonId) {
      setVideoErrorMessage(null)
      setIsVideoLoading(false)
      setActiveVideoSource('')
      setActiveVideoExpiresAtMs(null)
      setVideoLoadState('idle')
      pendingResumeRef.current = null
      failedRefreshSourceRef.current = null
      return
    }

    void loadPlaybackUrl({ courseId: activeCourseId, lessonId: resolvedActiveLessonId })
  }, [activeCourseId, loadPlaybackUrl, purchased, resolvedActiveLessonId])

  const handleVideoPlay = () => {
    if (!activeCourseId || !resolvedActiveLessonId || !activeVideoExpiresAtMs) {
      return
    }

    const isExpiredOrNearExpiry = Date.now() >= activeVideoExpiresAtMs - PLAYBACK_URL_REFRESH_BUFFER_MS

    if (!isExpiredOrNearExpiry) {
      return
    }

    void loadPlaybackUrl({
      courseId: activeCourseId,
      lessonId: resolvedActiveLessonId,
      preservePlaybackState: true,
    })
  }

  const handleVideoLoadedMetadata = () => {
    const pendingResume = pendingResumeRef.current
    const videoElement = videoElementRef.current

    if (pendingResume && videoElement) {
      const hasDuration = Number.isFinite(videoElement.duration) && videoElement.duration > 0

      if (hasDuration && pendingResume.currentTime > 0 && pendingResume.currentTime < videoElement.duration) {
        videoElement.currentTime = pendingResume.currentTime
      }

      pendingResumeRef.current = null

      if (pendingResume.shouldResumePlayback) {
        void videoElement.play().catch(() => undefined)
      }
    }

    handleTrackedVideoLoadedMetadata()
  }

  const handleVideoError = () => {
    if (!activeCourseId || !resolvedActiveLessonId || !purchased || !activeVideoSource) {
      return
    }

    const refreshKey = `${activeCourseId}:${resolvedActiveLessonId}:${activeVideoSource}`

    if (failedRefreshSourceRef.current === refreshKey) {
      return
    }

    failedRefreshSourceRef.current = refreshKey

    void loadPlaybackUrl({
      courseId: activeCourseId,
      lessonId: resolvedActiveLessonId,
      preservePlaybackState: true,
    })
  }

  const handleLessonSelect = (lessonId: string) => {
    setActiveLessonId(lessonId)
    setSearchParams({ lessonId })
    setIsMobileSidebarOpen(false)
  }

  const handleAddToCart = (courseId: string) => {
    addCourse(courseId)
    navigate(ROUTES.cart)
  }

  if (error) {
    return <QueryErrorState error={error} fullScreen />
  }

  if (isLoading || !data) {
    return <Loader fullScreen label={t('loader.courseDetails')} />
  }

  if (!purchased) {
    return (
      <div className="theme-app min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <WatchPageBackButton label={t('common.backToCourse')} to={ROUTES.courseDetail(data.slug)} />

          <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-6 py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-subtle)]">{t('player.eyebrow')}</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text-heading)]">{t('player.lockedTitle')}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--text-muted)]">{t('player.lockedDescription')}</p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {isInCart(data.id) ? (
                <Link to={ROUTES.cart}>
                  <Button asChild className="w-full justify-center sm:w-auto" variant="secondary">
                    {t('common.goToCart')}
                  </Button>
                </Link>
              ) : (
                <Button className="w-full justify-center sm:w-auto" onClick={() => handleAddToCart(data.id)} variant="secondary">
                  <ShoppingCart className="h-4 w-4" />
                  {t('common.addToCart')}
                </Button>
              )}
            </div>
          </section>
        </div>
      </div>
    )
  }

  const lessonEmptyMessage = lessons.length === 0
    ? (language === 'tr' ? 'Bu kurs icin henuz ders eklenmemis.' : 'No lessons have been added for this course yet.')
    : videoLoadState === 'missing' && activeLesson
      ? (language === 'tr' ? 'Bu derse henuz video eklenmemis.' : 'No video has been added to this lesson yet.')
      : t('player.chooseLesson')
  const isFinalExamUnlocked = Boolean(courseProgressSummary && courseProgressSummary.overallPercentage >= 100)
  const finalExamLockedMessage = language === 'tr'
    ? 'Final sinavini acmak icin tum dersleri bitirmen gerekiyor.'
    : 'You need to complete all lessons before opening the final exam.'
  const playerProgressPercentage = courseProgressSummary?.overallPercentage ?? activeLessonProgress?.watchedPercentage ?? 0
  const showPlayerProgress = Boolean(courseProgressSummary || activeLessonProgress)

  const handleFinalExamSelect = () => {
    if (!activeCourseId) {
      return
    }

    if (!isFinalExamUnlocked) {
      emitAppToast({
        tone: 'info',
        message: finalExamLockedMessage,
      })
      return
    }

    navigate(ROUTES.courseFinalExamOverview(activeCourseId))
  }

  return (
    <div className="theme-app relative min-h-screen overflow-hidden bg-[color:var(--bg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_35%),radial-gradient(circle_at_95%_8%,color-mix(in_srgb,var(--surface-soft)_92%,transparent),transparent_40%)]" />

      <div className="relative flex min-h-screen flex-col">
        <header className="border-b border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface-strong)_78%,transparent)] backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-[1740px] items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-6">
            <WatchPageBackButton label={t('common.backToCourse')} to={ROUTES.courseDetail(data.slug)} />

            <div className="flex items-center gap-2">
              <ThemeToggle compact />

              {showLessonCompletedFeedback ? (
                <span className="hidden rounded-full border border-[color:var(--success)]/30 bg-[color:var(--surface-sky-haze)] px-3 py-1 text-xs font-medium text-[color:var(--success)] sm:inline-flex">
                  {language === 'tr' ? 'Ders tamamlandi' : 'Lesson completed'}
                </span>
              ) : null}

              <button
                aria-label={language === 'tr' ? 'Ders listesini ac veya kapat' : 'Toggle lesson list'}
                className="hidden items-center gap-2 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-medium text-[color:var(--text-heading)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)] lg:inline-flex"
                onClick={() => setIsLessonSidebarOpen((current) => !current)}
                type="button"
              >
                {isLessonSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                <span>{language === 'tr' ? 'Dersler' : 'Lessons'}</span>
              </button>

              <button
                aria-label={language === 'tr' ? 'Ders listesini ac' : 'Open lesson list'}
                className="inline-flex items-center gap-2 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm font-medium text-[color:var(--text-heading)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)] lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
                type="button"
              >
                <ListVideo className="h-4 w-4" />
                <span>{language === 'tr' ? 'Dersler' : 'Lessons'}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 pb-3 pt-3 sm:px-4 lg:px-6">
          <div className="mx-auto flex h-full min-h-[calc(100vh-92px)] w-full max-w-[1740px] gap-3">
            <section className="min-w-0 flex-1">
              <div
                className={cn(
                  'flex h-full min-h-[460px] flex-col rounded-2xl border border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface-strong)_88%,transparent)] p-3 shadow-[0_22px_70px_rgba(4,12,21,0.20)] transition-[padding] sm:p-4 lg:p-5',
                  isLessonSidebarOpen ? 'xl:pr-4' : 'xl:pr-5',
                )}
              >
                <div className="mb-4 flex flex-col gap-3 border-b border-[color:var(--border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-subtle)]">
                      {language === 'tr' ? 'Kurs' : 'Course'}
                    </p>
                    <h1 className="mt-1 truncate text-base font-semibold text-[color:var(--text-heading)] sm:text-lg">
                      {data.title}
                    </h1>
                  </div>

                  {showPlayerProgress ? (
                    <div className="w-full sm:max-w-sm">
                      <CourseProgressBar
                        compact
                        completedLessons={courseProgressSummary?.completedLessons}
                        language={language}
                        percentage={playerProgressPercentage}
                        totalLessons={courseProgressSummary?.totalLessons}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="min-h-0 flex-1">
                  <CourseVideoPlayer
                    emptyMessage={lessonEmptyMessage}
                    isSourceLoading={isVideoLoading}
                    onVideoEnded={handleVideoEnded}
                    onVideoError={handleVideoError}
                    onVideoLoadedMetadata={handleVideoLoadedMetadata}
                    onVideoPause={handleVideoPause}
                    onVideoPlay={handleVideoPlay}
                    onVideoTimeUpdate={handleVideoTimeUpdate}
                    sourceErrorMessage={videoLoadState === 'error' ? videoErrorMessage : null}
                    src={activeVideoSource || undefined}
                    title={activeLesson?.title || data.title}
                    videoKey={activeLesson ? `${data.id}-${activeLesson.id}` : `${data.id}-empty`}
                    videoRef={videoElementRef}
                  />
                </div>
              </div>
            </section>

            <LessonSidebar
              activeLessonId={resolvedActiveLessonId}
              courseProgressSummary={courseProgressSummary}
              courseTitle={data.title}
              isDesktopOpen={isLessonSidebarOpen}
              isMobileOpen={isMobileSidebarOpen}
              language={language}
              lessonProgressByLessonId={lessonProgressByLessonId}
              lessons={lessons}
              finalExamHint={language === 'tr'
                ? (isFinalExamUnlocked ? 'Final sinavi baslatabilirsin.' : 'Final sinavi acmak icin tum dersleri tamamla.')
                : (isFinalExamUnlocked ? 'You can start the final exam now.' : 'Complete all lessons to unlock the final exam.')}
              finalExamLabel={language === 'tr' ? 'Final sinavi' : 'Final exam'}
              isFinalExamLocked={!isFinalExamUnlocked}
              onLessonSelect={handleLessonSelect}
              onFinalExamSelect={handleFinalExamSelect}
              onMobileClose={() => setIsMobileSidebarOpen(false)}
              showFinalExamEntry
            />
          </div>
        </main>
      </div>

      <ResumePlaybackPrompt
        language={language}
        lastWatchedSecond={resumePromptSecond}
        onRestart={handleRestartFromPrompt}
        onResume={handleResumeFromPrompt}
        open={resumePromptOpen}
      />
    </div>
  )
}

export default CourseWatchPage
