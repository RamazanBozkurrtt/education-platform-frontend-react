import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, CircleAlert } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import { authApi } from '../services/authApi'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { ROUTES } from '../utils/constants'

const EXPIRED_MESSAGE = 'This reactivation link has expired. Please request a new one from the sign-in page.'
const INVALID_MESSAGE = 'This reactivation link is invalid or has already been used.'
const GENERIC_ERROR_MESSAGE = 'We could not reactivate your account right now. Please try again.'
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

const resolveReactivationErrorMessage = (error: unknown) => {
  const appError = normalizeApiError(error)
  const code = (appError.code || '').toLowerCase()
  const message = (appError.message || '').toLowerCase()

  if (appError.httpStatus === 401 || code.includes('expired') || code.includes('token_expired')) {
    return EXPIRED_MESSAGE
  }

  if (
    appError.httpStatus === 403 ||
    code.includes('invalid') ||
    code.includes('signature') ||
    code.includes('used') ||
    message.includes('invalid')
  ) {
    return INVALID_MESSAGE
  }

  return appError.message || GENERIC_ERROR_MESSAGE
}

const ReactivateAccountPage = () => {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams])
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error')
  const [message, setMessage] = useState<string>(token ? 'Reactivating your account...' : INVALID_MESSAGE)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage(INVALID_MESSAGE)
      return
    }

    let cancelled = false

    const activate = async () => {
      setStatus('loading')
      setMessage('Reactivating your account...')

      try {
        const successMessage = await reactivateAccountOnce(token)

        if (cancelled) {
          return
        }

        setStatus('success')
        setMessage(successMessage || 'Your account has been reactivated. You can sign in now.')
      } catch (error) {
        if (cancelled) {
          return
        }

        setStatus('error')
        setMessage(resolveReactivationErrorMessage(error))
      }
    }

    void activate()

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="mx-auto flex max-w-sm flex-col">
      <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.26em]">Account recovery</p>
      <h2 className="theme-heading mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Reactivate account</h2>

      <div
        className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
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
          Back to sign in
        </Button>
      </Link>

      <Link className="theme-heading mt-4 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-80" to={ROUTES.forgotPassword}>
        <ArrowLeft className="h-4 w-4" />
        Forgot password?
      </Link>
    </div>
  )
}

export default ReactivateAccountPage
