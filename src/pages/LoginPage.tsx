import { type FormEvent, useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Loader from '../components/ui/Loader'
import { useAuth } from '../hooks/useAuth'
import { authApi } from '../services/authApi'
import { authFlowLog } from '../shared/authFlowDebug'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { getFirstFieldErrorMap } from '../shared/errors/types'
import { ROUTES } from '../utils/constants'

const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isBootstrapping, login, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [reactivationPrompt, setReactivationPrompt] = useState<{ email: string; message: string } | null>(null)
  const [reactivationRequesting, setReactivationRequesting] = useState(false)
  const [reactivationFeedback, setReactivationFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? ROUTES.dashboard
  const disallowedRedirectPaths = new Set<string>([ROUTES.login, ROUTES.register, ROUTES.completeProfile])
  const sanitizedRedirectPath = disallowedRedirectPaths.has(redirectPath)
    ? ROUTES.dashboard
    : redirectPath

  if (isBootstrapping || (isAuthenticated && !user)) {
    return <Loader label={t('loader.restoringWorkspace')} />
  }

  if (isAuthenticated && user) {
    return <Navigate replace to={user.profileCompleted === false ? ROUTES.completeProfile : ROUTES.dashboard} />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setReactivationPrompt(null)
    setReactivationFeedback(null)

    if (!password.trim()) {
      setFieldErrors({
        password: t('auth.passwordRequired', { defaultValue: 'Şifre zorunludur.' }),
      })
      return
    }

    setSubmitting(true)

    try {
      const result = await login({ email, password })
      authFlowLog('login response:', result)
      authFlowLog('stored access token:', localStorage.getItem('accessToken'))
      authFlowLog('stored refresh token:', localStorage.getItem('refreshToken'))

      if (result.status === 'deactivated') {
        setReactivationPrompt({
          email: email.trim(),
          message: result.message ?? t('auth.reactivation.required', { defaultValue: 'Your account needs to be reactivated before you can sign in.' }),
        })
        return
      }

      const nextPath = result.session?.user.profileCompleted === false
        ? ROUTES.completeProfile
        : sanitizedRedirectPath

      navigate(nextPath, { replace: true })
    } catch (error) {
      const appError = normalizeApiError(error)
      setFormError(appError.message)
      setFieldErrors(getFirstFieldErrorMap(appError.fieldErrors))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestReactivation = async () => {
    if (!reactivationPrompt?.email) {
      return
    }

    setReactivationFeedback(null)
    setReactivationRequesting(true)

    try {
      const message = await authApi.requestReactivation({ email: reactivationPrompt.email })
      setReactivationFeedback({
        tone: 'success',
        message: message || t('auth.reactivation.sent', { defaultValue: 'If your account is eligible, a reactivation link has been sent to your email.' }),
      })
    } catch (error) {
      const appError = normalizeApiError(error)
      setReactivationFeedback({
        tone: 'error',
        message: appError.message,
      })
    } finally {
      setReactivationRequesting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col">
      <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.26em]">{t('auth.welcomeBack')}</p>
      <h2 className="theme-heading mt-3 text-2xl font-semibold sm:text-3xl">{t('auth.signIn')}</h2>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          error={fieldErrors.email}
          icon={<Mail className="h-4 w-4" />}
          id="email"
          label={t('auth.email')}
          onChange={(event) => {
            setEmail(event.target.value)
            setFieldErrors((current) => ({ ...current, email: '' }))
          }}
          placeholder={t('auth.emailPlaceholder')}
          type="email"
          value={email}
        />
        <Input
          error={fieldErrors.password}
          icon={<Lock className="h-4 w-4" />}
          id="password"
          label={t('auth.password')}
          onChange={(event) => {
            setPassword(event.target.value)
            setFieldErrors((current) => ({ ...current, password: '' }))
          }}
          placeholder={t('auth.passwordPlaceholder')}
          type="password"
          value={password}
        />
        <div className="flex justify-end">
          <Link className="theme-heading text-xs font-semibold transition hover:opacity-80" to={ROUTES.forgotPassword}>
            {t('auth.forgotPassword.link')}
          </Link>
        </div>
        {formError ? (
          <div className="rounded-md border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
            {formError}
          </div>
        ) : null}
        {reactivationPrompt ? (
          <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted-mandarin)] px-4 py-3 text-sm text-[color:var(--text-heading)]">
            <p>{reactivationPrompt.message}</p>
            <p className="mt-2">
              {t('auth.reactivation.prompt', { defaultValue: 'Send a reactivation email to' })}{' '}
              <span className="font-semibold">{reactivationPrompt.email}</span>?
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                disabled={reactivationRequesting}
                onClick={() => {
                  setReactivationPrompt(null)
                  setReactivationFeedback(null)
                }}
                type="button"
                variant="secondary"
              >
                {t('auth.reactivation.notNow', { defaultValue: 'Not now' })}
              </Button>
              <Button
                className="text-white"
                disabled={reactivationRequesting}
                onClick={() => void handleRequestReactivation()}
                type="button"
              >
                {reactivationRequesting
                  ? t('auth.reactivation.sending', { defaultValue: 'Sending...' })
                  : t('auth.reactivation.send', { defaultValue: 'Yes, send link' })}
              </Button>
            </div>
            {reactivationFeedback ? (
              <p className={`mt-3 ${reactivationFeedback.tone === 'error' ? 'text-[color:var(--danger)]' : 'theme-text'}`}>
                {reactivationFeedback.message}
              </p>
            ) : null}
          </div>
        ) : null}
        <Button className="mt-2 w-full text-white" size="lg" type="submit">
          {submitting ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>

      <p className="theme-muted mt-6 text-sm">
        {t('auth.needAccount')}{' '}
        <Link className="theme-heading font-semibold transition hover:opacity-80" to={ROUTES.register}>
          {t('auth.createOne')}
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
