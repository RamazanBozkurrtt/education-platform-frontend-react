import { normalizeApiError } from '../../shared/errors/normalizeApiError'
import { useLanguage } from '../../hooks/useLanguage'

interface QueryErrorStateProps {
  error: unknown
  fullScreen?: boolean
}

const QueryErrorState = ({ error, fullScreen = false }: QueryErrorStateProps) => {
  const { language } = useLanguage()
  const appError = normalizeApiError(error)
  const message = (() => {
    if (language !== 'tr') {
      if (appError.kind === 'network') return 'We could not reach the service right now. Please try again.'
      if (appError.kind === 'auth') return 'Please sign in again to continue.'
      if (appError.kind === 'forbidden') return 'You do not have permission to view this page.'
      if (appError.kind === 'not_found') return 'The requested content could not be found.'
      if (appError.kind === 'server') return 'A temporary service issue occurred. Please try again later.'
      return appError.message || 'Something went wrong. Please try again.'
    }

    if (appError.kind === 'network') return 'Servise şu anda ulaşılamıyor. Lütfen tekrar deneyin.'
    if (appError.kind === 'auth') return 'Devam etmek için lütfen yeniden giriş yapın.'
    if (appError.kind === 'forbidden') return 'Bu sayfayı görüntüleme yetkiniz yok.'
    if (appError.kind === 'not_found') return 'İstenen içerik bulunamadı.'
    if (appError.kind === 'server') return 'Geçici bir servis sorunu oluştu. Lütfen daha sonra tekrar deneyin.'
    return appError.message || 'Bir sorun oluştu. Lütfen tekrar deneyin.'
  })()

  return (
    <div
      role="alert"
      className={
        fullScreen
          ? 'flex min-h-screen items-center justify-center px-4'
          : 'rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft-peach)] px-5 py-4'
      }
    >
      <p className="max-w-lg text-sm text-[color:var(--text-heading)]">{message}</p>
    </div>
  )
}

export default QueryErrorState

