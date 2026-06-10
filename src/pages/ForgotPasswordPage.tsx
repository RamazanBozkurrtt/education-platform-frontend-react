import { type FormEvent, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { authApi } from '../services/authApi'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { getFirstFieldErrorMap } from '../shared/errors/types'
import { ROUTES } from '../utils/constants'

const FORGOT_PASSWORD_SUCCESS_MESSAGE = 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'

const ForgotPasswordPage = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const forgotPasswordSchema = useMemo(
    () => z.object({
      email: z
        .string()
        .trim()
        .min(1, t('auth.forgotPassword.emailRequired'))
        .email(t('auth.forgotPassword.emailInvalid')),
    }),
    [t],
  )

  const forgotPasswordMutation = useMutation({
    mutationFn: authApi.forgotPassword,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    setFieldErrors({})

    const parsed = forgotPasswordSchema.safeParse({ email })

    if (!parsed.success) {
      const nextFieldErrors = parsed.error.flatten().fieldErrors
      setFieldErrors({
        email: nextFieldErrors.email?.[0] || '',
      })
      return
    }

    try {
      await forgotPasswordMutation.mutateAsync(parsed.data)
      setSuccessMessage(FORGOT_PASSWORD_SUCCESS_MESSAGE)
    } catch (error) {
      const appError = normalizeApiError(error)
      const apiFieldErrors = getFirstFieldErrorMap(appError.fieldErrors)
      setFieldErrors({
        email: apiFieldErrors.email || '',
      })
      setFormError(t('auth.forgotPassword.requestError'))
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col">
      <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.26em]">{t('auth.forgotPassword.eyebrow')}</p>
      <h2 className="theme-heading mt-3 text-2xl font-semibold sm:text-3xl">{t('auth.forgotPassword.title')}</h2>
      <p className="theme-muted mt-3 text-sm leading-6">
        {t('auth.forgotPassword.description')}
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <Input
          error={fieldErrors.email}
          icon={<Mail className="h-4 w-4" />}
          id="forgot-password-email"
          label={t('auth.email')}
          onChange={(event) => {
            setEmail(event.target.value)
            setFieldErrors((current) => ({ ...current, email: '' }))
          }}
          placeholder={t('auth.emailPlaceholder')}
          type="email"
          value={email}
        />
        {formError ? (
          <div className="rounded-md border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
            {formError}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] px-4 py-3 text-sm theme-heading">
            {successMessage}
          </div>
        ) : null}
        <Button
          className="mt-2 w-full text-white"
          disabled={forgotPasswordMutation.isPending}
          size="lg"
          type="submit"
        >
          {forgotPasswordMutation.isPending ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.submit')}
        </Button>
      </form>

      <Link className="theme-heading mt-6 inline-flex items-center gap-2 text-sm font-semibold transition hover:opacity-80" to={ROUTES.login}>
        <ArrowLeft className="h-4 w-4" />
        {t('auth.forgotPassword.backToSignIn')}
      </Link>
    </div>
  )
}

export default ForgotPasswordPage
