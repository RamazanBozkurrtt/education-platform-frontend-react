import { BriefcaseBusiness, Code2, Globe, ImagePlus, Link as LinkIcon, LoaderCircle, LogOut, Mail, Trash2, UserRound } from 'lucide-react'
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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout, updateProfile, changePassword } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
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
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)
  const [passwordFeedback, setPasswordFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(null)

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
      const message = await changePassword({
        oldPassword: oldPassword.trim(),
        newPassword: newPassword.trim(),
      })

      resetPasswordForm()
      setPasswordFeedback({ message: message || t('profile.password.updateSuccess'), tone: 'success' })
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
      <p className="text-sm font-semibold text-white">{t('profile.password.title')}</p>
      <p className="mt-1 text-xs text-slate-400">{t('profile.password.description')}</p>

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
            <p className={`text-sm ${passwordFeedback.tone === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
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

  const displayAvatarUrl = isEditing ? (avatarUrl || user.avatarUrl) : user.avatarUrl

  return (
    <div className="space-y-6">
      <PageHeader
        description={t('profile.description')}
        eyebrow={t('profile.eyebrow')}
        title={t('profile.title')}
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex flex-col gap-6 border-b border-white/8 pb-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-[color:var(--primary)] text-2xl font-semibold text-white">
              {displayAvatarUrl ? (
                <img alt={fullName} className="h-full w-full rounded-[28px] object-cover" src={displayAvatarUrl} />
              ) : (
                user.initials
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{t('profile.account')}</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{fullName}</h2>
              {user.headline ? <p className="mt-2 text-base text-slate-400">{user.headline}</p> : null}
            </div>
          </div>

          <div className="mt-6">
            <div className="rounded-[18px] border border-white/8 bg-[color:var(--surface-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{t('profile.email')}</p>
              <div className="mt-3 flex items-center gap-2 text-slate-200">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {isEditing ? (
                <Button disabled={isSaving || isLoggingOut} onClick={handleCancelEditing} variant="secondary">
                  {t('profile.cancelEdit')}
                </Button>
              ) : (
                <Button disabled={isLoggingOut || isSaving} onClick={handleStartEditing} variant="secondary">
                  {t('profile.edit')}
                </Button>
              )}
              <Button disabled={isLoggingOut || isSaving} onClick={handleLogout} variant="ghost">
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? t('profile.loggingOut') : t('profile.logout')}
              </Button>
            </div>
          </div>
        </Card>

        {isEditing ? (
          <div className="space-y-6">
            <Card>
              <p className="text-sm font-semibold text-white">{t('profile.editDetails')}</p>
              <p className="mt-1 text-xs text-slate-400">{t('profile.editDescription')}</p>

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
                  <span className="text-sm font-medium text-slate-200">{t('profileSetup.avatar')}</span>
                  <div className="flex min-h-[104px] flex-col justify-between rounded-2xl border border-white/10 bg-[color:var(--surface-muted)] p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[color:var(--primary)] text-sm font-semibold text-white">
                        {avatarUrl ? (
                          <img alt={t('profileSetup.avatarPreviewAlt')} className="h-full w-full object-cover" src={avatarUrl} />
                        ) : (
                          user.initials
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">
                          {avatarFileName || (avatarUrl ? t('profileSetup.avatarReady') : t('profileSetup.avatarOptional'))}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">{t('profileSetup.avatarHelper')}</p>
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
                    <span className="text-xs text-rose-300">{errors.avatar}</span>
                  ) : null}
                </label>

                <label className="flex w-full flex-col gap-2" htmlFor="profile-biography">
                  <span className="text-sm font-medium text-slate-200">{t('profileSetup.biography')}</span>
                  <span className="flex rounded-2xl border border-white/10 bg-[color:var(--surface-muted)] px-4 py-3 transition focus-within:border-cyan-300/40 focus-within:ring-2 focus-within:ring-cyan-300/20">
                    <textarea
                      aria-invalid={Boolean(errors.biography)}
                      className="w-full resize-none bg-transparent text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-500"
                      id="profile-biography"
                      onChange={(event) => setBiography(event.target.value)}
                      placeholder={t('profileSetup.biographyPlaceholder')}
                      rows={5}
                      value={biography}
                    />
                  </span>
                  {errors.biography ? (
                    <span className="text-xs text-rose-300">{errors.biography}</span>
                  ) : (
                    <span className="text-xs text-slate-500">
                      {t('profileSetup.biographyHelper', { count: biography.trim().length, max: 250 })}
                    </span>
                  )}
                </label>

                <div className="space-y-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{t('profileSetup.socialLinks')}</p>
                    <p className="mt-1 text-xs text-slate-400">{t('profileSetup.socialLinksDescription')}</p>
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
                  <p className={`text-sm ${feedback.tone === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback.message}</p>
                ) : null}

                <Button className="w-full" disabled={isSaving || isLoggingOut || isChangingPassword || uploadingAvatar} type="submit">
                  {isSaving ? t('profile.savingChanges') : t('profile.saveChanges')}
                </Button>
              </form>
            </Card>

            {renderPasswordCard()}
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <p className="text-sm font-semibold text-white">{t('profile.about')}</p>
              <p className="mt-4 text-sm leading-7 text-slate-400">{user.biography || '-'}</p>
            </Card>

            <Card>
              <p className="text-sm font-semibold text-white">{t('profile.socialLinks')}</p>
              <div className="mt-4 space-y-3">
                {socialEntries.length > 0 ? (
                  socialEntries.map(([label, url]) => (
                    <a
                      key={label}
                      className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-slate-300 transition hover:border-white/14"
                      href={url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span className="flex shrink-0 items-center gap-3">
                        {getSocialIcon(label)}
                        {label}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-right text-slate-500">{url}</span>
                    </a>
                  ))
                ) : (
                  <div className="rounded-[18px] border border-white/8 bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-slate-400">
                    -
                  </div>
                )}
              </div>
            </Card>

            {feedback ? (
              <Card>
                <p className={`text-sm ${feedback.tone === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>{feedback.message}</p>
              </Card>
            ) : null}

            {renderPasswordCard()}
          </div>
        )}
      </section>
    </div>
  )
}

export default ProfilePage
