import { type FormEvent, useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Loader from '../components/ui/Loader'
import { useAuth } from '../hooks/useAuth'
import { authFlowLog } from '../shared/authFlowDebug'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { getFirstFieldErrorMap } from '../shared/errors/types'
import { ROUTES } from '../utils/constants'

const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isBootstrapping, login, user } = useAuth()
  const [email, setEmail] = useState('avery@lumaacademy.dev')
  const [password, setPassword] = useState('password123')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [reactivationLink, setReactivationLink] = useState<string | null>(null)
  const [reactivationMessage, setReactivationMessage] = useState<string | null>(null)

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
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})
    setReactivationLink(null)
    setReactivationMessage(null)

    try {
      const result = await login({ email, password })
      authFlowLog('login response:', result)
      authFlowLog('stored access token:', localStorage.getItem('accessToken'))
      authFlowLog('stored refresh token:', localStorage.getItem('refreshToken'))

      if (result.status === 'deactivated') {
        setReactivationLink(result.reactivationLink ?? null)
        setReactivationMessage(result.message ?? 'Your account needs to be reactivated before you can sign in.')
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

  return (
    <div className="mx-auto flex max-w-md flex-col">
      <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.26em]">{t('auth.welcomeBack')}</p>
      <h2 className="theme-heading mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{t('auth.signIn')}</h2>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
        {formError ? (
          <div className="rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
            {formError}
          </div>
        ) : null}
        {reactivationLink ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-muted-mandarin)] px-4 py-3 text-sm text-[color:var(--text-heading)]">
            <p>{reactivationMessage}</p>
            <a
              className="mt-2 block break-all font-medium text-[color:var(--text-heading)] underline underline-offset-4"
              href={reactivationLink}
              rel="noreferrer"
              target="_blank"
            >
              {reactivationLink}
            </a>
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
