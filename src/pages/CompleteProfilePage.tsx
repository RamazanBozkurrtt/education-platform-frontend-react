import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, Code2, Globe, ImagePlus, Link2, LoaderCircle, Mail, Trash2, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { getFirstFieldErrorMap } from '../shared/errors/types'
import { cn } from '../utils/helpers'
import { userService } from '../services/userService'
import { ROUTES } from '../utils/constants'

type FormErrors = Partial<Record<'firstName' | 'lastName' | 'headline' | 'biography' | 'avatar' | 'linkedin' | 'github' | 'website', string>>

const mapApiFieldErrorsToForm = (fieldErrors?: Record<string, string[]>): FormErrors => {
  const normalized = getFirstFieldErrorMap(fieldErrors)
  const mappedErrors: FormErrors = {}

  const resolve = (aliases: string[]) => aliases
    .map((alias) => normalized[alias])
    .find((message) => Boolean(message))

  const firstNameError = resolve(['firstName', 'first_name'])
  const lastNameError = resolve(['lastName', 'last_name'])
  const headlineError = resolve(['headline'])
  const biographyError = resolve(['biography'])
  const avatarError = resolve(['avatar', 'avatarUrl'])
  const linkedinError = resolve(['linkedin', 'socialLinks.LinkedIn', 'socialLinks.linkedin'])
  const githubError = resolve(['github', 'socialLinks.GitHub', 'socialLinks.github'])
  const websiteError = resolve(['website', 'socialLinks.Website', 'socialLinks.website'])

  if (firstNameError) mappedErrors.firstName = firstNameError
  if (lastNameError) mappedErrors.lastName = lastNameError
  if (headlineError) mappedErrors.headline = headlineError
  if (biographyError) mappedErrors.biography = biographyError
  if (avatarError) mappedErrors.avatar = avatarError
  if (linkedinError) mappedErrors.linkedin = linkedinError
  if (githubError) mappedErrors.github = githubError
  if (websiteError) mappedErrors.website = websiteError

  return mappedErrors
}

const TextAreaField = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  helperText,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  error?: string
  helperText?: string
}) => {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <label className="flex w-full flex-col gap-2" htmlFor={id}>
      <span className="theme-text text-sm font-medium">{label}</span>
      <span
        className={cn(
          'flex rounded-2xl border px-4 py-3 transition focus-within:border-cyan-300/40 focus-within:ring-2 focus-within:ring-cyan-300/20',
          isLight ? 'border-slate-200/90 bg-slate-100/75' : 'theme-surface-strong border-white/10',
          error && 'border-rose-400/45 focus-within:border-rose-400/55 focus-within:ring-rose-400/20',
        )}
      >
        <textarea
          aria-invalid={Boolean(error)}
          className="theme-text theme-placeholder min-h-[104px] w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-slate-500"
          id={id}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      </span>
      {error ? (
        <span className="text-xs text-rose-300">{error}</span>
      ) : helperText ? (
        <span className="theme-subtle text-xs">{helperText}</span>
      ) : null}
    </label>
  )
}

const isValidUrl = (value: string) => {
  if (!value.trim()) {
    return true
  }

  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

type CompleteProfileLocationState = {
  fromRegistration?: boolean
}

const CompleteProfilePage = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, completeProfile, logout } = useAuth()
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [headline, setHeadline] = useState(user?.headline ?? '')
  const [biography, setBiography] = useState(user?.biography ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [avatarFileName, setAvatarFileName] = useState('')
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.LinkedIn ?? '')
  const [github, setGithub] = useState(user?.socialLinks?.GitHub ?? '')
  const [website, setWebsite] = useState(user?.socialLinks?.Website ?? '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const isLight = theme === 'light'
  const showRegistrationSuccess = Boolean((location.state as CompleteProfileLocationState | null)?.fromRegistration)

  useEffect(() => {
    return () => {
      if (avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl)
      }
    }
  }, [avatarUrl])

  if (!user) {
    return null
  }

  if (user.profileCompleted) {
    return <Navigate replace to={ROUTES.dashboard} />
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    const trimmedFirstName = firstName.trim()
    const trimmedLastName = lastName.trim()
    const trimmedHeadline = headline.trim()
    const trimmedBiography = biography.trim()

    if (trimmedFirstName.length < 2 || trimmedFirstName.length > 35) {
      nextErrors.firstName = t('profileSetup.validation.firstName')
    }

    if (trimmedLastName.length < 2 || trimmedLastName.length > 20) {
      nextErrors.lastName = t('profileSetup.validation.lastName')
    }

    if (trimmedHeadline.length < 2 || trimmedHeadline.length > 50) {
      nextErrors.headline = t('profileSetup.validation.headline')
    }

    if (trimmedBiography.length < 2 || trimmedBiography.length > 250) {
      nextErrors.biography = t('profileSetup.validation.biography')
    }

    if (!isValidUrl(linkedin)) {
      nextErrors.linkedin = t('profileSetup.validation.socialLink')
    }

    if (!isValidUrl(github)) {
      nextErrors.github = t('profileSetup.validation.socialLink')
    }

    if (!isValidUrl(website)) {
      nextErrors.website = t('profileSetup.validation.socialLink')
    }

    return nextErrors
  }

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, avatar: t('profileSetup.validation.avatarFileType') }))
      event.target.value = ''
      return
    }

    setUploadingAvatar(true)
    setErrors((current) => ({ ...current, avatar: undefined }))

    try {
      const nextAvatarUrl = await userService.uploadAvatar(file)

      if (avatarUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUrl)
      }

      setAvatarUrl(nextAvatarUrl)
      setAvatarFileName(file.name)
    } catch (error) {
      const appError = normalizeApiError(error)
      const message = appError.message?.trim() || t('profileSetup.validation.avatarUpload')

      setErrors((current) => ({ ...current, avatar: message }))
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
  }

  const handleAvatarClear = () => {
    if (avatarUrl.startsWith('blob:')) {
      URL.revokeObjectURL(avatarUrl)
    }

    setAvatarUrl('')
    setAvatarFileName('')
    setErrors((current) => ({ ...current, avatar: undefined }))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      await completeProfile({
        email: user.email,
        firstName,
        lastName,
        headline,
        biography,
        avatarUrl,
        socialLinks: {
          LinkedIn: linkedin,
          GitHub: github,
          Website: website,
        },
      })

      navigate(ROUTES.dashboard, { replace: true })
    } catch (error) {
      const appError = normalizeApiError(error)
      const apiFieldErrors = mapApiFieldErrorsToForm(appError.fieldErrors)

      if (Object.keys(apiFieldErrors).length > 0) {
        setErrors((current) => ({
          ...current,
          ...apiFieldErrors,
        }))
      }

      setFormError(appError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)

    try {
      await logout()
      navigate(ROUTES.register, { replace: true })
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col">
      {showRegistrationSuccess ? (
        <div
          className={cn(
            'mb-4 rounded-2xl border px-4 py-3 text-sm font-semibold',
            isLight ? 'border-emerald-500/45 bg-emerald-500/20 text-emerald-900' : 'border-emerald-300/45 bg-emerald-500/20 text-emerald-100',
          )}
        >
          {'Kay\u0131t Olu\u015fturuldu!'}
          <br />
          Profilinizi Tamamlayabilirsiniz
        </div>
      ) : null}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.26em]">{t('profileSetup.eyebrow')}</p>
          <h2 className="theme-heading mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{t('profileSetup.title')}</h2>
          <p className="theme-muted mt-4 max-w-[52ch] text-sm leading-6">{t('profileSetup.description')}</p>
        </div>

        <Button disabled={submitting || uploadingAvatar || cancelling} onClick={handleCancel} type="button" variant="ghost">
          <ArrowLeft className="h-4 w-4" />
          {cancelling ? t('profileSetup.cancelling') : t('profileSetup.backToRegister')}
        </Button>
      </div>

      <form className="mt-6 space-y-4 pb-1" onSubmit={handleSubmit}>
        <Input
          disabled
          icon={<Mail className="h-4 w-4" />}
          id="profile-email"
          label={t('profileSetup.email')}
          value={user.email}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            error={errors.firstName}
            icon={<UserRound className="h-4 w-4" />}
            id="profile-first-name"
            label={t('profileSetup.firstName')}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder={t('profileSetup.firstNamePlaceholder')}
            value={firstName}
          />
          <Input
            error={errors.lastName}
            icon={<UserRound className="h-4 w-4" />}
            id="profile-last-name"
            label={t('profileSetup.lastName')}
            onChange={(event) => setLastName(event.target.value)}
            placeholder={t('profileSetup.lastNamePlaceholder')}
            value={lastName}
          />
        </div>

        <Input
          error={errors.headline}
          icon={<BriefcaseBusiness className="h-4 w-4" />}
          id="profile-headline"
          label={t('profileSetup.headline')}
          onChange={(event) => setHeadline(event.target.value)}
          placeholder={t('profileSetup.headlinePlaceholder')}
          value={headline}
        />

        <label className="flex flex-col gap-2">
          <span className="theme-text text-sm font-medium">{t('profileSetup.avatar')}</span>
          <div
            className={cn(
              'flex min-h-[104px] flex-col justify-between rounded-2xl border p-3',
              isLight ? 'border-slate-200/90 bg-slate-100/75' : 'theme-surface-strong border-white/10',
              errors.avatar && 'border-rose-400/45',
            )}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[color:var(--primary)] text-sm font-semibold text-white">
                {avatarUrl ? (
                  <img alt={t('profileSetup.avatarPreviewAlt')} className="h-full w-full object-cover" src={avatarUrl} />
                ) : (
                  user.initials
                )}
              </div>
              <div className="min-w-0">
                <p className="theme-text truncate text-sm font-medium">
                  {avatarFileName || (avatarUrl ? t('profileSetup.avatarReady') : t('profileSetup.avatarOptional'))}
                </p>
                <p className="theme-subtle mt-1 text-xs">{t('profileSetup.avatarHelper')}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                ref={fileInputRef}
                type="file"
              />
              <Button
                className="flex-1"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                type="button"
                variant="secondary"
              >
                {uploadingAvatar ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {uploadingAvatar ? t('profileSetup.uploadingAvatar') : t('profileSetup.selectAvatar')}
              </Button>
              {avatarUrl ? (
                <Button onClick={handleAvatarClear} size="sm" type="button" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </div>
          {errors.avatar ? <span className="text-xs text-rose-300">{errors.avatar}</span> : null}
        </label>

        <TextAreaField
          error={errors.biography}
          helperText={t('profileSetup.biographyHelper', { count: biography.trim().length, max: 250 })}
          id="profile-biography"
          label={t('profileSetup.biography')}
          onChange={setBiography}
          placeholder={t('profileSetup.biographyPlaceholder')}
          value={biography}
        />

        <div className={cn('space-y-4 rounded-[24px] border p-4', isLight ? 'border-slate-200/90 bg-white/65' : 'border-white/10 bg-white/[0.03]')}>
          <div>
            <p className="theme-heading text-sm font-semibold">{t('profileSetup.socialLinks')}</p>
            <p className="theme-muted mt-1 text-xs leading-5">{t('profileSetup.socialLinksDescription')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              error={errors.linkedin}
              icon={<Link2 className="h-4 w-4" />}
              id="profile-linkedin"
              label={t('profileSetup.linkedin')}
              onChange={(event) => setLinkedin(event.target.value)}
              placeholder={t('profileSetup.socialPlaceholder')}
              type="url"
              value={linkedin}
            />
            <Input
              error={errors.github}
              icon={<Code2 className="h-4 w-4" />}
              id="profile-github"
              label={t('profileSetup.github')}
              onChange={(event) => setGithub(event.target.value)}
              placeholder={t('profileSetup.socialPlaceholder')}
              type="url"
              value={github}
            />
          </div>
          <Input
            error={errors.website}
            icon={<Globe className="h-4 w-4" />}
            id="profile-website"
            label={t('profileSetup.website')}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder={t('profileSetup.socialPlaceholder')}
            type="url"
            value={website}
          />
        </div>

        <Button className="mt-2 w-full" disabled={submitting || uploadingAvatar || cancelling} size="lg" type="submit">
          {submitting ? t('profileSetup.saving') : t('profileSetup.save')}
        </Button>
        {formError ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {formError}
          </div>
        ) : null}
      </form>
    </div>
  )
}

export default CompleteProfilePage
