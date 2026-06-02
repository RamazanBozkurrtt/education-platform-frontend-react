import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, CircleAlert } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useLanguage } from '../hooks/useLanguage'
import { authApi } from '../services/authApi'
import { ROUTES } from '../utils/constants'

const SUCCESS_MESSAGE = 'Hesabınız başarıyla aktifleştirildi. Giriş sayfasına yönlendiriliyorsunuz.'
const INVALID_MESSAGE = 'Aktivasyon bağlantısı geçersiz veya süresi dolmuş.'
const LOADING_MESSAGE = 'Hesabınız aktifleştiriliyor...'
const LOGIN_REDIRECT_DELAY_MS = 2000
const reactivationRequestCache = new Map<string, Promise<string>>()

const reactivateAccountOnce = (token: string) => {
  const cachedRequest = reactivationRequestCache.get(token)

  if (cachedRequest) {
    return cachedRequest
  }

  const request = authApi.reactivateAccount(token).finally(() => {
    reactivationRequestCache.delete(token)
  })

  reactivationRequestCache.set(token, request)
  return request
}

const ReactivateAccountPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error')
  const [message, setMessage] = useState<string>(token ? LOADING_MESSAGE : INVALID_MESSAGE)
  const copy = language === 'tr'
    ? {
      eyebrow: 'Hesap kurtarma',
      title: 'Hesabı yeniden aktifleştir',
      backToSignIn: 'Giriş sayfasına dön',
      forgotPassword: 'Şifremi Unuttum',
    }
    : {
      eyebrow: 'Account recovery',
      title: 'Reactivate account',
      backToSignIn: 'Back to sign in',
      forgotPassword: 'Forgot password?',
    }

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(INVALID_MESSAGE)
      return
    }

    let cancelled = false
    let redirectTimeoutId: number | undefined

    const activate = async () => {
      setStatus('loading')
      setMessage(LOADING_MESSAGE)

      try {
        await reactivateAccountOnce(token)

        if (cancelled) {
          return
        }

        setStatus('success')
        setMessage(SUCCESS_MESSAGE)
        redirectTimeoutId = window.setTimeout(() => {
          if (!cancelled) {
            navigate(ROUTES.login, { replace: true })
          }
        }, LOGIN_REDIRECT_DELAY_MS)
      } catch {
        if (cancelled) {
          return
        }

        setStatus('error')
        setMessage(INVALID_MESSAGE)
      }
    }

    void activate()

    return () => {
      cancelled = true
      window.clearTimeout(redirectTimeoutId)
    }
  }, [navigate, token])

  return (
    <div className="mx-auto flex max-w-sm flex-col">
      <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.26em]">{copy.eyebrow}</p>
      <h2 className="theme-heading mt-3 text-2xl font-semibold sm:text-3xl">{copy.title}</h2>

      <div
        className={`mt-6 rounded-md border px-4 py-3 text-sm ${
          status === 'success'
            ? 'border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] theme-heading'
            : status === 'error'
              ? 'border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] text-[color:var(--danger)]'
              : 'border-[color:var(--border)] bg-[color:var(--surface-muted-mandarin)] text-[color:var(--text-heading)]'
        }`}
      >
        <div className="flex items-start gap-2">
          {status === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : status === 'error' ? (
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          ) : null}
          <p>{message}</p>
        </div>
      </div>

      <Link className="mt-5" to={ROUTES.login}>
        <Button asChild className="w-full text-white" size="lg">
          {copy.backToSignIn}
        </Button>
      </Link>

      <Link className="theme-heading mt-4 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-80" to={ROUTES.forgotPassword}>
        <ArrowLeft className="h-4 w-4" />
        {copy.forgotPassword}
      </Link>
    </div>
  )
}

export default ReactivateAccountPage
