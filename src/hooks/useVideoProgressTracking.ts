import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { emitAppToast } from '../shared/notifications/appToast'
import { useLessonProgress, useUpdateLessonProgress } from './useCourseProgress'
import {
  LESSON_COMPLETION_THRESHOLD_PERCENT,
  RESUME_PROMPT_MIN_SECONDS,
  PROGRESS_SYNC_INTERVAL_SECONDS,
} from '../utils/constants'
import type { AppLanguage } from '../utils/types'

interface UseVideoProgressTrackingOptions {
  courseId?: string | null
  lessonId?: string | null
  enabled: boolean
  language: AppLanguage
  videoRef: MutableRefObject<HTMLVideoElement | null>
  onLessonCompleted?: () => void
}

const toWholeSecond = (value: number) => Math.max(0, Math.floor(value))
const toCompletionThresholdSecond = (durationSecond: number) =>
  Math.max(1, Math.floor((durationSecond * LESSON_COMPLETION_THRESHOLD_PERCENT) / 100))

export const useVideoProgressTracking = ({
  courseId,
  enabled,
  language,
  lessonId,
  onLessonCompleted,
  videoRef,
}: UseVideoProgressTrackingOptions) => {
  const { data: lessonProgress, isLoading: isLessonProgressLoading } = useLessonProgress(courseId, lessonId)
  const updateProgressMutation = useUpdateLessonProgress(courseId, lessonId)

  const [resumePromptOpen, setResumePromptOpen] = useState(false)
  const [metadataReady, setMetadataReady] = useState(false)

  const lastSyncedSecondRef = useRef<number>(-1)
  const highestKnownSecondRef = useRef<number>(0)
  const lastIntervalSyncAtRef = useRef<number>(0)
  const hasPromptDecisionRef = useRef(false)
  const completionAcknowledgedRef = useRef(false)
  const inFlightSyncRef = useRef(false)
  const queuedSyncSecondRef = useRef<number | null>(null)
  const queuedSyncDurationRef = useRef<number | null>(null)
  const lastErrorToastAtRef = useRef(0)

  useEffect(() => {
    setResumePromptOpen(false)
    setMetadataReady(false)
    lastSyncedSecondRef.current = -1
    highestKnownSecondRef.current = 0
    lastIntervalSyncAtRef.current = 0
    hasPromptDecisionRef.current = false
    completionAcknowledgedRef.current = false
    inFlightSyncRef.current = false
    queuedSyncSecondRef.current = null
    queuedSyncDurationRef.current = null
  }, [courseId, lessonId])

  useEffect(() => {
    if (!lessonProgress) {
      return
    }

    highestKnownSecondRef.current = Math.max(highestKnownSecondRef.current, toWholeSecond(lessonProgress.lastWatchedSecond))

    if (lessonProgress.completed) {
      completionAcknowledgedRef.current = true
    }
  }, [lessonProgress])

  const shouldOfferResumePrompt = useMemo(() => {
    if (!lessonProgress) {
      return false
    }

    if (lessonProgress.completed) {
      return false
    }

    return lessonProgress.lastWatchedSecond >= RESUME_PROMPT_MIN_SECONDS
  }, [lessonProgress])

  const maybeNotifySyncFailure = useCallback((error: unknown) => {
    const appError = normalizeApiError(error)

    if (appError.httpStatus === 401 || appError.httpStatus === 403) {
      return
    }

    const now = Date.now()

    if (now - lastErrorToastAtRef.current < 30_000) {
      return
    }

    lastErrorToastAtRef.current = now
    emitAppToast({
      tone: 'info',
      message: language === 'tr'
        ? 'Ilerleme kaydi gecici olarak guncellenemedi. Izlemeye devam edebilirsin.'
        : 'Progress could not be synced right now. You can keep watching.',
    })
  }, [language])

  const syncProgress = useCallback(async (currentSecond: number, durationSecond: number) => {
    if (!enabled || !courseId || !lessonId) {
      return
    }

    const safeCurrentSecond = toWholeSecond(currentSecond)
    const safeDurationSecond = toWholeSecond(durationSecond)

    if (safeDurationSecond <= 0) {
      return
    }

    if (safeCurrentSecond <= highestKnownSecondRef.current) {
      return
    }

    if (safeCurrentSecond === lastSyncedSecondRef.current) {
      return
    }

    if (inFlightSyncRef.current) {
      queuedSyncSecondRef.current = safeCurrentSecond
      queuedSyncDurationRef.current = safeDurationSecond
      return
    }

    inFlightSyncRef.current = true

    try {
      const nextProgress = await updateProgressMutation.mutateAsync({
        lastWatchedSecond: safeCurrentSecond,
        videoDurationSecond: safeDurationSecond,
      })

      const authoritativeSecond = toWholeSecond(nextProgress.lastWatchedSecond)
      lastSyncedSecondRef.current = authoritativeSecond
      highestKnownSecondRef.current = Math.max(highestKnownSecondRef.current, authoritativeSecond)

      if (nextProgress.completed && !completionAcknowledgedRef.current) {
        completionAcknowledgedRef.current = true
        onLessonCompleted?.()
      }
    } catch (error) {
      maybeNotifySyncFailure(error)
    } finally {
      inFlightSyncRef.current = false

      const queuedSecond = queuedSyncSecondRef.current
      const queuedDuration = queuedSyncDurationRef.current
      queuedSyncSecondRef.current = null
      queuedSyncDurationRef.current = null

      if (typeof queuedSecond === 'number' && typeof queuedDuration === 'number') {
        void syncProgress(queuedSecond, queuedDuration)
      }
    }
  }, [courseId, enabled, lessonId, maybeNotifySyncFailure, onLessonCompleted, updateProgressMutation])

  const syncFromVideoElement = useCallback((force = false) => {
    if (!enabled || !videoRef.current) {
      return
    }

    const videoElement = videoRef.current
    const currentSecond = toWholeSecond(videoElement.currentTime)
    const durationSecond = toWholeSecond(videoElement.duration)

    if (durationSecond <= 0) {
      return
    }

    const completionThresholdSecond = toCompletionThresholdSecond(durationSecond)
    const shouldForceCompletionSync = !completionAcknowledgedRef.current && currentSecond >= completionThresholdSecond

    if (!force) {
      const now = Date.now()

      // If completion threshold is reached, sync immediately instead of waiting for interval.
      if (!shouldForceCompletionSync && now - lastIntervalSyncAtRef.current < PROGRESS_SYNC_INTERVAL_SECONDS * 1_000) {
        return
      }

      lastIntervalSyncAtRef.current = now
    }

    const targetSecond = shouldForceCompletionSync ? durationSecond : currentSecond
    void syncProgress(targetSecond, durationSecond)
  }, [enabled, syncProgress, videoRef])

  const handleVideoLoadedMetadata = useCallback(() => {
    setMetadataReady(true)
  }, [])

  const handleResumeFromPrompt = useCallback(() => {
    const videoElement = videoRef.current

    if (!videoElement || !lessonProgress) {
      setResumePromptOpen(false)
      hasPromptDecisionRef.current = true
      return
    }

    const targetSecond = Math.min(
      Math.max(0, toWholeSecond(lessonProgress.lastWatchedSecond)),
      Math.max(0, toWholeSecond(videoElement.duration) - 1),
    )

    videoElement.currentTime = targetSecond
    setResumePromptOpen(false)
    hasPromptDecisionRef.current = true
  }, [lessonProgress, videoRef])

  const handleRestartFromPrompt = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }

    setResumePromptOpen(false)
    hasPromptDecisionRef.current = true
  }, [videoRef])

  const handleVideoTimeUpdate = useCallback(() => {
    if (!metadataReady || resumePromptOpen) {
      return
    }

    syncFromVideoElement(false)
  }, [metadataReady, resumePromptOpen, syncFromVideoElement])

  const handleVideoPause = useCallback(() => {
    if (!metadataReady) {
      return
    }

    syncFromVideoElement(true)
  }, [metadataReady, syncFromVideoElement])

  const handleVideoEnded = useCallback(() => {
    if (!metadataReady) {
      return
    }

    syncFromVideoElement(true)
  }, [metadataReady, syncFromVideoElement])

  useEffect(() => {
    if (!metadataReady || !enabled || hasPromptDecisionRef.current) {
      return
    }

    if (isLessonProgressLoading) {
      return
    }

    if (shouldOfferResumePrompt) {
      setResumePromptOpen(true)
      return
    }

    hasPromptDecisionRef.current = true
  }, [enabled, isLessonProgressLoading, metadataReady, shouldOfferResumePrompt])

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const handlePageHide = () => {
      syncFromVideoElement(true)
    }

    window.addEventListener('pagehide', handlePageHide)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      syncFromVideoElement(true)
    }
  }, [enabled, syncFromVideoElement])

  return {
    lessonProgress,
    isLessonProgressLoading,
    resumePromptOpen,
    resumePromptSecond: lessonProgress?.lastWatchedSecond ?? 0,
    handleVideoLoadedMetadata,
    handleVideoTimeUpdate,
    handleVideoPause,
    handleVideoEnded,
    handleResumeFromPrompt,
    handleRestartFromPrompt,
  }
}
