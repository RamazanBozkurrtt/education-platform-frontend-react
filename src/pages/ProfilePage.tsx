import { AlertTriangle, ImagePlus, LoaderCircle, LogOut, RefreshCw, Trash2 } from 'lucide-react'
import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services/userService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { getFirstFieldErrorMap } from '../shared/errors/types'
import { ROUTES } from '../utils/constants'
import { cn } from '../utils/helpers'

type FormErrors = Partial<Record<'firstName' | 'lastName' | 'headline' | 'biography' | 'avatar' | 'linkedin' | 'github' | 'website', string>>
type PasswordFormErrors = Partial<Record<'oldPassword' | 'newPassword' | 'confirmNewPassword', string>>

const DEACTIVATION_CONFIRMATION_PHRASES = {
  en: [
    'I understand that deactivating my profile will remove access to my account.',
    'I confirm that I want to deactivate my profile and sign out now.',
    'I accept that my account will be deactivated and access will be revoked.',
    'I understand this action deactivates my profile and cannot be undone here.',
    'I choose to deactivate my profile and end my current session.',
    'I confirm profile deactivation and I am aware of the consequences.',
    'I acknowledge that deactivation will disable my account access.',
    'I understand deactivating my profile will log me out immediately.',
    'I confirm I want to deactivate my profile at this time.',
    'I agree that my profile should be deactivated right now.',
    'I understand that deactivation will require reactivation to use my account again.',
    'I confirm that I am intentionally deactivating my profile.',
    'I accept responsibility for deactivating my profile now.',
    'I understand this will deactivate my account and clear my session.',
    'I confirm account deactivation and acknowledge access will be blocked.',
    'I want to deactivate my profile and proceed with this action.',
    'I understand my profile will be deactivated until reactivated.',
    'I confirm that I no longer want this profile active.',
    'I acknowledge and approve the deactivation of my profile.',
    'I confirm this profile should be deactivated immediately.',
  ],
  tr: [
    'Profilimi devre disi birakmanin hesabima erisimi kapatacagini anliyorum.',
    'Profilimi devre disi birakmak istedigimi ve simdi cikis yapilacagini onayliyorum.',
    'Hesabimin devre disi birakilacagini ve erisimin kapatilacagini kabul ediyorum.',
    'Bu islemin profilimi devre disi birakacagini ve buradan geri alinamayacagini anliyorum.',
    'Profilimi devre disi birakmayi ve mevcut oturumu sonlandirmayi seciyorum.',
    'Profil devre disi birakma islemini ve sonuclarini bildigimi onayliyorum.',
    'Devre disi birakmanin hesap erisimimi kapatacagini kabul ediyorum.',
    'Profilimi devre disi birakmanin beni hemen cikis yaptiracagini anliyorum.',
    'Bu anda profilimi devre disi birakmak istedigimi onayliyorum.',
    'Profilimin hemen devre disi birakilmasini kabul ediyorum.',
    'Devre disi birakmadan sonra hesabi yeniden acmak icin reaktivasyon gerekecegini anliyorum.',
    'Profilimi bilerek devre disi biraktigimi onayliyorum.',
    'Profilimi simdi devre disi birakma sorumlulugunu kabul ediyorum.',
    'Bu islemin hesabimi devre disi birakip oturumumu temizleyecegini anliyorum.',
    'Hesap devre disi birakma islemini ve erisimin engellenecegini onayliyorum.',
    'Profilimi devre disi birakmak ve bu islemi surdurmek istiyorum.',
    'Profilimin yeniden etkinlestirilene kadar devre disi kalacagini anliyorum.',
    'Bu profilin artik aktif kalmasini istemedigimi onayliyorum.',
    'Profilimin devre disi birakilmasini bilerek kabul ediyorum.',
    'Bu profilin hemen devre disi birakilmasini onayliyorum.',
  ],
} as const

const getRandomDeactivationPhrase = (language: string) => {
  const normalizedLanguage = language.toLocaleLowerCase().startsWith('tr') ? 'tr' : 'en'
  const phrases = DEACTIVATION_CONFIRMATION_PHRASES[normalizedLanguage]
  return phrases[Math.floor(Math.random() * phrases.length)]
}

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

const mapApiFieldErrorsToPasswordForm = (fieldErrors?: Record<string, string[]>): PasswordFormErrors => {
  const normalized = getFirstFieldErrorMap(fieldErrors)
  const mappedErrors: PasswordFormErrors = {}

  const resolve = (aliases: string[]) => aliases
    .map((alias) => normalized[alias])
    .find((message) => Boolean(message))

  const oldPasswordError = resolve(['oldPassword', 'old_password'])
  const newPasswordError = resolve(['newPassword', 'new_password'])

  if (oldPasswordError) mappedErrors.oldPassword = oldPasswordError
  if (newPasswordError) mappedErrors.newPassword = newPasswordError

  return mappedErrors
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

const getSocialValue = (socialLinks: Record<string, string> | undefined, key: string) =>
  Object.entries(socialLinks ?? {}).find(([label]) => label.toLocaleLowerCase() === key.toLocaleLowerCase())?.[1] ?? ''

interface SettingsSectionProps {
  children: ReactNode
  description?: string
  id: string
  title: string
  tone?: 'default' | 'danger'
}

const settingsInputClassName = 'rounded-md bg-[color:var(--surface-strong)]'

const SettingsSection = ({ children, description, id, title, tone = 'default' }: SettingsSectionProps) => (
  <section
    className={cn(
      'scroll-mt-24 border-t border-[color:var(--border)] py-7 first:border-t-0 first:pt-0',
      tone === 'danger' && 'border-t-[color:var(--danger)]/25',
    )}
    id={id}
  >
    <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <h2 className={cn('text-sm font-semibold', tone === 'danger' ? 'text-[color:var(--danger)]' : 'theme-heading')}>
          {title}
        </h2>
        {description ? <p className="theme-muted mt-2 text-xs leading-5">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  </section>
)

const DefinitionRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="grid gap-1 border-t border-[color:var(--border)] py-3 first:border-t-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-6">
    <dt className="theme-muted text-xs font-semibold uppercase tracking-[0.08em]">{label}</dt>
    <dd className="theme-text min-w-0 text-sm leading-6">{value}</dd>
  </div>
)

const InlineNotice = ({ message, tone }: { message: string; tone: 'success' | 'error' }) => (
  <div
    aria-live="polite"
    className={cn(
      'border px-3 py-2 text-sm',
      tone === 'success'
        ? 'border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--text)]'
        : 'border-[color:var(--danger)]/35 bg-[color:var(--surface-soft-peach)] text-[color:var(--danger)]',
    )}
  >
    {message}
  </div>
)

const ProfilePage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, logout, updateProfile, changePassword, deactivateMe } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isPasswordFormVisible, setIsPasswordFormVisible] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [headline, setHeadline] = useState('')
  const [biography, setBiography] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFileName, setAvatarFileName] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [github, setGithub] = useState('')
  const [website, setWebsite] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [passwordErrors, setPasswordErrors] = useState<PasswordFormErrors>({})
  const [deactivatePhrase, setDeactivatePhrase] = useState(() => getRandomDeactivationPhrase(i18n.language))
  const [deactivateInput, setDeactivateInput] = useState('')
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [passwordFeedback, setPasswordFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [deactivateFeedback, setDeactivateFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!user) {
      return
    }

    setFirstName(user.firstName ?? '')
    setLastName(user.lastName ?? '')
    setHeadline(user.headline ?? '')
    setBiography(user.biography ?? '')
    setAvatarUrl(user.avatarUrl ?? '')
    setAvatarFileName('')
    setLinkedin(getSocialValue(user.socialLinks, 'linkedin'))
    setGithub(getSocialValue(user.socialLinks, 'github'))
    setWebsite(getSocialValue(user.socialLinks, 'website'))
  }, [user])

  useEffect(() => {
    setDeactivatePhrase(getRandomDeactivationPhrase(i18n.language))
    setDeactivateInput('')
    setDeactivateFeedback(null)
  }, [i18n.language])

  if (!user) {
    return null
  }

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name
  const socialEntries = Object.entries(user.socialLinks ?? {}).filter(([, url]) => url.trim())
  const isProfileActionBusy = isLoggingOut || isSaving || isDeactivating || isChangingPassword || uploadingAvatar

  const clearProfileError = (field: keyof FormErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const resetForm = () => {
    setFirstName(user.firstName ?? '')
    setLastName(user.lastName ?? '')
    setHeadline(user.headline ?? '')
    setBiography(user.biography ?? '')
    setAvatarUrl(user.avatarUrl ?? '')
    setAvatarFileName('')
    setLinkedin(getSocialValue(user.socialLinks, 'linkedin'))
    setGithub(getSocialValue(user.socialLinks, 'github'))
    setWebsite(getSocialValue(user.socialLinks, 'website'))
    setErrors({})
  }

  const resetPasswordForm = () => {
    setOldPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
    setPasswordErrors({})
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

  const validatePasswordForm = () => {
    const nextErrors: PasswordFormErrors = {}
    const trimmedOldPassword = oldPassword.trim()
    const trimmedNewPassword = newPassword.trim()
    const trimmedConfirmNewPassword = confirmNewPassword.trim()

    if (!trimmedOldPassword) {
      nextErrors.oldPassword = t('profile.password.validation.oldPasswordRequired')
    }

    if (trimmedNewPassword.length < 6) {
      nextErrors.newPassword = t('profile.password.validation.newPasswordMinLength')
    }

    if (trimmedNewPassword !== trimmedConfirmNewPassword) {
      nextErrors.confirmNewPassword = t('profile.password.validation.newPasswordMismatch')
    }

    return nextErrors
  }

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setFeedback(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsSaving(true)

    try {
      await updateProfile({
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

      setIsEditing(false)
      setAvatarFileName('')
      setFeedback({ message: t('profile.updateSuccess'), tone: 'success' })
    } catch (error) {
      const appError = normalizeApiError(error)
      const apiFieldErrors = mapApiFieldErrorsToForm(appError.fieldErrors)

      if (Object.keys(apiFieldErrors).length > 0) {
        setErrors((current) => ({
          ...current,
          ...apiFieldErrors,
        }))
      }

      setFeedback({ message: appError.message || t('profile.updateError'), tone: 'error' })
    } finally {
      setIsSaving(false)
    }
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
      const uploadedAvatarUrl = await userService.uploadAvatar(file)
      setAvatarUrl(uploadedAvatarUrl)
      setAvatarFileName(file.name)
    } catch (error) {
      const appError = normalizeApiError(error)
      setErrors((current) => ({ ...current, avatar: appError.message || t('profileSetup.validation.avatarUpload') }))
    } finally {
      setUploadingAvatar(false)
      event.target.value = ''
    }
  }

  const handleAvatarClear = () => {
    setAvatarUrl('')
    setAvatarFileName('')
    setErrors((current) => ({ ...current, avatar: undefined }))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleStartEditing = () => {
    resetForm()
    setIsEditing(true)
    setFeedback(null)
  }

  const handleCancelEditing = () => {
    resetForm()
    setIsEditing(false)
    setFeedback(null)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await logout()
      navigate(ROUTES.login, { replace: true })
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleRefreshDeactivatePhrase = () => {
    setDeactivatePhrase(getRandomDeactivationPhrase(i18n.language))
    setDeactivateInput('')
    setDeactivateFeedback(null)
  }

  const handleDeactivateProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDeactivateFeedback(null)

    if (deactivateInput.trim() !== deactivatePhrase) {
      setDeactivateFeedback({
        message: t('profile.deactivate.mismatch'),
        tone: 'error',
      })
      return
    }

    setIsDeactivating(true)

    try {
      await deactivateMe()
      navigate(ROUTES.login, { replace: true })
    } catch (error) {
      const appError = normalizeApiError(error)
      setDeactivateFeedback({
        message: appError.message || t('profile.deactivate.requestError'),
        tone: 'error',
      })
    } finally {
      setIsDeactivating(false)
    }
  }

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validatePasswordForm()
    setPasswordErrors(nextErrors)
    setPasswordFeedback(null)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setIsChangingPassword(true)

    try {
      await changePassword({
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
      })

      resetPasswordForm()
      setPasswordFeedback({ message: t('profile.password.updateSuccess'), tone: 'success' })
    } catch (error) {
      const appError = normalizeApiError(error)
      const apiFieldErrors = mapApiFieldErrorsToPasswordForm(appError.fieldErrors)

      if (Object.keys(apiFieldErrors).length > 0) {
        setPasswordErrors((current) => ({
          ...current,
          ...apiFieldErrors,
        }))
      }

      setPasswordFeedback({ message: appError.message || t('profile.password.updateError'), tone: 'error' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const renderPasswordSection = () => (
    <SettingsSection
      description={t('profile.password.description')}
      id="security"
      title={t('profile.password.title')}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="theme-heading text-sm font-medium">{t('profile.password.open')}</p>
            <p className="theme-muted mt-1 text-xs leading-5">
              {t('profile.password.description')}
            </p>
          </div>

          {!isPasswordFormVisible ? (
            <Button
              className="shrink-0 rounded-md"
              disabled={isProfileActionBusy}
              onClick={() => {
                setPasswordFeedback(null)
                setIsPasswordFormVisible(true)
              }}
              variant="secondary"
            >
              {t('profile.password.open')}
            </Button>
          ) : null}
        </div>

        {isPasswordFormVisible ? (
          <form className="mt-4 space-y-4" onSubmit={handleChangePassword}>
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
              <Input
                autoComplete="current-password"
                className={settingsInputClassName}
                error={passwordErrors.oldPassword}
                id="profile-current-password"
                label={t('profile.password.oldPassword')}
                onChange={(event) => {
                  setOldPassword(event.target.value)
                  setPasswordErrors((current) => ({ ...current, oldPassword: undefined }))
                }}
                placeholder={t('profile.password.oldPasswordPlaceholder')}
                type="password"
                value={oldPassword}
              />

              <Input
                autoComplete="new-password"
                className={settingsInputClassName}
                error={passwordErrors.newPassword}
                id="profile-new-password"
                label={t('profile.password.newPassword')}
                onChange={(event) => {
                  setNewPassword(event.target.value)
                  setPasswordErrors((current) => ({ ...current, newPassword: undefined }))
                }}
                placeholder={t('profile.password.newPasswordPlaceholder')}
                type="password"
                value={newPassword}
              />

              <Input
                autoComplete="new-password"
                className={settingsInputClassName}
                error={passwordErrors.confirmNewPassword}
                id="profile-confirm-new-password"
                label={t('profile.password.confirmNewPassword')}
                onChange={(event) => {
                  setConfirmNewPassword(event.target.value)
                  setPasswordErrors((current) => ({ ...current, confirmNewPassword: undefined }))
                }}
                placeholder={t('profile.password.confirmNewPasswordPlaceholder')}
                type="password"
                value={confirmNewPassword}
              />
            </div>

            {passwordFeedback ? (
              <InlineNotice message={passwordFeedback.message} tone={passwordFeedback.tone} />
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                className="rounded-md"
                disabled={isChangingPassword || isLoggingOut || isSaving || isDeactivating || uploadingAvatar}
                type="submit"
              >
                {isChangingPassword ? t('profile.password.submitting') : t('profile.password.submit')}
              </Button>
              <Button
                className="rounded-md"
                disabled={isChangingPassword}
                onClick={() => {
                  resetPasswordForm()
                  setPasswordFeedback(null)
                  setIsPasswordFormVisible(false)
                }}
                variant="secondary"
              >
                {t('profile.password.cancel')}
              </Button>
            </div>
          </form>
        ) : (
          passwordFeedback ? (
            <InlineNotice message={passwordFeedback.message} tone={passwordFeedback.tone} />
          ) : null
        )}
      </div>
    </SettingsSection>
  )

  const renderDeactivateSection = () => (
    <SettingsSection
      description={t('profile.deactivate.description')}
      id="danger-zone"
      title={t('profile.deactivate.title')}
      tone="danger"
    >
      <div className="border border-[color:var(--danger)]/35 bg-[color:var(--surface-soft-peach)] p-4">
        <div className="flex items-start gap-3 text-[color:var(--danger)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">
            {t('profile.deactivate.title')}
          </p>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="border border-[color:var(--danger)]/25 bg-[color:var(--surface-strong)] px-3 py-2.5">
            <p className="theme-subtle text-[11px] uppercase tracking-[0.2em]">
              {t('profile.deactivate.promptLabel')}
            </p>
            <p className="theme-text mt-2 text-sm leading-6">{deactivatePhrase}</p>
          </div>

          <form className="space-y-3" onSubmit={handleDeactivateProfile}>
            <label className="flex w-full flex-col gap-2" htmlFor="profile-deactivate-confirmation">
              <span className="theme-heading text-sm font-semibold">
                {t('profile.deactivate.inputLabel')}
              </span>
              <span className="flex rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 transition focus-within:border-[color:var(--danger)] focus-within:ring-2 focus-within:ring-[color:rgba(180,35,61,0.2)]">
                <textarea
                  aria-invalid={deactivateFeedback?.tone === 'error'}
                  className="theme-text theme-placeholder w-full resize-none bg-transparent text-sm leading-6 outline-none"
                  id="profile-deactivate-confirmation"
                  onChange={(event) => {
                    setDeactivateInput(event.target.value)
                    setDeactivateFeedback(null)
                  }}
                  placeholder={t('profile.deactivate.inputPlaceholder')}
                  rows={3}
                  value={deactivateInput}
                />
              </span>
            </label>

            {deactivateFeedback ? (
              <InlineNotice message={deactivateFeedback.message} tone={deactivateFeedback.tone} />
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                className="rounded-md border-[color:var(--danger)] bg-[color:var(--danger)] text-white hover:border-[color:var(--danger)] hover:bg-[color:var(--danger)] hover:opacity-90"
                disabled={isDeactivating || isLoggingOut || isSaving || isChangingPassword || uploadingAvatar || deactivateInput.trim() !== deactivatePhrase}
                type="submit"
              >
                {isDeactivating
                  ? t('profile.deactivate.submitting')
                  : t('profile.deactivate.submit')}
              </Button>
              <Button
                className="rounded-md"
                disabled={isDeactivating}
                onClick={handleRefreshDeactivatePhrase}
                type="button"
                variant="secondary"
              >
                <RefreshCw className="h-4 w-4" />
                {t('profile.deactivate.newSentence')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </SettingsSection>
  )

  const displayAvatarUrl = isEditing ? (avatarUrl || user.avatarUrl) : user.avatarUrl
  const roleLabel = t(user.roleLabelKey)
  const profileStatusLabel = user.profileCompleted === false
    ? t('profile.status.incomplete')
    : t('profile.status.active')
  const profileStatusTone = user.profileCompleted === false ? 'warning' : 'success'

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 border-b border-[color:var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.14em]">{t('profile.eyebrow')}</p>
          <h1 className="theme-heading mt-2 text-3xl font-semibold tracking-tight">{t('profile.title')}</h1>
          <p className="theme-muted mt-2 max-w-2xl text-sm leading-6">{t('profile.description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <Button
              className="rounded-md"
              disabled={isSaving || isLoggingOut || isDeactivating || uploadingAvatar}
              onClick={handleCancelEditing}
              variant="secondary"
            >
              {t('profile.cancelEdit')}
            </Button>
          ) : (
            <Button className="rounded-md" disabled={isProfileActionBusy} onClick={handleStartEditing} variant="secondary">
              {t('profile.edit')}
            </Button>
          )}
          <Button className="rounded-md" disabled={isProfileActionBusy} onClick={handleLogout} variant="ghost">
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}
          </Button>
        </div>
      </header>

      <section className="theme-surface-strong border border-[color:var(--border)] px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[color:var(--primary)] text-base font-semibold text-white">
            {displayAvatarUrl ? (
              <img alt={fullName} className="h-full w-full object-cover" src={displayAvatarUrl} />
            ) : (
              user.initials
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="theme-heading min-w-0 text-lg font-semibold leading-6">{fullName}</h2>
              <span
                className={cn(
                  'inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold',
                  profileStatusTone === 'success'
                    ? 'border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--text-muted)]'
                    : 'border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] text-[color:var(--danger)]',
                )}
              >
                {profileStatusLabel}
              </span>
            </div>
            <div className="theme-muted mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="break-all">{user.email}</span>
              <span className="hidden h-1 w-1 rounded-full bg-[color:var(--text-subtle)] sm:inline-block" />
              <span>{roleLabel}</span>
              {user.headline ? (
                <>
                  <span className="hidden h-1 w-1 rounded-full bg-[color:var(--text-subtle)] sm:inline-block" />
                  <span className="min-w-0 truncate">{user.headline}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {feedback ? <InlineNotice message={feedback.message} tone={feedback.tone} /> : null}

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="border-l border-[color:var(--border)] pl-3 text-sm">
            {[
              ['general', t('profile.nav.general')],
              ['account', t('profile.nav.account')],
              ['security', t('profile.nav.security')],
              ['danger-zone', t('profile.nav.danger')],
            ].map(([href, label]) => (
              <a
                className="theme-muted block border-l-2 border-transparent px-3 py-2 transition hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-heading)]"
                href={`#${href}`}
                key={href}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="theme-surface-strong border border-[color:var(--border)] px-4 py-2 sm:px-6">
          {isEditing ? (
            <SettingsSection
              description={t('profile.editDescription')}
              id="general"
              title={t('profile.editDetails')}
            >
              <form className="space-y-5" id="profile-details-form" onSubmit={handleSaveProfile}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    className={settingsInputClassName}
                    error={errors.firstName}
                    id="profile-first-name"
                    label={t('profileSetup.firstName')}
                    maxLength={35}
                    onChange={(event) => {
                      setFirstName(event.target.value)
                      clearProfileError('firstName')
                    }}
                    placeholder={t('profileSetup.firstNamePlaceholder')}
                    value={firstName}
                  />
                  <Input
                    className={settingsInputClassName}
                    error={errors.lastName}
                    id="profile-last-name"
                    label={t('profileSetup.lastName')}
                    maxLength={20}
                    onChange={(event) => {
                      setLastName(event.target.value)
                      clearProfileError('lastName')
                    }}
                    placeholder={t('profileSetup.lastNamePlaceholder')}
                    value={lastName}
                  />
                </div>

                <Input
                  className={settingsInputClassName}
                  error={errors.headline}
                  id="profile-headline"
                  label={t('profileSetup.headline')}
                  maxLength={50}
                  onChange={(event) => {
                    setHeadline(event.target.value)
                    clearProfileError('headline')
                  }}
                  placeholder={t('profileSetup.headlinePlaceholder')}
                  value={headline}
                />

                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                  <label className="flex w-full flex-col gap-2" htmlFor="profile-biography">
                    <span className="theme-heading text-sm font-semibold">{t('profileSetup.biography')}</span>
                    <span className="flex rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 transition focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--focus-ring)]">
                      <textarea
                        aria-invalid={Boolean(errors.biography)}
                        className="theme-text theme-placeholder w-full resize-none bg-transparent text-sm leading-6 outline-none"
                        id="profile-biography"
                        maxLength={250}
                        onChange={(event) => {
                          setBiography(event.target.value)
                          clearProfileError('biography')
                        }}
                        placeholder={t('profileSetup.biographyPlaceholder')}
                        rows={6}
                        value={biography}
                      />
                    </span>
                    {errors.biography ? (
                      <span className="text-xs text-[color:var(--danger)]">{errors.biography}</span>
                    ) : (
                      <span className="theme-subtle text-xs">
                        {t('profileSetup.biographyHelper', { count: biography.trim().length, max: 250 })}
                      </span>
                    )}
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="theme-heading text-sm font-semibold">{t('profileSetup.avatar')}</span>
                    <div className="border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[color:var(--primary)] text-sm font-semibold text-white">
                          {avatarUrl ? (
                            <img alt={t('profileSetup.avatarPreviewAlt')} className="h-full w-full object-cover" src={avatarUrl} />
                          ) : (
                            user.initials
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="theme-heading truncate text-sm font-medium">
                            {avatarFileName || (avatarUrl ? t('profileSetup.avatarReady') : t('profileSetup.avatarOptional'))}
                          </p>
                          <p className="theme-muted mt-1 text-xs leading-5">{t('profileSetup.avatarHelper')}</p>
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
                          className="flex-1 rounded-md"
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
                          <Button className="rounded-md" onClick={handleAvatarClear} size="sm" type="button" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    {errors.avatar ? (
                      <span className="text-xs text-[color:var(--danger)]">{errors.avatar}</span>
                    ) : null}
                  </label>
                </div>

                <div className="border-t border-[color:var(--border)] pt-5">
                  <p className="theme-heading text-sm font-semibold">{t('profileSetup.socialLinks')}</p>
                  <p className="theme-muted mt-1 text-xs leading-5">{t('profileSetup.socialLinksDescription')}</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <Input
                      className={settingsInputClassName}
                      error={errors.linkedin}
                      id="profile-linkedin"
                      label={t('profileSetup.linkedin')}
                      onChange={(event) => {
                        setLinkedin(event.target.value)
                        clearProfileError('linkedin')
                      }}
                      placeholder={t('profileSetup.socialPlaceholder')}
                      type="url"
                      value={linkedin}
                    />
                    <Input
                      className={settingsInputClassName}
                      error={errors.github}
                      id="profile-github"
                      label={t('profileSetup.github')}
                      onChange={(event) => {
                        setGithub(event.target.value)
                        clearProfileError('github')
                      }}
                      placeholder={t('profileSetup.socialPlaceholder')}
                      type="url"
                      value={github}
                    />
                    <Input
                      className={settingsInputClassName}
                      error={errors.website}
                      id="profile-website"
                      label={t('profileSetup.website')}
                      onChange={(event) => {
                        setWebsite(event.target.value)
                        clearProfileError('website')
                      }}
                      placeholder={t('profileSetup.socialPlaceholder')}
                      type="url"
                      value={website}
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-[color:var(--border)] pt-5">
                  <Button
                    className="rounded-md"
                    disabled={isSaving || isLoggingOut || isChangingPassword || isDeactivating || uploadingAvatar}
                    type="submit"
                  >
                    {isSaving ? t('profile.savingChanges') : t('profile.saveChanges')}
                  </Button>
                </div>
              </form>
            </SettingsSection>
          ) : (
            <SettingsSection
              description={t('profile.editDescription')}
              id="general"
              title={t('profile.nav.general')}
            >
              <dl>
                <DefinitionRow label={t('profileSetup.firstName')} value={user.firstName || '-'} />
                <DefinitionRow label={t('profileSetup.lastName')} value={user.lastName || '-'} />
                <DefinitionRow label={t('profileSetup.headline')} value={user.headline || '-'} />
                <DefinitionRow label={t('profile.about')} value={<span className="block whitespace-pre-wrap">{user.biography || '-'}</span>} />
                <DefinitionRow
                  label={t('profile.socialLinks')}
                  value={socialEntries.length > 0 ? (
                    <div className="space-y-2">
                      {socialEntries.map(([label, url]) => (
                        <a
                          className="grid min-w-0 gap-1 border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)] sm:grid-cols-[110px_minmax(0,1fr)]"
                          href={url}
                          key={label}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <span className="theme-heading font-medium">{label}</span>
                          <span className="theme-muted min-w-0 truncate">{url}</span>
                        </a>
                      ))}
                    </div>
                  ) : '-'}
                />
              </dl>
            </SettingsSection>
          )}

          <SettingsSection
            description={t('profile.accountDescription')}
            id="account"
            title={t('profile.account')}
          >
            <dl>
              <DefinitionRow label={t('profile.email')} value={<span className="break-all">{user.email}</span>} />
              <DefinitionRow label={t('profile.accountRole')} value={roleLabel} />
              <DefinitionRow label={t('profile.accountStatus')} value={profileStatusLabel} />
            </dl>
          </SettingsSection>

          {renderPasswordSection()}
          {renderDeactivateSection()}
        </main>
      </div>
    </div>
  )
}

export default ProfilePage
