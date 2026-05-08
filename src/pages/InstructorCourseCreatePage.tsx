import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { useLanguage } from '../hooks/useLanguage'
import { instructorCourseService } from '../services/instructorCourseService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { ROUTES } from '../utils/constants'

type FormErrors = Partial<Record<'title' | 'description' | 'price' | 'learningOutcomes' | 'tags', string>>
const LEARNING_OUTCOME_COUNT = 4
const DEFAULT_TAG_FIELD_COUNT = 3
const MAX_TAG_COUNT = 6

const InstructorCourseCreatePage = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(
    Array.from({ length: LEARNING_OUTCOME_COUNT }, () => ''),
  )
  const [tags, setTags] = useState<string[]>(
    Array.from({ length: DEFAULT_TAG_FIELD_COUNT }, () => ''),
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const copy = language === 'tr'
    ? {
      eyebrow: 'Egitmen kurs yonetimi',
      title: 'Yeni kurs olustur',
      description: 'Temel kurs bilgilerini kaydet, sonra ders ve video adimina gec.',
      titleLabel: 'Kurs basligi',
      descriptionLabel: 'Kurs aciklamasi',
      priceLabel: 'Fiyat',
      categoryLabel: 'Kategori (opsiyonel)',
      outcomesLabel: 'Ogrenim ciktisi',
      outcomesHelper: 'Tam olarak 4 ogrenim ciktisi girmen gerekiyor.',
      outcomePlaceholder: (index: number) => `Ogrenim ciktisi ${index + 1}`,
      tagsLabel: 'Etiketler',
      tagsHelper: `Etiketleri ayri kutulara gir. Bos kutular gonderilmez. (Maks ${MAX_TAG_COUNT})`,
      tagPlaceholder: (index: number) => `Etiket ${index + 1}`,
      addTag: 'Etiket Ekle',
      removeTag: 'Sil',
      submit: 'Kursu Olustur',
      submitting: 'Olusturuluyor...',
      validationTitle: 'Kurs basligi zorunludur.',
      validationDescription: 'Kurs aciklamasi zorunludur.',
      validationPrice: 'Fiyat 0 veya daha buyuk bir sayi olmalidir.',
      validationOutcomes: 'Tam olarak 4 ogrenim ciktisi doldurulmalidir.',
      validationTags: 'Ayni etiket birden fazla kez kullanilamaz.',
      validationTagsMax: `En fazla ${MAX_TAG_COUNT} etiket girilebilir.`,
    }
    : {
      eyebrow: 'Course creation',
      title: 'Create a new course',
      description: 'After saving course details, continue to lesson and video setup.',
      titleLabel: 'Course title',
      descriptionLabel: 'Course description',
      priceLabel: 'Price',
      categoryLabel: 'Category ID (optional)',
      outcomesLabel: 'Learning outcomes',
      outcomesHelper: 'You must fill exactly 4 learning outcomes.',
      outcomePlaceholder: (index: number) => `Learning outcome ${index + 1}`,
      tagsLabel: 'Tags',
      tagsHelper: `Use separate fields for each tag. Empty fields are ignored. (Max ${MAX_TAG_COUNT})`,
      tagPlaceholder: (index: number) => `Tag ${index + 1}`,
      addTag: 'Add Tag',
      removeTag: 'Remove',
      submit: 'Create Course',
      submitting: 'Creating...',
      validationTitle: 'Course title is required.',
      validationDescription: 'Course description is required.',
      validationPrice: 'Price must be a number greater than or equal to 0.',
      validationOutcomes: 'All 4 learning outcomes must be filled.',
      validationTags: 'Duplicate tags are not allowed.',
      validationTagsMax: `You can add at most ${MAX_TAG_COUNT} tags.`,
    }

  const updateLearningOutcome = (index: number, value: string) => {
    setLearningOutcomes((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  const updateTag = (index: number, value: string) => {
    setTags((current) => current.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  const addTagField = () => {
    setTags((current) => {
      if (current.length >= MAX_TAG_COUNT) {
        return current
      }

      return [...current, '']
    })
  }

  const removeTagField = (index: number) => {
    setTags((current) => {
      if (current.length <= 1) {
        return ['']
      }

      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    const normalizedOutcomes = learningOutcomes
      .map((item) => item.trim())
    const normalizedTags = tags
      .map((item) => item.trim())
      .filter(Boolean)
    const parsedPrice = Number(price)
    const uniqueTags = new Set(normalizedTags.map((item) => item.toLocaleLowerCase('en-US')))

    if (!title.trim()) {
      nextErrors.title = copy.validationTitle
    }

    if (!description.trim()) {
      nextErrors.description = copy.validationDescription
    }

    if (!price.trim() || Number.isNaN(parsedPrice) || parsedPrice < 0) {
      nextErrors.price = copy.validationPrice
    }

    if (normalizedOutcomes.some((item) => !item) || normalizedOutcomes.length !== LEARNING_OUTCOME_COUNT) {
      nextErrors.learningOutcomes = copy.validationOutcomes
    }

    if (uniqueTags.size !== normalizedTags.length) {
      nextErrors.tags = copy.validationTags
    }
    if (normalizedTags.length > MAX_TAG_COUNT) {
      nextErrors.tags = copy.validationTagsMax
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    setFormError(null)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSubmitting(true)

    try {
      const normalizedLearningOutcomes = learningOutcomes
        .map((item) => item.trim())
        .filter(Boolean)
      const normalizedTags = tags
        .map((item) => item.trim())
        .filter(Boolean)
      const createdCourse = await instructorCourseService.createCourse({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        categoryId: categoryId.trim() || undefined,
        learningOutcomes: normalizedLearningOutcomes,
        tags: normalizedTags,
      })

      navigate(ROUTES.instructorNewCourseVideo(createdCourse.id), { replace: true })
    } catch (error) {
      const appError = normalizeApiError(error)
      setFormError(appError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={copy.description}
        eyebrow={copy.eyebrow}
        title={copy.title}
      />

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            error={errors.title}
            id="course-title"
            label={copy.titleLabel}
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />

          <label className="flex w-full flex-col gap-2" htmlFor="course-description">
            <span className="theme-text text-sm font-medium">{copy.descriptionLabel}</span>
            <span className="flex rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 transition focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--focus-ring)]">
              <textarea
                aria-invalid={Boolean(errors.description)}
                className="theme-text theme-placeholder min-h-[120px] w-full resize-none bg-transparent text-sm leading-6 outline-none"
                id="course-description"
                onChange={(event) => setDescription(event.target.value)}
                value={description}
              />
            </span>
            {errors.description ? <span className="text-xs text-[color:var(--danger)]">{errors.description}</span> : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              error={errors.price}
              id="course-price"
              label={copy.priceLabel}
              min={0}
              onChange={(event) => setPrice(event.target.value)}
              step="0.01"
              type="number"
              value={price}
            />
            <Input
              id="course-category-id"
              label={copy.categoryLabel}
              onChange={(event) => setCategoryId(event.target.value)}
              value={categoryId}
            />
          </div>

          <div className="flex w-full flex-col gap-2">
            <span className="theme-text text-sm font-medium">{copy.outcomesLabel}</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {learningOutcomes.map((item, index) => (
                <Input
                  id={`course-outcome-${index + 1}`}
                  key={`course-outcome-${index + 1}`}
                  onChange={(event) => updateLearningOutcome(index, event.target.value)}
                  placeholder={copy.outcomePlaceholder(index)}
                  value={item}
                />
              ))}
            </div>
            <span className="theme-subtle text-xs">{copy.outcomesHelper}</span>
            {errors.learningOutcomes ? <span className="text-xs text-[color:var(--danger)]">{errors.learningOutcomes}</span> : null}
          </div>

          <div className="space-y-3">
            <span className="theme-text text-sm font-medium">{copy.tagsLabel}</span>
            <div className="grid gap-3 sm:grid-cols-2">
              {tags.map((item, index) => (
                <div className="flex items-center gap-2" key={`course-tag-${index + 1}`}>
                  <Input
                    id={`course-tag-${index + 1}`}
                    onChange={(event) => updateTag(index, event.target.value)}
                    placeholder={copy.tagPlaceholder(index)}
                    value={item}
                  />
                  <Button
                    className="shrink-0"
                    onClick={() => removeTagField(index)}
                    type="button"
                    variant="ghost"
                  >
                    {copy.removeTag}
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="theme-subtle text-xs">{copy.tagsHelper}</span>
              <Button
                disabled={tags.length >= MAX_TAG_COUNT}
                onClick={addTagField}
                type="button"
                variant="secondary"
              >
                {copy.addTag}
              </Button>
            </div>
            {errors.tags ? <span className="text-xs text-[color:var(--danger)]">{errors.tags}</span> : null}
          </div>

          <Button className="w-full" disabled={submitting} type="submit">
            {submitting ? copy.submitting : copy.submit}
          </Button>

          {formError ? (
            <div className="rounded-[var(--radius-buttons)] border border-[color:var(--danger)] bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
              {formError}
            </div>
          ) : null}
        </form>
      </Card>
    </div>
  )
}

export default InstructorCourseCreatePage
