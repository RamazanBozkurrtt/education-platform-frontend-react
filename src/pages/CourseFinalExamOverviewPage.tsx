import { AlertTriangle, CheckCircle2, Clock3, ShieldAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFinalExamOverview, useStartFinalExamAttempt } from '../hooks/useFinalExam'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { ROUTES } from '../utils/constants'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import SectionHeader from '../components/ui/SectionHeader'

const ACTIVE_ATTEMPT_ID_KEYS = [
  'activeAttemptId',
  'active_attempt_id',
  'currentAttemptId',
  'current_attempt_id',
  'ongoingAttemptId',
  'ongoing_attempt_id',
  'inProgressAttemptId',
  'in_progress_attempt_id',
  'attemptId',
  'attempt_id',
] as const

const ACTIVE_ATTEMPT_CONTAINER_KEYS = [
  'activeAttempt',
  'active_attempt',
  'currentAttempt',
  'current_attempt',
  'ongoingAttempt',
  'ongoing_attempt',
  'inProgressAttempt',
  'in_progress_attempt',
  'attempt',
  'details',
  'error',
  'errors',
  'response',
  'data',
  'result',
  'payload',
] as const

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toCandidateAttemptId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed || trimmed === '0' || trimmed === '-1') {
    return null
  }

  return trimmed
}

const findAttemptId = (value: unknown, depth = 0): string | null => {
  if (depth > 5 || !isRecord(value)) {
    return null
  }

  for (const key of ACTIVE_ATTEMPT_ID_KEYS) {
    const candidate = toCandidateAttemptId(value[key])
    if (candidate) {
      return candidate
    }
  }

  for (const key of ACTIVE_ATTEMPT_CONTAINER_KEYS) {
    if (!(key in value)) {
      continue
    }

    const candidate = findAttemptId(value[key], depth + 1)
    if (candidate) {
      return candidate
    }
  }

  return null
}

const hasActiveAttemptConflict = (message: string, status?: number) =>
  Boolean(
    status && [400, 409, 422].includes(status) &&
    /active|ongoing|already|mevcut|devam/i.test(message),
  )

const CourseFinalExamOverviewPage = () => {
  const navigate = useNavigate()
  const { courseId = '' } = useParams()
  const [acceptedRules, setAcceptedRules] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const startInFlightRef = useRef(false)
  const overviewQuery = useFinalExamOverview(courseId)
  const startAttemptMutation = useStartFinalExamAttempt(courseId)

  if (overviewQuery.isLoading) {
    return <Loader label="Final sinav bilgileri yukleniyor..." />
  }

  if (overviewQuery.error) {
    return <QueryErrorState error={overviewQuery.error} />
  }

  const overview = overviewQuery.data
  if (!overview) {
    return null
  }

  const exam = overview.exam
  const hasExam = Boolean(exam)
  const examQuestionCount = exam?.questionCount ?? 0
  const examPassingScore = exam?.passingScore ?? 0
  const examDurationMinutes = exam?.durationMinutes ?? 0
  const alreadyPassed = overview.alreadyPassed || overview.certificateEligible
  const inferredActiveAttemptId = overview.attempts.find((attempt) => attempt.status === 'IN_PROGRESS')?.attemptId ?? null
  const effectiveActiveAttemptId = overview.activeAttemptId ?? inferredActiveAttemptId
  const hasActiveAttempt = overview.hasActiveAttempt === true
  const canStartExam = Boolean(overview.canStartExam) && !hasActiveAttempt && !effectiveActiveAttemptId && !alreadyPassed
  const hasActiveAttemptWithId = hasActiveAttempt && Boolean(effectiveActiveAttemptId)
  const shouldShowContinueAttempt = hasActiveAttemptWithId && !overviewQuery.isFetching
  const shouldShowVideoProgress = overview.completedVideos !== null && overview.totalVideos !== null
  const shouldShowStartReason = !canStartExam && !hasActiveAttemptWithId

  const handleStart = async () => {
    if (startInFlightRef.current || startAttemptMutation.isPending) {
      return
    }

    if (!acceptedRules) {
      setStartError('Sinav kurallarini okuyup onaylamalisiniz.')
      return
    }

    startInFlightRef.current = true
    setStartError(null)

    try {
      const latestOverviewResult = await overviewQuery.refetch()
      const latestOverview = latestOverviewResult.data ?? overview
      const latestInferredActiveAttemptId = latestOverview.attempts.find((attempt) => attempt.status === 'IN_PROGRESS')?.attemptId ?? null
      const latestActiveAttemptId = latestOverview.activeAttemptId ?? latestInferredActiveAttemptId
      const latestHasActiveAttempt = latestOverview.hasActiveAttempt === true

      if (latestHasActiveAttempt) {
        if (latestActiveAttemptId) {
          navigate(ROUTES.courseFinalExamAttempt(courseId, latestActiveAttemptId))
          return
        }

        setStartError('Aktif bir sınav oturumu görünüyor ancak oturum kimliği alınamadı. Lütfen sayfayı yenileyip tekrar deneyin.')
        return
      }

      const latestAlreadyPassed = latestOverview.alreadyPassed || latestOverview.certificateEligible
      const latestCanStartExam = Boolean(latestOverview.canStartExam) && !latestActiveAttemptId && !latestAlreadyPassed
      if (!latestCanStartExam) {
        setStartError(latestOverview.canStartReason ?? 'Sinava su anda baslanamiyor.')
        return
      }

      const response = await startAttemptMutation.mutateAsync({ acceptedRules: true })
      const nextAttemptId = response.attemptId || latestActiveAttemptId || effectiveActiveAttemptId
      if (!nextAttemptId) {
        throw new Error('Sinav oturumu baslatilamadi.')
      }

      const attemptRoute = ROUTES.courseFinalExamAttempt(courseId, nextAttemptId)
      console.log('[FinalExam] startAttempt response', {
        attemptId: nextAttemptId,
        attemptStatus: response.attemptStatus,
        courseId: response.courseId ?? courseId,
        remainingAttempts: response.remainingAttempts ?? null,
      })
      console.log('[FinalExam] navigate to attempt', { route: attemptRoute })
      navigate(attemptRoute)
    } catch (error) {
      const normalizedError = normalizeApiError(error)
      const conflictAttemptId = findAttemptId(normalizedError.raw) ?? findAttemptId(error) ?? effectiveActiveAttemptId

      if (conflictAttemptId && hasActiveAttemptConflict(normalizedError.message, normalizedError.httpStatus)) {
        navigate(ROUTES.courseFinalExamAttempt(courseId, conflictAttemptId))
        return
      }

      setStartError(normalizedError.message)
    } finally {
      startInFlightRef.current = false
    }
  }

  return (
    <div className="space-y-7">
      <Card>
        <SectionHeader
          description="Sinava baslamadan once tum kurallari okuyup onaylayin."
          title="Kurs final sinavi"
        />

        {!hasExam ? (
          <div className="mt-4 rounded-md border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-soft)] px-4 py-5 text-sm theme-muted">
            Bu kurs icin final sinavi henuz tanimlanmamis.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
              <p className="theme-subtle text-xs">Toplam soru</p>
              <p className="theme-heading mt-1 text-base font-semibold">{examQuestionCount}</p>
            </div>
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
              <p className="theme-subtle text-xs">Gecme puani</p>
              <p className="theme-heading mt-1 text-base font-semibold">{examPassingScore}</p>
            </div>
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
              <p className="theme-subtle text-xs">Sure</p>
              <p className="theme-heading mt-1 text-base font-semibold">{examDurationMinutes} dakika</p>
            </div>
            <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
              <p className="theme-subtle text-xs">Kalan hak</p>
              <p className="theme-heading mt-1 text-base font-semibold">{overview.remainingAttempts}</p>
            </div>
          </div>
        )}

        {overview.certificateEligible ? (
          <div className="mt-4 rounded-md border border-[color:var(--success)]/40 bg-[color:var(--surface-soft-mint)] px-4 py-3 text-sm text-[color:var(--success)]">
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            Sertifika almaya hak kazandiniz.
          </div>
        ) : null}

        {shouldShowContinueAttempt ? (
          <div className="mt-4 rounded-md border border-[color:var(--warning)]/40 bg-[color:var(--surface-soft-amber)] px-4 py-3 text-sm theme-text">
            Devam eden sınav oturumunuz var. Mevcut oturuma devam edin.
            <div className="mt-1 text-xs theme-muted">
              Yeni sinav baslatamazsiniz, mevcut oturuma devam edebilirsiniz.
            </div>
            <div className="mt-3">
              <Link to={ROUTES.courseFinalExamAttempt(courseId, effectiveActiveAttemptId ?? '')}>
                <Button asChild variant="secondary">
                  Oturuma Devam Et
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        {hasActiveAttempt && !hasActiveAttemptWithId ? (
          <div className="mt-4 rounded-md border border-[color:var(--warning)]/40 bg-[color:var(--surface-soft-amber)] px-4 py-3 text-sm theme-text">
            Aktif deneme tespit edildi ancak oturum kimligi bulunamadi.
            <div className="mt-1 text-xs theme-muted">
              Denemeyi yeniden tespit etmek icin asagidaki butonu kullanin.
            </div>
            <div className="mt-3">
              <Button
                disabled={startAttemptMutation.isPending}
                onClick={() => {
                  void handleStart()
                }}
                type="button"
                variant="secondary"
              >
                {startAttemptMutation.isPending ? 'Oturum aranıyor...' : 'Mevcut oturumu bul'}
              </Button>
            </div>
          </div>
        ) : null}

        {(overview.courseCompleted !== null
          || overview.completionPercentage !== null
          || shouldShowVideoProgress
          || overview.remainingAttempts !== null
          || overview.hasActiveAttempt !== null) ? (
          <div className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm theme-text">
            {overview.courseCompleted !== null ? (
              <p>Kurs tamamlama durumu: {overview.courseCompleted ? 'Tamamlandi' : 'Tamamlanmadi'}</p>
            ) : null}
            {overview.courseCompleted === false ? (
              <p className="mt-1 text-[color:var(--warning-700)]">Final sınavına başlayabilmek için kurs videolarını tamamlamalısınız.</p>
            ) : null}
            {shouldShowVideoProgress ? (
              <p className="mt-1">Tamamlanan video: {overview.completedVideos} / {overview.totalVideos}</p>
            ) : null}
            {overview.completionPercentage !== null ? (
              <p className="mt-1">Tamamlanma yuzdesi: %{overview.completionPercentage}</p>
            ) : null}
            {overview.remainingAttempts !== null ? (
              <p className="mt-1">Kalan hak: {overview.remainingAttempts}</p>
            ) : null}
            {overview.hasActiveAttempt !== null ? (
              <p className="mt-1">Aktif deneme var: {hasActiveAttempt ? 'Evet' : 'Hayir'}</p>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card>
        <SectionHeader
          description="Bu uyarilar caydiricilik amaclidir. Nihai degerlendirme backend tarafindan yapilir."
          title="Sinav kurallari"
        />

        <ul className="mt-4 space-y-2 text-sm theme-text">
          <li className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">Sinav basladiktan sonra sinav ekranindan cikmak sinav hakkinizi bitirebilir.</li>
          <li className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">Fullscreen modundan cikmak sinavin sonlandirilmasina neden olabilir.</li>
          <li className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">Sag tik, kopyalama ve metin secimi sinav boyunca kapalidir.</li>
          <li className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">Sinav icin en fazla 3 gunluk erisim suresi vardir.</li>
          <li className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">Maksimum 3 giris hakki vardir.</li>
          <li className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">Sinavi bitirdikten sonra cevaplar degistirilemez.</li>
        </ul>

        <div className="mt-4 space-y-3 border-t border-[color:var(--border)] pt-4">
          <label className="flex items-start gap-2 text-sm">
            <input
              checked={acceptedRules}
              onChange={(event) => setAcceptedRules(event.target.checked)}
              type="checkbox"
            />
            <span className="theme-text">Kurallari okudum ve kabul ediyorum.</span>
          </label>

          {shouldShowStartReason ? (
            <div className="rounded-md border border-[color:var(--warning)]/40 bg-[color:var(--surface-soft-amber)] px-3 py-2 text-sm theme-text">
              <ShieldAlert className="mr-2 inline h-4 w-4" />
              {overview.canStartReason ?? 'Sinava su anda baslanamiyor.'}
            </div>
          ) : null}

          {alreadyPassed ? (
            <div className="rounded-md border border-[color:var(--success)]/40 bg-[color:var(--surface-soft-mint)] px-3 py-2 text-sm text-[color:var(--success)]">
              Bu sinavi daha once basariyla tamamladiniz.
            </div>
          ) : null}

          {overview.remainingAttempts <= 0 ? (
            <div className="rounded-md border border-[color:var(--danger)]/35 bg-[color:var(--surface-soft-peach)] px-3 py-2 text-sm text-[color:var(--danger)]">
              <AlertTriangle className="mr-2 inline h-4 w-4" />
              Sinav hakkiniz kalmadi.
            </div>
          ) : null}

          {startError ? (
            <div className="rounded-md border border-[color:var(--danger)]/35 bg-[color:var(--surface-soft-peach)] px-3 py-2 text-sm text-[color:var(--danger)]">
              {startError}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="theme-subtle text-xs">
              Maks hak: {overview.maxAttempts ?? '-'} | Kalan hak: {overview.remainingAttempts} | Sure penceresi: {overview.attemptWindowDays ?? '-'} gun
            </p>
            <Button
              disabled={!canStartExam || startAttemptMutation.isPending}
              onClick={() => {
                void handleStart()
              }}
              type="button"
            >
              {startAttemptMutation.isPending ? 'Sinav baslatiliyor...' : 'Sinava basla'}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Onceki denemeler" />
        {overview.attempts.length === 0 ? (
          <p className="theme-muted mt-3 text-sm">Henuz bir deneme bulunmuyor.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {overview.attempts.map((attempt) => (
              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3" key={attempt.attemptId}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="theme-heading font-medium">Deneme #{attempt.attemptId}</p>
                  <p className="theme-subtle">{attempt.status} / {attempt.resultStatus}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs theme-muted">
                  <span><Clock3 className="mr-1 inline h-3.5 w-3.5" />Baslangic: {attempt.startedAt ?? '-'}</span>
                  <span>Skor: {attempt.score ?? '-'}</span>
                  <span>Kalan hak: {attempt.remainingAttempts ?? '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default CourseFinalExamOverviewPage
