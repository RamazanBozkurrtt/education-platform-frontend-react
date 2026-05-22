import { AlertTriangle, BriefcaseBusiness, Code2, Globe, ImagePlus, Link as LinkIcon, LoaderCircle, LogOut, Mail, RefreshCw, Trash2, UserRound } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { userService } from '../services/userService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { getFirstFieldErrorMap } from '../shared/errors/types'
import { ROUTES } from '../utils/constants'

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

const getSocialIcon = (label: string) => {
  const normalized = label.toLocaleLowerCase()

  if (normalized.includes('linkedin')) {
    return <LinkIcon className="h-4 w-4" />
  }

  if (normalized.includes('github')) {
    return <Globe className="h-4 w-4" />
  }

  return <Globe className="h-4 w-4" />
}

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
  const socialEntries = Object.entries(user.socialLinks ?? {})

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
        message: t('profile.deactivate.mismatch', { defaultValue: 'The confirmation sentence does not match.' }),
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
        message: appError.message || t('profile.deactivate.requestError', { defaultValue: 'Profile deactivation failed. Please try again.' }),
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

  const renderPasswordCard = () => (
    <Card>
      <p className="theme-heading text-sm font-semibold">{t('profile.password.title')}</p>
      <p className="theme-muted mt-1 text-xs">{t('profile.password.description')}</p>

      {!isPasswordFormVisible ? (
        <Button
          className="mt-4"
          disabled={isChangingPassword || isLoggingOut || isSaving}
          onClick={() => {
            setPasswordFeedback(null)
            setIsPasswordFormVisible(true)
          }}
          variant="secondary"
        >
          {t('profile.password.open')}
        </Button>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={handleChangePassword}>
          <Input
            autoComplete="current-password"
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

          {passwordFeedback ? (
            <p className={`text-sm ${passwordFeedback.tone === 'success' ? 'theme-text' : 'text-[color:var(--danger)]'}`}>
              {passwordFeedback.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button className="flex-1" disabled={isChangingPassword || isLoggingOut || isSaving} type="submit">
              {isChangingPassword ? t('profile.password.submitting') : t('profile.password.submit')}
            </Button>
            <Button
              className="flex-1"
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
      )}
    </Card>
  )

  const renderDeactivateCard = () => (
    <Card>
      <div className="rounded-[18px] border border-[color:var(--danger)]/35 bg-[color:var(--surface-soft-peach)] p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full border border-[color:var(--danger)]/35 p-1.5 text-[color:var(--danger)]">
            <AlertTriangle className="h-4 w-4" />
          </span>
          <div>
            <p className="theme-heading text-sm font-semibold">
              {t('profile.deactivate.title', { defaultValue: 'Deactivate profile' })}
            </p>
            <p className="theme-muted mt-1 text-xs">
              {t('profile.deactivate.description', { defaultValue: 'Type the sentence exactly to confirm profile deactivation.' })}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-[14px] border border-[color:var(--danger)]/25 bg-[color:var(--surface-strong)] px-3 py-2.5">
          <p className="theme-subtle text-[11px] uppercase tracking-[0.2em]">
            {t('profile.deactivate.promptLabel', { defaultValue: 'Confirmation sentence' })}
          </p>
          <p className="theme-text mt-2 text-sm leading-6">{deactivatePhrase}</p>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleDeactivateProfile}>
          <label className="flex w-full flex-col gap-2" htmlFor="profile-deactivate-confirmation">
            <span className="theme-heading text-sm font-semibold">
              {t('profile.deactivate.inputLabel', { defaultValue: 'Type the sentence above' })}
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
                placeholder={t('profile.deactivate.inputPlaceholder', { defaultValue: 'Write the sentence exactly as shown.' })}
                rows={3}
                value={deactivateInput}
              />
            </span>
          </label>

          {deactivateFeedback ? (
            <p className={`text-sm ${deactivateFeedback.tone === 'success' ? 'theme-text' : 'text-[color:var(--danger)]'}`}>
              {deactivateFeedback.message}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              className="flex-1 border-[color:var(--danger)] bg-[color:var(--danger)] text-white hover:border-[color:var(--danger)] hover:bg-[color:var(--danger)] hover:opacity-90"
              disabled={isDeactivating || isLoggingOut || isSaving || isChangingPassword || uploadingAvatar || deactivateInput.trim() !== deactivatePhrase}
              type="submit"
            >
              {isDeactivating
                ? t('profile.deactivate.submitting', { defaultValue: 'Deactivating profile...' })
                : t('profile.deactivate.submit', { defaultValue: 'Deactivate profile' })}
            </Button>
            <Button
              className="flex-1"
              disabled={isDeactivating}
              onClick={handleRefreshDeactivatePhrase}
              type="button"
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4" />
              {t('profile.deactivate.newSentence', { defaultValue: 'New sentence' })}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  )

  const displayAvatarUrl = isEditing ? (avatarUrl || user.avatarUrl) : user.avatarUrl

  return (
    <div className="space-y-7">
      <PageHeader
        description={t('profile.description')}
        eyebrow={t('profile.eyebrow')}
        title={t('profile.title')}
      />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="flex flex-col gap-6 border-b border-[color:var(--border)] pb-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[color:var(--primary)] text-2xl font-semibold text-white">
              {displayAvatarUrl ? (
                <img alt={fullName} className="h-full w-full rounded-[28px] object-cover" src={displayAvatarUrl} />
              ) : (
                user.initials
              )}
            </div>
            <div>
              <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{t('profile.account')}</p>
              <h2 className="theme-heading mt-2 text-3xl font-semibold">{fullName}</h2>
              {user.headline ? <p className="theme-muted mt-2 text-base">{user.headline}</p> : null}
            </div>
          </div>

          <div className="mt-6">
            <div className="rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
              <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{t('profile.email')}</p>
              <div className="theme-text mt-3 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {isEditing ? (
                <Button disabled={isSaving || isLoggingOut || isDeactivating} onClick={handleCancelEditing} variant="secondary">
                  {t('profile.cancelEdit')}
                </Button>
              ) : (
                <Button disabled={isLoggingOut || isSaving || isDeactivating} onClick={handleStartEditing} variant="secondary">
                  {t('profile.edit')}
                </Button>
              )}
              <Button disabled={isLoggingOut || isSaving || isDeactivating} onClick={handleLogout} variant="ghost">
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}
              </Button>
            </div>
          </div>
        </Card>

        {isEditing ? (
          <div className="space-y-6">
            <Card>
              <p className="theme-heading text-sm font-semibold">{t('profile.editDetails')}</p>
              <p className="theme-muted mt-1 text-xs">{t('profile.editDescription')}</p>

              <form className="mt-4 space-y-4" onSubmit={handleSaveProfile}>
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
                  <span className="theme-heading text-sm font-semibold">{t('profileSetup.avatar')}</span>
                  <div className="flex min-h-[104px] flex-col justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[color:var(--primary)] text-sm font-semibold text-white">
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
                        <p className="theme-muted mt-1 text-xs">{t('profileSetup.avatarHelper')}</p>
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
                  {errors.avatar ? (
                    <span className="text-xs text-[color:var(--danger)]">{errors.avatar}</span>
                  ) : null}
                </label>

                <label className="flex w-full flex-col gap-2" htmlFor="profile-biography">
                  <span className="theme-heading text-sm font-semibold">{t('profileSetup.biography')}</span>
                  <span className="flex rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 transition focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--focus-ring)]">
                    <textarea
                      aria-invalid={Boolean(errors.biography)}
                      className="theme-text theme-placeholder w-full resize-none bg-transparent text-sm leading-6 outline-none"
                      id="profile-biography"
                      onChange={(event) => setBiography(event.target.value)}
                      placeholder={t('profileSetup.biographyPlaceholder')}
                      rows={5}
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

                <div className="space-y-4 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                  <div>
                    <p className="theme-heading text-sm font-semibold">{t('profileSetup.socialLinks')}</p>
                    <p className="theme-muted mt-1 text-xs">{t('profileSetup.socialLinksDescription')}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      error={errors.linkedin}
                      icon={<LinkIcon className="h-4 w-4" />}
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

                {feedback ? (
                  <p className={`text-sm ${feedback.tone === 'success' ? 'theme-text' : 'text-[color:var(--danger)]'}`}>{feedback.message}</p>
                ) : null}

                <Button className="w-full" disabled={isSaving || isLoggingOut || isChangingPassword || uploadingAvatar} type="submit">
                  {isSaving ? t('profile.savingChanges') : t('profile.saveChanges')}
                </Button>
              </form>
            </Card>

            {renderPasswordCard()}
            {renderDeactivateCard()}
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <p className="theme-heading text-sm font-semibold">{t('profile.about')}</p>
              <p className="theme-muted mt-4 text-sm leading-7">{user.biography || '-'}</p>
            </Card>

            <Card>
              <p className="theme-heading text-sm font-semibold">{t('profile.socialLinks')}</p>
              <div className="mt-4 space-y-3">
                {socialEntries.length > 0 ? (
                  socialEntries.map(([label, url]) => (
                    <a
                      key={label}
                      className="theme-muted flex items-center gap-3 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]"
                      href={url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="flex shrink-0 items-center gap-3">
                        {getSocialIcon(label)}
                        {label}
                      </span>
                      <span className="theme-subtle min-w-0 flex-1 truncate text-right">{url}</span>
                    </a>
                  ))
                ) : (
                  <div className="theme-muted rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm">
                    -
                  </div>
                )}
              </div>
            </Card>

            {feedback ? (
              <Card>
                <p className={`text-sm ${feedback.tone === 'success' ? 'theme-text' : 'text-[color:var(--danger)]'}`}>{feedback.message}</p>
              </Card>
            ) : null}

            {renderPasswordCard()}
            {renderDeactivateCard()}
          </div>
        )}
      </section>
    </div>
  )
}

export default ProfilePage
