import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Code2, Globe, Link2, UserRound } from 'lucide-react'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useLanguage } from '../../hooks/useLanguage'
import type { InstructorProfilePayload } from '../../utils/types'
import { normalizeApiError } from '../../shared/errors/normalizeApiError'

interface InstructorProfileFormProps {
  initialValues?: Partial<InstructorProfilePayload>
  submitLabel?: string
  submittingLabel?: string
  showProfileImageField?: boolean
  forcedProfileImageUrl?: string
  onSubmit: (payload: InstructorProfilePayload) => Promise<void>
}

interface InstructorProfileFormState {
  displayName: string
  biography: string
  expertiseText: string
  websiteUrl: string
  linkedinUrl: string
  githubUrl: string
  profileImageUrl: string
}

type FormField = keyof InstructorProfileFormState
type FormErrors = Partial<Record<FormField, string>>

const DISPLAY_NAME_MAX_LENGTH = 100
const BIOGRAPHY_MAX_LENGTH = 2000
const EXPERTISE_ITEM_MAX_LENGTH = 100
const URL_MAX_LENGTH = 500

const isValidUrl = (value?: string) => {
  const trimmed = value?.trim()

  if (!trimmed) {
    return true
  }

  try {
    new URL(trimmed)
    return true
  } catch {
    return false
  }
}

const toInitialValue = (value?: string) => value?.trim() ?? ''

const toExpertiseText = (value?: string[]) => {
  if (!Array.isArray(value)) {
    return ''
  }

  return value
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ')
}

const parseExpertise = (value: string) => {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

const hasExceededOptionalUrlLimit = (value?: string) => {
  const trimmed = value?.trim()
  return Boolean(trimmed && trimmed.length > URL_MAX_LENGTH)
}

const InstructorProfileForm = ({
  initialValues,
  submitLabel,
  submittingLabel,
  showProfileImageField = true,
  forcedProfileImageUrl,
  onSubmit,
}: InstructorProfileFormProps) => {
  const { language } = useLanguage()
  const copy = useMemo(() => (
    language === 'tr'
      ? {
        displayName: 'Görünür ad',
        displayNamePlaceholder: 'React Instructor',
        biography: 'Biyografi',
        biographyPlaceholder: 'React ve frontend geliştirme odaklı egitmen.',
        biographyHelper: `Biyografi zorunludur ve en fazla ${BIOGRAPHY_MAX_LENGTH} karakter olmali.`,
        expertise: 'Uzmanlık alanları',
        expertisePlaceholder: 'React, TypeScript, Frontend',
        expertiseHelper: 'Birden fazla uzmanlık alanını virgülle ayırabilirsin.',
        website: 'Web sitesi (opsiyonel)',
        linkedin: 'LinkedIn (opsiyonel)',
        github: 'GitHub (opsiyonel)',
        profileImage: 'Profil resmi URL (opsiyonel)',
        submitLabel: 'Başvuruyu Gönder',
        submittingLabel: 'Gönderiliyor...',
        validationDisplayNameRequired: 'Görünür ad zorunludur.',
        validationDisplayNameLength: `Görünür ad en fazla ${DISPLAY_NAME_MAX_LENGTH} karakter olabilir.`,
        validationBiographyRequired: 'Biyografi zorunludur.',
        validationBiographyLength: `Biyografi en fazla ${BIOGRAPHY_MAX_LENGTH} karakter olabilir.`,
        validationExpertiseRequired: 'En az bir uzmanlık alani zorunludur.',
        validationExpertiseLength: `Her uzmanlık en fazla ${EXPERTISE_ITEM_MAX_LENGTH} karakter olabilir.`,
        validationUrl: 'Geçerli bir URL girin.',
        validationUrlLength: `URL alanları en fazla ${URL_MAX_LENGTH} karakter olabilir.`,
      }
      : {
        displayName: 'Display name',
        displayNamePlaceholder: 'React Instructor',
        biography: 'Biography',
        biographyPlaceholder: 'React and frontend focused instructor.',
        biographyHelper: `Biography is required and must be at most ${BIOGRAPHY_MAX_LENGTH} characters.`,
        expertise: 'Expertise',
        expertisePlaceholder: 'React, TypeScript, Frontend',
        expertiseHelper: 'Use commas to add multiple expertise items.',
        website: 'Website (optional)',
        linkedin: 'LinkedIn (optional)',
        github: 'GitHub (optional)',
        profileImage: 'Profile image URL (optional)',
        submitLabel: 'Submit Application',
        submittingLabel: 'Submitting...',
        validationDisplayNameRequired: 'Display name is required.',
        validationDisplayNameLength: `Display name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters.`,
        validationBiographyRequired: 'Biography is required.',
        validationBiographyLength: `Biography must be at most ${BIOGRAPHY_MAX_LENGTH} characters.`,
        validationExpertiseRequired: 'At least one expertise item is required.',
        validationExpertiseLength: `Each expertise item must be at most ${EXPERTISE_ITEM_MAX_LENGTH} characters.`,
        validationUrl: 'Please enter a valid URL.',
        validationUrlLength: `URL fields must be at most ${URL_MAX_LENGTH} characters.`,
      }
  ), [language])

  const [form, setForm] = useState<InstructorProfileFormState>({
    displayName: toInitialValue(initialValues?.displayName),
    biography: toInitialValue(initialValues?.biography),
    expertiseText: toExpertiseText(initialValues?.expertise),
    websiteUrl: toInitialValue(initialValues?.websiteUrl),
    linkedinUrl: toInitialValue(initialValues?.linkedinUrl),
    githubUrl: toInitialValue(initialValues?.githubUrl),
    profileImageUrl: toInitialValue(forcedProfileImageUrl ?? initialValues?.profileImageUrl),
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm({
      displayName: toInitialValue(initialValues?.displayName),
      biography: toInitialValue(initialValues?.biography),
      expertiseText: toExpertiseText(initialValues?.expertise),
      websiteUrl: toInitialValue(initialValues?.websiteUrl),
      linkedinUrl: toInitialValue(initialValues?.linkedinUrl),
      githubUrl: toInitialValue(initialValues?.githubUrl),
      profileImageUrl: toInitialValue(forcedProfileImageUrl ?? initialValues?.profileImageUrl),
    })
  }, [forcedProfileImageUrl, initialValues])

  const validate = () => {
    const nextErrors: FormErrors = {}
    const expertiseValues = parseExpertise(form.expertiseText)

    if (!form.displayName.trim()) {
      nextErrors.displayName = copy.validationDisplayNameRequired
    } else if (form.displayName.trim().length > DISPLAY_NAME_MAX_LENGTH) {
      nextErrors.displayName = copy.validationDisplayNameLength
    }

    if (!form.biography.trim()) {
      nextErrors.biography = copy.validationBiographyRequired
    } else if (form.biography.trim().length > BIOGRAPHY_MAX_LENGTH) {
      nextErrors.biography = copy.validationBiographyLength
    }

    if (expertiseValues.length === 0) {
      nextErrors.expertiseText = copy.validationExpertiseRequired
    } else if (expertiseValues.some((item) => item.length > EXPERTISE_ITEM_MAX_LENGTH)) {
      nextErrors.expertiseText = copy.validationExpertiseLength
    }

    if (!isValidUrl(form.websiteUrl) || hasExceededOptionalUrlLimit(form.websiteUrl)) {
      nextErrors.websiteUrl = hasExceededOptionalUrlLimit(form.websiteUrl)
        ? copy.validationUrlLength
        : copy.validationUrl
    }

    if (!isValidUrl(form.linkedinUrl) || hasExceededOptionalUrlLimit(form.linkedinUrl)) {
      nextErrors.linkedinUrl = hasExceededOptionalUrlLimit(form.linkedinUrl)
        ? copy.validationUrlLength
        : copy.validationUrl
    }

    if (!isValidUrl(form.githubUrl) || hasExceededOptionalUrlLimit(form.githubUrl)) {
      nextErrors.githubUrl = hasExceededOptionalUrlLimit(form.githubUrl)
        ? copy.validationUrlLength
        : copy.validationUrl
    }

    if (showProfileImageField && (!isValidUrl(form.profileImageUrl) || hasExceededOptionalUrlLimit(form.profileImageUrl))) {
      nextErrors.profileImageUrl = hasExceededOptionalUrlLimit(form.profileImageUrl)
        ? copy.validationUrlLength
        : copy.validationUrl
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    setFormError(null)
    setSuccessMessage(null)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      await onSubmit({
        displayName: form.displayName.trim(),
        biography: form.biography.trim(),
        expertise: parseExpertise(form.expertiseText),
        websiteUrl: form.websiteUrl?.trim() || undefined,
        linkedinUrl: form.linkedinUrl?.trim() || undefined,
        githubUrl: form.githubUrl?.trim() || undefined,
        profileImageUrl: forcedProfileImageUrl?.trim() || form.profileImageUrl?.trim() || undefined,
      })
      setSuccessMessage(language === 'tr'
        ? 'Eğitmen profili başvurun başarıyla gönderildi.'
        : 'Your instructor profile application was submitted successfully.')
    } catch (error) {
      const appError = normalizeApiError(error)
      setFormError(appError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const biographyLength = form.biography.trim().length

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        error={errors.displayName}
        icon={<UserRound className="h-4 w-4" />}
        id="instructor-display-name"
        label={copy.displayName}
        onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))}
        placeholder={copy.displayNamePlaceholder}
        value={form.displayName}
      />

      <label className="flex w-full flex-col gap-2" htmlFor="instructor-biography">
        <span className="theme-heading text-sm font-semibold">{copy.biography}</span>
        <span className="flex rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 transition focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--focus-ring)]">
          <textarea
            aria-invalid={Boolean(errors.biography)}
            className="theme-text theme-placeholder min-h-[120px] w-full resize-none bg-transparent text-sm leading-6 outline-none"
            id="instructor-biography"
            onChange={(event) => setForm((current) => ({ ...current, biography: event.target.value }))}
            placeholder={copy.biographyPlaceholder}
            value={form.biography}
          />
        </span>
        {errors.biography ? (
          <span className="text-xs text-rose-300">{errors.biography}</span>
        ) : (
          <span className="theme-subtle text-xs">
            {copy.biographyHelper} ({biographyLength}/{BIOGRAPHY_MAX_LENGTH})
          </span>
        )}
      </label>

      <Input
        error={errors.expertiseText}
        icon={<Link2 className="h-4 w-4" />}
        id="instructor-expertise"
        label={copy.expertise}
        onChange={(event) => setForm((current) => ({ ...current, expertiseText: event.target.value }))}
        placeholder={copy.expertisePlaceholder}
        value={form.expertiseText}
      />
      {!errors.expertiseText ? (
        <p className="theme-subtle text-xs">{copy.expertiseHelper}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          error={errors.websiteUrl}
          icon={<Globe className="h-4 w-4" />}
          id="instructor-website"
          label={copy.website}
          onChange={(event) => setForm((current) => ({ ...current, websiteUrl: event.target.value }))}
          placeholder="https://"
          type="url"
          value={form.websiteUrl}
        />
        <Input
          error={errors.linkedinUrl}
          icon={<Link2 className="h-4 w-4" />}
          id="instructor-linkedin"
          label={copy.linkedin}
          onChange={(event) => setForm((current) => ({ ...current, linkedinUrl: event.target.value }))}
          placeholder="https://"
          type="url"
          value={form.linkedinUrl}
        />
      </div>

      <div className={`grid gap-4 ${showProfileImageField ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
        <Input
          error={errors.githubUrl}
          icon={<Code2 className="h-4 w-4" />}
          id="instructor-github"
          label={copy.github}
          onChange={(event) => setForm((current) => ({ ...current, githubUrl: event.target.value }))}
          placeholder="https://"
          type="url"
          value={form.githubUrl}
        />
        {showProfileImageField ? (
          <Input
            error={errors.profileImageUrl}
            icon={<Globe className="h-4 w-4" />}
            id="instructor-profile-image"
            label={copy.profileImage}
            onChange={(event) => setForm((current) => ({ ...current, profileImageUrl: event.target.value }))}
            placeholder="https://"
            type="url"
            value={form.profileImageUrl}
          />
        ) : null}
      </div>

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? (submittingLabel ?? copy.submittingLabel) : (submitLabel ?? copy.submitLabel)}
      </Button>

      {formError ? (
        <div className="rounded-[var(--radius-buttons)] border border-[color:var(--danger)] bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
          {formError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] px-4 py-3 text-sm theme-text">
          {successMessage}
        </div>
      ) : null}
    </form>
  )
}

export default InstructorProfileForm

