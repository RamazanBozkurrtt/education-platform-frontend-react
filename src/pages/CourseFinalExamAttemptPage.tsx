import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Clock3, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  finalExamQueryKeys,
  useFinalExamAttempt,
  useSaveFinalExamAnswers,
  useSubmitFinalExamAttempt,
  useTerminateFinalExamAttempt,
} from '../hooks/useFinalExam'
import { API_ENDPOINTS } from '../services/endpoints'
import { finalExamService } from '../services/finalExamService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { ROUTES } from '../utils/constants'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import Modal from '../components/ui/Modal'
import SectionHeader from '../components/ui/SectionHeader'
import type { AttemptStatus, TerminateAttemptReason } from '../types/finalExam'

const formatTimeRemaining = (totalSeconds: number) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '00:00'
  }

  const normalized = Math.floor(totalSeconds)
  const hours = Math.floor(normalized / 3600)
  const minutes = Math.floor((normalized % 3600) / 60)
  const seconds = normalized % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const TERMINAL_ATTEMPT_STATUSES: AttemptStatus[] = ['SUBMITTED', 'EXPIRED', 'TERMINATED']
const BLOCKED_CONTROL_KEYS = new Set(['a', 'c', 'p', 's', 'u', 'v', 'x'])

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const tagName = target.tagName.toUpperCase()
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT'
}

const toAttemptStatusFromText = (value: unknown): AttemptStatus | null => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toUpperCase()
  if (normalized === 'IN_PROGRESS' || normalized === 'SUBMITTED' || normalized === 'EXPIRED' || normalized === 'TERMINATED') {
    return normalized
  }

  return null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readAttemptStatus = (value: unknown, depth = 0): AttemptStatus | null => {
  if (depth > 5 || value === null || typeof value === 'undefined') {
    return null
  }

  const directStatus = toAttemptStatusFromText(value)
  if (directStatus) {
    return directStatus
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nestedStatus = readAttemptStatus(item, depth + 1)
      if (nestedStatus) {
        return nestedStatus
      }
    }

    return null
  }

  if (!isRecord(value)) {
    return null
  }

  const statusKeys = ['attemptStatus', 'attempt_status', 'status']
  for (const key of statusKeys) {
    if (!(key in value)) {
      continue
    }

    const nestedStatus = readAttemptStatus(value[key], depth + 1)
    if (nestedStatus) {
      return nestedStatus
    }
  }

  const nestedContainers = ['data', 'attempt', 'error', 'errors', 'details', 'raw', 'response']
  for (const key of nestedContainers) {
    if (!(key in value)) {
      continue
    }

    const nestedStatus = readAttemptStatus(value[key], depth + 1)
    if (nestedStatus) {
      return nestedStatus
    }
  }

  return null
}

const CourseFinalExamAttemptPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { courseId = '', attemptId = '' } = useParams()
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, string | null>>({})
  const [lastSaveError, setLastSaveError] = useState<string | null>(null)
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [terminateError, setTerminateError] = useState<string | null>(null)
  const [timeRemainingText, setTimeRemainingText] = useState<string>('--:--')
  const [overviewReturnPending, setOverviewReturnPending] = useState(false)
  const [fullscreenRequired, setFullscreenRequired] = useState(false)
  const [fullscreenPromptOpen, setFullscreenPromptOpen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)

  const autosaveTimerRef = useRef<number | null>(null)
  const lastSavedSnapshotRef = useRef<string>('')
  const hasHydratedAnswersRef = useRef(false)
  const submitInProgressRef = useRef(false)
  const submitCompletedRef = useRef(false)
  const terminateInFlightRef = useRef(false)
  const attemptDataReadyRef = useRef(false)
  const routeLeavingIntentionallyRef = useRef(false)
  const statusRef = useRef<string>('UNKNOWN')
  const attemptNotFoundRecoveryInProgressRef = useRef(false)
  const last404RecoveryKeyRef = useRef<string>('')
  const lastInvalidatedTerminalStatusRef = useRef<AttemptStatus | null>(null)
  const lastLoggedRequestKeyRef = useRef<string>('')
  const lastLoggedErrorKeyRef = useRef<string>('')
  const intentionalFullscreenExitRef = useRef(false)

  const attemptQuery = useFinalExamAttempt(courseId, attemptId)
  const saveAnswersMutation = useSaveFinalExamAnswers(courseId, attemptId)
  const submitMutation = useSubmitFinalExamAttempt(courseId, attemptId)
  const terminateMutation = useTerminateFinalExamAttempt(courseId, attemptId)

  const attempt = attemptQuery.data
  const questions = attempt?.questions ?? []
  const activeQuestion = questions[activeQuestionIndex] ?? null
  const attemptErrorStatus = readAttemptStatus(attemptQuery.error)
  const terminalStatus = attempt?.status ?? attemptErrorStatus
  const getAttemptRequestUrl = API_ENDPOINTS.courses.finalExam.attempt(courseId, attemptId)

  useEffect(() => {
    const requestKey = `${courseId}:${attemptId}`
    if (lastLoggedRequestKeyRef.current === requestKey) {
      return
    }

    lastLoggedRequestKeyRef.current = requestKey
    console.log('[FinalExam] attempt page opened', {
      courseIdParam: courseId,
      attemptIdParam: attemptId,
      getAttemptUrl: getAttemptRequestUrl,
    })
  }, [attemptId, courseId, getAttemptRequestUrl])

  useEffect(() => {
    if (!attemptQuery.error) {
      lastLoggedErrorKeyRef.current = ''
      return
    }

    const appError = normalizeApiError(attemptQuery.error)
    const errorKey = `${courseId}:${attemptId}:${appError.httpStatus ?? 'unknown'}:${appError.message}`
    if (lastLoggedErrorKeyRef.current === errorKey) {
      return
    }

    lastLoggedErrorKeyRef.current = errorKey
    console.log('[FinalExam] attempt page getAttempt error', {
      courseIdParam: courseId,
      attemptIdParam: attemptId,
      url: getAttemptRequestUrl,
      success: false,
      status: appError.httpStatus ?? null,
      message: appError.message,
    })
  }, [attemptId, attemptQuery.error, courseId, getAttemptRequestUrl])

  const refreshOverview = useCallback(async () => {
    if (!courseId) {
      return
    }

    await queryClient.invalidateQueries({
      queryKey: finalExamQueryKeys.overview(courseId),
      refetchType: 'all',
    })
  }, [courseId, queryClient])

  const goToOverviewWithRefresh = useCallback(async () => {
    if (!courseId || overviewReturnPending) {
      return
    }

    routeLeavingIntentionallyRef.current = true
    setOverviewReturnPending(true)
    try {
      await refreshOverview()
      navigate(ROUTES.courseFinalExamOverview(courseId), { replace: true })
    } finally {
      setOverviewReturnPending(false)
    }
  }, [courseId, navigate, overviewReturnPending, refreshOverview])

  const canTerminate = useCallback(() => (
    Boolean(
      courseId &&
      attemptId &&
      attemptDataReadyRef.current &&
      statusRef.current === 'IN_PROGRESS' &&
      !submitInProgressRef.current &&
      !submitCompletedRef.current &&
      !terminateInFlightRef.current &&
      !routeLeavingIntentionallyRef.current,
    )
  ), [attemptId, courseId])

  const navigateToResult = useCallback((replace = true) => {
    routeLeavingIntentionallyRef.current = true
    navigate(ROUTES.courseFinalExamResult(courseId, attemptId), { replace })
  }, [attemptId, courseId, navigate])

  const requestExamFullscreen = useCallback(async () => {
    if (typeof document === 'undefined' || !document.documentElement.requestFullscreen) {
      setFullscreenRequired(false)
      setFullscreenPromptOpen(false)
      setFullscreenError(null)
      return true
    }

    if (document.fullscreenElement) {
      setFullscreenRequired(false)
      setFullscreenPromptOpen(false)
      setFullscreenError(null)
      return true
    }

    setFullscreenRequired(true)

    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' })
      setFullscreenRequired(false)
      setFullscreenPromptOpen(false)
      setFullscreenError(null)
      return true
    } catch {
      setFullscreenPromptOpen(true)
      setFullscreenError('Sınava devam etmek için tam ekran moduna geçmelisiniz.')
      return false
    }
  }, [])

  const terminateOnce = useCallback(async (reason: TerminateAttemptReason, withRedirect = true) => {
    if (!canTerminate()) {
      return
    }

    terminateInFlightRef.current = true
    setTerminateError(null)
    let terminateSucceeded = false

    try {
      console.log('[FinalExam] terminate requested', { reason, attemptId, courseId })
      await terminateMutation.mutateAsync({ reason })
      terminateSucceeded = true
      if (withRedirect) {
        navigateToResult(true)
      }
    } catch (error) {
      setTerminateError(`${reason}: ${normalizeApiError(error).message}`)
    } finally {
      if (!terminateSucceeded || !withRedirect) {
        terminateInFlightRef.current = false
      }
    }
  }, [canTerminate, navigateToResult, terminateMutation])

  useEffect(() => {
    if (!attempt) {
      attemptDataReadyRef.current = false
      return
    }

    console.log('[FinalExam] attempt page getAttempt response', {
      success: true,
      courseIdParam: courseId,
      routeAttemptId: attemptId,
      responseAttemptId: attempt.id,
      attemptStatus: attempt.status,
    })

    if (attempt.id !== attemptId) {
      console.warn('[FinalExam] attempt id mismatch', {
        routeAttemptId: attemptId,
        responseAttemptId: attempt.id,
      })
    }

    statusRef.current = attempt.status
    attemptDataReadyRef.current = attempt.status === 'IN_PROGRESS'
    if (attempt.status === 'SUBMITTED') {
      submitCompletedRef.current = true
      navigateToResult(false)
    }
  }, [attempt, attemptId, courseId, navigateToResult])

  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      setFullscreenRequired(false)
      setFullscreenPromptOpen(false)
      setFullscreenError(null)
      return
    }

    void requestExamFullscreen()
  }, [attempt, requestExamFullscreen])

  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return
    }

    const handleFullscreenChange = () => {
      const hasFullscreen = Boolean(document.fullscreenElement)
      setFullscreenRequired(!hasFullscreen)

      if (hasFullscreen) {
        setFullscreenPromptOpen(false)
        setFullscreenError(null)
        return
      }

      if (
        routeLeavingIntentionallyRef.current ||
        submitInProgressRef.current ||
        submitCompletedRef.current ||
        intentionalFullscreenExitRef.current
      ) {
        return
      }

      setFullscreenPromptOpen(false)
      void terminateOnce('fullscreen_exit')
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [attempt, terminateOnce])

  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return
    }

    document.documentElement.classList.add('exam-guard-active')
    document.body.classList.add('exam-guard-active')

    const preventDefault = (event: Event) => {
      event.preventDefault()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return
      }

      const key = event.key.toLowerCase()
      if ((event.ctrlKey || event.metaKey) && BLOCKED_CONTROL_KEYS.has(key)) {
        event.preventDefault()
        return
      }

      if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(key))) {
        event.preventDefault()
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void terminateOnce('visibility_hidden', false)
      }
    }

    const handlePageHide = () => {
      void terminateOnce('tab_close', false)
    }

    const handleBeforeUnload = () => {
      void terminateOnce('tab_close', false)
    }

    document.addEventListener('contextmenu', preventDefault)
    document.addEventListener('copy', preventDefault)
    document.addEventListener('cut', preventDefault)
    document.addEventListener('paste', preventDefault)
    document.addEventListener('selectstart', preventDefault)
    document.addEventListener('dragstart', preventDefault)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.documentElement.classList.remove('exam-guard-active')
      document.body.classList.remove('exam-guard-active')
      document.removeEventListener('contextmenu', preventDefault)
      document.removeEventListener('copy', preventDefault)
      document.removeEventListener('cut', preventDefault)
      document.removeEventListener('paste', preventDefault)
      document.removeEventListener('selectstart', preventDefault)
      document.removeEventListener('dragstart', preventDefault)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [attempt, terminateOnce])

  useEffect(() => {
    if (!attemptQuery.error) {
      attemptNotFoundRecoveryInProgressRef.current = false
      last404RecoveryKeyRef.current = ''
      return
    }

    attemptDataReadyRef.current = false
    statusRef.current = 'UNKNOWN'

    const appError = normalizeApiError(attemptQuery.error)
    if (appError.httpStatus !== 404) {
      return
    }

    const recoveryKey = `${courseId}:${attemptId}:${appError.message}`
    if (attemptNotFoundRecoveryInProgressRef.current || last404RecoveryKeyRef.current === recoveryKey) {
      return
    }

    attemptNotFoundRecoveryInProgressRef.current = true
    last404RecoveryKeyRef.current = recoveryKey

    void (async () => {
      try {
        const latestOverview = await queryClient.fetchQuery({
          queryKey: finalExamQueryKeys.overview(courseId),
          queryFn: () => finalExamService.getOverview(courseId),
        })
        const latestAttemptId = latestOverview.activeAttemptId
          ?? latestOverview.attempts.find((entry) => entry.status === 'IN_PROGRESS')?.attemptId
          ?? null

        if (latestAttemptId && latestAttemptId !== attemptId) {
          routeLeavingIntentionallyRef.current = true
          navigate(ROUTES.courseFinalExamAttempt(courseId, latestAttemptId), { replace: true })
          return
        }

        routeLeavingIntentionallyRef.current = true
        navigate(ROUTES.courseFinalExamOverview(courseId), { replace: true })
      } catch {
        routeLeavingIntentionallyRef.current = true
        navigate(ROUTES.courseFinalExamOverview(courseId), { replace: true })
      } finally {
        attemptNotFoundRecoveryInProgressRef.current = false
      }
    })()
  }, [attemptId, attemptQuery.error, courseId, navigate, queryClient, refreshOverview])

  useEffect(() => {
    if (!terminalStatus || !TERMINAL_ATTEMPT_STATUSES.includes(terminalStatus)) {
      lastInvalidatedTerminalStatusRef.current = null
      return
    }

    attemptDataReadyRef.current = false
    if (lastInvalidatedTerminalStatusRef.current === terminalStatus) {
      return
    }

    lastInvalidatedTerminalStatusRef.current = terminalStatus
    void refreshOverview()
  }, [refreshOverview, terminalStatus])

  useEffect(() => {
    if (!attempt || hasHydratedAnswersRef.current) {
      return
    }

    const seeded = attempt.questions.reduce<Record<string, string | null>>((accumulator, question) => {
      const existing = attempt.answers.find((item) => item.questionId === question.questionId)
      accumulator[question.questionId] = existing?.selectedOptionId ?? null
      return accumulator
    }, {})
    setAnswersByQuestionId(seeded)
    lastSavedSnapshotRef.current = JSON.stringify(seeded)
    hasHydratedAnswersRef.current = true
  }, [attempt])

  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return
    }

    const updateRemaining = () => {
      if (!attempt.expiresAt) {
        setTimeRemainingText('--:--')
        return
      }

      const expiresAtMs = Date.parse(attempt.expiresAt)
      if (!Number.isFinite(expiresAtMs)) {
        setTimeRemainingText('--:--')
        return
      }

      const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
      setTimeRemainingText(formatTimeRemaining(remainingSeconds))
    }

    updateRemaining()
    const intervalId = window.setInterval(updateRemaining, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [attempt])

  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS' || !hasHydratedAnswersRef.current) {
      return
    }

    if (submitInProgressRef.current || terminateInFlightRef.current) {
      return
    }

    const snapshot = JSON.stringify(answersByQuestionId)
    if (snapshot === lastSavedSnapshotRef.current) {
      return
    }

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current)
    }

    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        const answers = buildValidAnswerPayload()

        if (answers.length === 0) {
          setLastSaveError(null)
          return
        }

        await saveAnswersMutation.mutateAsync({ answers })
        lastSavedSnapshotRef.current = JSON.stringify(answersByQuestionId)
        setLastSaveError(null)
      } catch (error) {
        setLastSaveError(normalizeApiError(error).message)
      }
    }, 850)

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [answersByQuestionId, attempt, questions, saveAnswersMutation])

  const answeredCount = useMemo(
    () => questions.filter((question) => Boolean(answersByQuestionId[question.questionId])).length,
    [answersByQuestionId, questions],
  )

  function buildValidAnswerPayload() {
    const validOptionIdsByQuestion = questions.reduce<Record<string, Set<string>>>((accumulator, question) => {
      accumulator[question.questionId] = new Set(question.options.map((option) => option.id))
      return accumulator
    }, {})

    return Object.entries(answersByQuestionId)
      .filter(([questionId, selectedOptionId]) => {
        if (typeof selectedOptionId !== 'string' || selectedOptionId.trim().length === 0) {
          return false
        }

        const validOptions = validOptionIdsByQuestion[questionId]
        return Boolean(validOptions && validOptions.has(selectedOptionId))
      })
      .map(([questionId, selectedOptionId]) => ({
        questionId,
        selectedOptionId: selectedOptionId as string,
      }))
  }

  const handleAnswerChange = (questionId: string, optionId: string) => {
    setAnswersByQuestionId((current) => ({
      ...current,
      [questionId]: optionId,
    }))
  }

  const handleSubmit = async () => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return
    }

    if (fullscreenRequired) {
      setLastSaveError('Sınavı bitirmeden önce tam ekran moduna geri dönmelisiniz.')
      return
    }

    submitInProgressRef.current = true
    setSubmitModalOpen(false)

    try {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current)
      }

      const answers = buildValidAnswerPayload()

      if (answers.length > 0) {
        await saveAnswersMutation.mutateAsync({ answers })
      }

      await submitMutation.mutateAsync()
      submitCompletedRef.current = true
      statusRef.current = 'SUBMITTED'

      if (document.fullscreenElement) {
        intentionalFullscreenExitRef.current = true
        await document.exitFullscreen().catch(() => undefined)
      }

      navigateToResult(true)
    } catch (error) {
      setLastSaveError(normalizeApiError(error).message)
    } finally {
      submitInProgressRef.current = false
    }
  }

  const handleUserExit = () => {
    void terminateOnce('manual_exit')
  }

  if (attemptQuery.isLoading) {
    return <Loader label="Sınav oturumu hazırlanıyor..." />
  }

  if (terminalStatus === 'EXPIRED' || terminalStatus === 'TERMINATED') {
    const statusMessage = terminalStatus === 'EXPIRED'
      ? 'Sınav oturumunuzun süresi doldu.'
      : 'Sınav oturumunuz sonlandırılmış.'

    return (
      <Card>
        <SectionHeader title="Sınav oturumu kapandı" />
        <div className="mt-4 space-y-4">
          <div className="rounded-md border border-[color:var(--warning)]/40 bg-[color:var(--surface-soft-amber)] px-4 py-3 text-sm theme-text">
            {statusMessage}
          </div>
          <Button
            disabled={overviewReturnPending}
            onClick={() => {
              void goToOverviewWithRefresh()
            }}
            type="button"
            variant="secondary"
          >
            {overviewReturnPending ? 'Yönlendiriliyor...' : 'Sınav Bilgilendirme Sayfasına Dön'}
          </Button>
        </div>
      </Card>
    )
  }

  if (attemptQuery.error) {
    return (
      <Card>
        <SectionHeader title="Sınav oturumu yüklenemedi" />
        <div className="mt-4 space-y-4">
          <div className="rounded-md border border-[color:var(--danger)]/35 bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
            Sınav oturumu yüklenemedi.
          </div>
          <Button
            disabled={overviewReturnPending}
            onClick={() => {
              void goToOverviewWithRefresh()
            }}
            type="button"
            variant="secondary"
          >
            {overviewReturnPending ? 'Yönlendiriliyor...' : "Overview'a dön"}
          </Button>
        </div>
      </Card>
    )
  }

  if (!attempt) {
    return null
  }

  if (attempt.status !== 'IN_PROGRESS') {
    return null
  }

  return (
    <>
      {fullscreenPromptOpen || fullscreenRequired ? (
        <Card className="mb-4 border border-[color:var(--danger)]/35 bg-[color:var(--surface-soft-peach)]">
          <SectionHeader
            description="Tarayıcı politikaları nedeniyle bazı durumlarda tam ekranı manuel onaylamanız gerekir."
            title="Tam ekran zorunlu"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--danger)]">
            <p>{fullscreenError ?? 'Sınava devam etmek için tam ekran moduna geçin. Tam ekrandan çıkarsanız sınav başarısız sonlandırılır.'}</p>
            <Button
              onClick={() => {
                void requestExamFullscreen()
              }}
              type="button"
              variant="secondary"
            >
              Tam ekrana geç
            </Button>
          </div>
        </Card>
      ) : null}

      <div className={`space-y-6 ${fullscreenRequired ? 'pointer-events-none opacity-70' : ''}`} style={{ userSelect: 'none' }}>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <SectionHeader
              description="Bu sınav oturumu backend kontrolünde ilerler."
              title="Final sınavı oturumu"
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-sm theme-heading">
              <Clock3 className="h-4 w-4" />
              Kalan süre: {timeRemainingText}
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
              <p className="theme-subtle text-xs">Durum</p>
              <p className="theme-heading mt-1 text-sm font-semibold">{attempt.status}</p>
            </div>
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
              <p className="theme-subtle text-xs">Cevaplanan</p>
              <p className="theme-heading mt-1 text-sm font-semibold">{answeredCount} / {questions.length}</p>
            </div>
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
              <p className="theme-subtle text-xs">Kalan hak</p>
              <p className="theme-heading mt-1 text-sm font-semibold">{attempt.remainingAttempts ?? '-'}</p>
            </div>
          </div>

          {terminateError ? (
            <div className="mt-4 rounded-md border border-[color:var(--danger)]/35 bg-[color:var(--surface-soft-peach)] px-3 py-2 text-sm text-[color:var(--danger)]">
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              {terminateError}
            </div>
          ) : null}

          {lastSaveError ? (
            <div className="mt-4 rounded-md border border-[color:var(--warning)]/40 bg-[color:var(--surface-soft-amber)] px-3 py-2 text-sm theme-text">
              <Save className="mr-2 inline h-4 w-4" />
              Otomatik kayıt sorunu: {lastSaveError}
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm theme-muted">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              Cevaplarınız otomatik olarak kaydedilir.
            </div>
          )}
        </Card>

        <section className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <Card>
            <h3 className="theme-heading text-sm font-semibold">Soru navigasyonu</h3>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {questions.map((question, index) => {
                const isActive = index === activeQuestionIndex
                const answered = Boolean(answersByQuestionId[question.questionId])

                return (
                  <button
                    className={`h-10 rounded-md border text-sm font-semibold transition ${
                      isActive
                        ? 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] theme-heading'
                        : answered
                          ? 'border-[color:var(--success)]/40 bg-[color:var(--surface-soft-mint)] text-[color:var(--success)]'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-soft)] theme-muted hover:border-[color:var(--border-strong)]'
                    }`}
                    key={question.questionId}
                    onClick={() => setActiveQuestionIndex(index)}
                    type="button"
                  >
                    {index + 1}
                  </button>
                )
              })}
            </div>
          </Card>

          <Card>
            {activeQuestion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="theme-subtle text-xs uppercase tracking-[0.08em]">
                    Soru {activeQuestionIndex + 1} / {questions.length}
                  </p>
                  <p className="theme-subtle text-xs">Oturum: {attempt.id}</p>
                </div>

                <p className="theme-heading text-lg font-semibold leading-7">{activeQuestion.questionText}</p>

                {activeQuestion.imageUrl ? (
                  <img
                    alt="Soru görseli"
                    className="max-h-[260px] w-full rounded-md border border-[color:var(--border)] object-contain"
                    src={activeQuestion.imageUrl}
                  />
                ) : null}

                <div className="space-y-2">
                  {activeQuestion.options.map((option) => (
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 text-sm transition ${
                        answersByQuestionId[activeQuestion.questionId] === option.id
                          ? 'border-[color:var(--primary)] bg-[color:var(--surface-muted)]'
                          : 'border-[color:var(--border)] bg-[color:var(--surface-soft)] hover:border-[color:var(--border-strong)]'
                      }`}
                      key={option.id}
                    >
                      <input
                        checked={answersByQuestionId[activeQuestion.questionId] === option.id}
                        name={`question-${activeQuestion.questionId}`}
                        onChange={() => handleAnswerChange(activeQuestion.questionId, option.id)}
                        type="radio"
                      />
                      <span className="theme-text">{option.text}</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] pt-4">
                  <div className="flex gap-2">
                    <Button
                      disabled={activeQuestionIndex <= 0}
                      onClick={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))}
                      type="button"
                      variant="secondary"
                    >
                      Önceki
                    </Button>
                    <Button
                      disabled={activeQuestionIndex >= questions.length - 1}
                      onClick={() => setActiveQuestionIndex((current) => Math.min(questions.length - 1, current + 1))}
                      type="button"
                      variant="secondary"
                    >
                      Sonraki
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={terminateMutation.isPending || submitMutation.isPending}
                      onClick={handleUserExit}
                      type="button"
                      variant="ghost"
                    >
                      Sinavdan cik
                    </Button>
                    <Button
                      disabled={submitMutation.isPending || terminateMutation.isPending}
                      onClick={() => setSubmitModalOpen(true)}
                      type="button"
                    >
                      Sınavı bitir
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        </section>
      </div>

      <Modal
        description="Sınavı bitirdikten sonra cevaplarınızı değiştiremezsiniz."
        onClose={() => setSubmitModalOpen(false)}
        open={submitModalOpen}
        title="Sınavı bitirmek istediğinize emin misiniz?"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3 text-sm theme-text">
            Cevaplanan soru: {answeredCount} / {questions.length}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button onClick={() => setSubmitModalOpen(false)} type="button" variant="ghost">
              Vazgeç
            </Button>
            <Button
              disabled={submitMutation.isPending}
              onClick={() => {
                void handleSubmit()
              }}
              type="button"
              variant="secondary"
            >
              {submitMutation.isPending ? 'Gönderiliyor...' : 'Evet, sınavı bitir'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default CourseFinalExamAttemptPage
