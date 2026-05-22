import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { authApi } from '../services/authApi'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { ROUTES } from '../utils/constants'

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(1, 'New password is required.')
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must include at least one lowercase letter.')
      .regex(/\d/, 'Password must include at least one number.'),
    confirmPassword: z
      .string()
      .min(1, 'Confirm password is required.')
      .min(8, 'Password must be at least 8 characters.')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must include at least one lowercase letter.')
      .regex(/\d/, 'Password must include at least one number.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

const INVALID_OR_EXPIRED_MESSAGE = 'This password reset link is invalid or expired.'
const REACTIVATION_REQUIRED_MESSAGE = 'Your account must be reactivated before resetting your password.'

const resolveResetErrorMessage = (error: unknown) => {
  const appError = normalizeApiError(error)
  const rawCode = (appError.code || '').toLowerCase()
  const rawMessage = appError.message.toLowerCase()

  if (rawCode.includes('reactivat') || rawMessage.includes('reactivat')) {
    return REACTIVATION_REQUIRED_MESSAGE
  }

  if (
    appError.httpStatus === 404 ||
    appError.httpStatus === 410 ||
    rawMessage.includes('invalid') ||
    rawMessage.includes('expired') ||
    rawMessage.includes('token')
  ) {
    return INVALID_OR_EXPIRED_MESSAGE
  }

  return 'We could not reset your password right now. Please try again.'
}

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
  })

  useEffect(() => {
    if (!successMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      navigate(ROUTES.login, { replace: true })
    }, 2500)

    return () => window.clearTimeout(timeoutId)
  }, [navigate, successMessage])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setSuccessMessage(null)

    if (!token) {
      setFormError(INVALID_OR_EXPIRED_MESSAGE)
      return
    }

    const parsed = resetPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    })

    if (!parsed.success) {
      const nextFieldErrors = parsed.error.flatten().fieldErrors
      setFieldErrors({
        newPassword: nextFieldErrors.newPassword?.[0] || '',
        confirmPassword: nextFieldErrors.confirmPassword?.[0] || '',
      })
      return
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword: parsed.data.newPassword,
        confirmPassword: parsed.data.confirmPassword,
      })
      setSuccessMessage('Your password has been reset successfully.')
    } catch (error) {
      setFormError(resolveResetErrorMessage(error))
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex max-w-sm flex-col">
        <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.26em]">Account recovery</p>
        <h2 className="theme-heading mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Invalid reset link</h2>
        <div className="mt-6 rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
          {INVALID_OR_EXPIRED_MESSAGE}
        </div>
        <Link className="mt-5" to={ROUTES.login}>
          <Button asChild className="w-full text-white" size="lg">
            Back to sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col">
      <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.26em]">Account recovery</p>
      <h2 className="theme-heading mt-3 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Set a new password</h2>
      <p className="theme-muted mt-3 text-sm leading-6">
        Enter your new password to complete account recovery.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            error={fieldErrors.newPassword}
            icon={<Lock className="h-4 w-4" />}
            id="reset-password-new"
            label="New password"
            onChange={(event) => {
              setNewPassword(event.target.value)
              setFieldErrors((current) => ({ ...current, newPassword: '' }))
            }}
            placeholder="Enter your new password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
          />
          <button
            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            className="theme-muted absolute right-3 top-[2.35rem] rounded-md p-1 transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-heading)]"
            onClick={() => setShowNewPassword((current) => !current)}
            type="button"
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative">
          <Input
            error={fieldErrors.confirmPassword}
            icon={<Lock className="h-4 w-4" />}
            id="reset-password-confirm"
            label="Confirm password"
            onChange={(event) => {
              setConfirmPassword(event.target.value)
              setFieldErrors((current) => ({ ...current, confirmPassword: '' }))
            }}
            placeholder="Re-enter your new password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
          />
          <button
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            className="theme-muted absolute right-3 top-[2.35rem] rounded-md p-1 transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-heading)]"
            onClick={() => setShowConfirmPassword((current) => !current)}
            type="button"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {formError ? (
          <div className="rounded-2xl border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
            {formError}
          </div>
        ) : null}
        {successMessage ? (
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] px-4 py-3 text-sm theme-heading">
            {successMessage}
          </div>
        ) : null}

        <Button
          className="mt-2 w-full text-white"
          disabled={resetPasswordMutation.isPending || Boolean(successMessage)}
          size="lg"
          type="submit"
        >
          {resetPasswordMutation.isPending ? 'Resetting password...' : 'Reset password'}
        </Button>
      </form>

      <Link className="mt-4" to={ROUTES.login}>
        <Button asChild className="w-full" size="lg" variant="secondary">
          Back to sign in
        </Button>
      </Link>
    </div>
  )
}

export default ResetPasswordPage
