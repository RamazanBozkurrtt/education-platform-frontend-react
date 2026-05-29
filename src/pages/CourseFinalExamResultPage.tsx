import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useFinalExamAttempt, useFinalExamManage, useFinalExamOverview } from '../hooks/useFinalExam'
import type { AttemptStatus, ResultStatus } from '../types/finalExam'
import { ROUTES } from '../utils/constants'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import SectionHeader from '../components/ui/SectionHeader'

const toAttemptStatusLabel = (status: AttemptStatus, resultStatus: ResultStatus) => {
  if (status === 'SUBMITTED') {
    return resultStatus === 'NONE' ? 'Degerlendirme bekleniyor' : 'Tamamlandi'
  }

  if (status === 'EXPIRED') {
    return 'Suresi doldu'
  }

  if (status === 'TERMINATED') {
    return 'Kural nedeniyle sonlandirildi'
  }

  return 'Devam ediyor'
}

const toResultStatusLabel = (resultStatus: ResultStatus) => {
  if (resultStatus === 'PASSED') {
    return 'Basarili'
  }

  if (resultStatus === 'FAILED') {
    return 'Basarisiz'
  }

  return 'Hesaplaniyor'
}

const CourseFinalExamResultPage = () => {
  const { courseId = '', attemptId = '' } = useParams()
  const attemptQuery = useFinalExamAttempt(courseId, attemptId)
  const overviewQuery = useFinalExamOverview(courseId)
  const manageQuery = useFinalExamManage(courseId)

  if (attemptQuery.isLoading) {
    return <Loader label="Sinav sonucu yukleniyor..." />
  }

  if (attemptQuery.error) {
    return <QueryErrorState error={attemptQuery.error} />
  }

  const attempt = attemptQuery.data
  if (!attempt) {
    return null
  }

  const matchingAttemptSummary = overviewQuery.data?.attempts.find((entry) => entry.attemptId === attempt.id) ?? null
  const effectiveResultStatus = attempt.resultStatus !== 'NONE'
    ? attempt.resultStatus
    : (matchingAttemptSummary?.resultStatus ?? 'NONE')
  const score = attempt.score ?? matchingAttemptSummary?.score ?? null
  const passingScore = attempt.passingScore ?? overviewQuery.data?.exam?.passingScore ?? manageQuery.data?.exam?.passingScore ?? null
  const remainingAttempts = attempt.remainingAttempts ?? matchingAttemptSummary?.remainingAttempts ?? overviewQuery.data?.remainingAttempts ?? null
  const certificateEligible = attempt.certificateEligibility.eligible || effectiveResultStatus === 'PASSED'
  const attemptStatusLabel = toAttemptStatusLabel(attempt.status, effectiveResultStatus)
  const resultStatusLabel = toResultStatusLabel(effectiveResultStatus)

  const renderStatusMessage = () => {
    if (attempt.status === 'TERMINATED') {
      return 'Sinav oturumu kural ihlali nedeniyle sonlandirildi.'
    }

    if (attempt.status === 'EXPIRED') {
      return 'Sinav suresi doldu.'
    }

    if (effectiveResultStatus === 'PASSED') {
      return 'Tebrikler, sinavi basariyla tamamladiniz.'
    }

    if (effectiveResultStatus === 'FAILED') {
      return remainingAttempts && remainingAttempts > 0
        ? 'Sinavdan kalindi. Kalan haklar ile tekrar deneyebilirsiniz.'
        : 'Sinavdan kalindi. Sinav hakki kalmadi.'
    }

    return 'Sinav sonucu henuz netlesmedi.'
  }

  const statusTone = effectiveResultStatus === 'PASSED'
    ? 'text-[color:var(--success)] bg-[color:var(--surface-soft-mint)] border-[color:var(--success)]/40'
    : attempt.status === 'TERMINATED' || attempt.status === 'EXPIRED' || effectiveResultStatus === 'FAILED'
      ? 'text-[color:var(--danger)] bg-[color:var(--surface-soft-peach)] border-[color:var(--danger)]/35'
      : 'theme-text bg-[color:var(--surface-soft)] border-[color:var(--border)]'

  return (
    <div className="space-y-7">
      <Card>
        <SectionHeader
          description="Nihai karar backend cevabina gore gosterilir."
          title="Final sinav sonucu"
        />

        <div className={`mt-4 rounded-md border px-4 py-3 text-sm ${statusTone}`}>
          {effectiveResultStatus === 'PASSED' ? <CheckCircle2 className="mr-2 inline h-4 w-4" /> : null}
          {effectiveResultStatus !== 'PASSED' ? <ShieldAlert className="mr-2 inline h-4 w-4" /> : null}
          {renderStatusMessage()}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
            <p className="theme-subtle text-xs">Oturum durumu</p>
            <p className="theme-heading mt-1 text-sm font-semibold">{attemptStatusLabel}</p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
            <p className="theme-subtle text-xs">Sinav sonucu</p>
            <p className="theme-heading mt-1 text-sm font-semibold">{resultStatusLabel}</p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
            <p className="theme-subtle text-xs">Puan</p>
            <p className="theme-heading mt-1 text-sm font-semibold">{score ?? '-'}</p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
            <p className="theme-subtle text-xs">Gecme puani</p>
            <p className="theme-heading mt-1 text-sm font-semibold">{passingScore ?? '-'}</p>
          </div>
          <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3">
            <p className="theme-subtle text-xs">Kalan hak</p>
            <p className="theme-heading mt-1 text-sm font-semibold">{remainingAttempts ?? '-'}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] pt-4">
          <div className="text-sm">
            {certificateEligible ? (
              <p className="text-[color:var(--success)]">Sertifika almaya hak kazandiniz.</p>
            ) : (
              <p className="theme-muted">Sertifika uygunlugu backend degerlendirmesine gore guncellenir.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button disabled={!certificateEligible} variant="secondary">
              Sertifika (Yakinda)
            </Button>
            <Link to={ROUTES.courseFinalExamOverview(courseId)}>
              <Button asChild>
                {effectiveResultStatus === 'FAILED' && (remainingAttempts ?? 0) > 0 ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    Tekrar dene
                  </>
                ) : (
                  'Sinav ozetine don'
                )}
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default CourseFinalExamResultPage
