import { type FormEvent, useState } from 'react'
import { Lock, Mail, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Loader from '../components/ui/Loader'
import { useAuth } from '../hooks/useAuth'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { getFirstFieldErrorMap } from '../shared/errors/types'
import { ROUTES } from '../utils/constants'

const RegisterPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, register, user } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  if (isAuthenticated && !user) {
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

    try {
      const normalizedName = name.trim().replace(/\s+/g, ' ')
      await register({ name: normalizedName, email, password })
      navigate(ROUTES.completeProfile, { replace: true, state: { fromRegistration: true } })
    } catch (error) {
      const appError = normalizeApiError(error)
      setFormError(appError.message)
      setFieldErrors(getFirstFieldErrorMap(appError.fieldErrors))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col">
      <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.26em]">{t('auth.createWorkspace')}</p>
      <h2 className="theme-heading mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">{t('auth.createAccount')}</h2>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          error={fieldErrors.name}
          icon={<UserRound className="h-4 w-4" />}
          id="name"
          label={t('auth.fullName')}
          onChange={(event) => {
            setName(event.target.value)
            setFieldErrors((current) => ({ ...current, name: '' }))
          }}
          placeholder={t('auth.fullNamePlaceholder')}
          value={name}
        />
        <Input
          error={fieldErrors.email}
          icon={<Mail className="h-4 w-4" />}
          id="register-email"
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
          id="register-password"
          label={t('auth.password')}
          onChange={(event) => {
            setPassword(event.target.value)
            setFieldErrors((current) => ({ ...current, password: '' }))
          }}
          placeholder={t('auth.registerPasswordPlaceholder')}
          type="password"
          value={password}
        />
        {formError ? (
          <div className="rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
            {formError}
          </div>
        ) : null}
        <Button className="mt-2 w-full text-white" size="lg" type="submit">
          {submitting ? t('auth.creatingAccount') : t('auth.createAccount')}
        </Button>
      </form>

      <p className="theme-muted mt-6 text-sm">
        {t('auth.alreadyHaveAccess')}{' '}
        <Link className="theme-heading font-semibold transition hover:opacity-80" to={ROUTES.login}>
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
