import { Image as ImageIcon } from 'lucide-react'
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import CourseCategorySelector from '../components/instructor/CourseCategorySelector'
import CourseLevelSelector from '../components/instructor/CourseLevelSelector'
import { useLanguage } from '../hooks/useLanguage'
import { instructorCourseService } from '../services/instructorCourseService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { emitAppToast } from '../shared/notifications/appToast'
import { ROUTES } from '../utils/constants'

type FormErrors = Partial<Record<'title' | 'description' | 'price' | 'levelId' | 'categoryIds' | 'learningOutcomes' | 'tags' | 'image', string>>
const LEARNING_OUTCOME_COUNT = 4
const MIN_CATEGORY_COUNT = 1
const MAX_CATEGORY_COUNT = 5
const DEFAULT_TAG_FIELD_COUNT = 3
const MAX_TAG_COUNT = 6
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg']

const isAllowedImageFile = (file: File) => {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) {
    return true
  }

  const normalizedName = file.name.toLocaleLowerCase('en-US')
  return ALLOWED_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
}

const InstructorCourseCreatePage = () => {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [levelId, setLevelId] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(
    Array.from({ length: LEARNING_OUTCOME_COUNT }, () => ''),
  )
  const [tags, setTags] = useState<string[]>(
    Array.from({ length: DEFAULT_TAG_FIELD_COUNT }, () => ''),
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const {
    data: levels = [],
    isLoading: levelsLoading,
    error: levelsError,
    refetch: refetchLevels,
  } = useQuery({
    queryKey: ['course-public-levels'],
    queryFn: () => instructorCourseService.getPublicLevels(),
  })
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['course-public-categories'],
    queryFn: () => instructorCourseService.getPublicCategories(),
  })
  const copy = language === 'tr'
    ? {
      eyebrow: 'Egitmen kurs yonetimi',
      title: 'Yeni kurs olustur',
      description: 'Temel kurs bilgilerini kaydet, sonra ders ve video adimina gec.',
      titleLabel: 'Kurs basligi',
      descriptionLabel: 'Kurs aciklamasi',
      priceLabel: 'Fiyat',
      levelLabel: 'Seviye',
      levelPlaceholder: 'Seviye secin',
      levelHelper: 'Kurs seviyesi secimi zorunludur.',
      levelLoading: 'Seviyeler yukleniyor...',
      levelEmpty: 'Secim icin uygun seviye bulunamadi.',
      levelReload: 'Seviyeleri tekrar yukle',
      levelLoadFailed: 'Seviye listesi su anda alinamadi.',
      categoryLabel: 'Kategoriler',
      categoryPlaceholder: 'Kategori secin',
      categoryHelper: `En az ${MIN_CATEGORY_COUNT}, en fazla ${MAX_CATEGORY_COUNT} kategori secilebilir.`,
      categorySelectedSummary: (count: number) => `Secilen: ${count}/${MAX_CATEGORY_COUNT}`,
      categoryLoading: 'Kategoriler yukleniyor...',
      categoryEmpty: 'Secim icin uygun kategori bulunamadi.',
      categoryClear: 'Secimi temizle',
      categoryReload: 'Kategorileri tekrar yukle',
      categoryLoadFailed: 'Kategori listesi su anda alinamadi.',
      outcomesLabel: 'Ogrenim ciktisi',
      outcomesHelper: 'Tam olarak 4 ogrenim ciktisi girmen gerekiyor.',
      outcomePlaceholder: (index: number) => `Ogrenim ciktisi ${index + 1}`,
      imageLabel: 'Kurs gorseli (opsiyonel)',
      imageHelper: 'Gorsel secmezsen varsayilan kurs gorseli kullanılır.',
      imagePreviewLabel: 'Kurs karti onizlemesi',
      imagePreviewHelper: 'Bu alan, kurs kartindaki gorselin nasil kirpilacagini gosterir.',
      imagePreviewEmptyTitle: 'Gorsel secilmedi',
      imagePreviewEmptyDescription: 'Bir gorsel yuklediginde onizleme burada gorunecek.',
      imagePreviewAlt: 'Kurs gorseli onizlemesi',
      titlePreviewFallback: 'Kurs basligi burada gorunecek',
      previewCategoryFallback: 'Kategori secilmedi',
      previewLevelLabel: 'Seviye secilmedi',
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
      validationCategoryIds: `En az ${MIN_CATEGORY_COUNT} kategori secimi zorunludur.`,
      validationCategoryIdsMax: `En fazla ${MAX_CATEGORY_COUNT} kategori secebilirsin.`,
      validationLevelId: 'Kurs seviyesi secimi zorunludur.',
      validationOutcomes: 'Tam olarak 4 ogrenim ciktisi doldurulmalidir.',
      validationTags: 'Ayni etiket birden fazla kez kullanilamaz.',
      validationTagsMax: `En fazla ${MAX_TAG_COUNT} etiket girilebilir.`,
      validationImage: 'Kurs gorseli PNG, JPG, JPEG, WEBP veya SVG formatinda olmalidir.',
      invalidCategory: 'Secilen kategori gecersiz. Lutfen tekrar secin.',
      invalidLevel: 'Gecersiz kurs seviyesi secildi.',
      imageUploadFailed: 'Kurs olusturuldu fakat gorsel yuklenemedi. Varsayilan gorsel kullanilacak.',
    }
    : {
      eyebrow: 'Course creation',
      title: 'Create a new course',
      description: 'After saving course details, continue to lesson and video setup.',
      titleLabel: 'Course title',
      descriptionLabel: 'Course description',
      priceLabel: 'Price',
      levelLabel: 'Level',
      levelPlaceholder: 'Select level',
      levelHelper: 'Selecting a course level is required.',
      levelLoading: 'Loading levels...',
      levelEmpty: 'No levels are available for selection.',
      levelReload: 'Reload levels',
      levelLoadFailed: 'Level list could not be loaded right now.',
      categoryLabel: 'Categories',
      categoryPlaceholder: 'Select categories',
      categoryHelper: `Select at least ${MIN_CATEGORY_COUNT} and at most ${MAX_CATEGORY_COUNT} categories.`,
      categorySelectedSummary: (count: number) => `Selected: ${count}/${MAX_CATEGORY_COUNT}`,
      categoryLoading: 'Loading categories...',
      categoryEmpty: 'No categories are available for selection.',
      categoryClear: 'Clear selection',
      categoryReload: 'Reload categories',
      categoryLoadFailed: 'Category list could not be loaded right now.',
      outcomesLabel: 'Learning outcomes',
      outcomesHelper: 'You must fill exactly 4 learning outcomes.',
      outcomePlaceholder: (index: number) => `Learning outcome ${index + 1}`,
      imageLabel: 'Course image (optional)',
      imageHelper: 'If no image is selected, the default image will be used.',
      imagePreviewLabel: 'Course card preview',
      imagePreviewHelper: 'This preview shows how the image will be cropped on the course card.',
      imagePreviewEmptyTitle: 'No image selected',
      imagePreviewEmptyDescription: 'The preview will appear here after you upload an image.',
      imagePreviewAlt: 'Course image preview',
      titlePreviewFallback: 'Course title will appear here',
      previewCategoryFallback: 'No category selected',
      previewLevelLabel: 'No level selected',
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
      validationCategoryIds: `You must select at least ${MIN_CATEGORY_COUNT} category.`,
      validationCategoryIdsMax: `You can select at most ${MAX_CATEGORY_COUNT} categories.`,
      validationLevelId: 'Course level selection is required.',
      validationOutcomes: 'All 4 learning outcomes must be filled.',
      validationTags: 'Duplicate tags are not allowed.',
      validationTagsMax: `You can add at most ${MAX_TAG_COUNT} tags.`,
      validationImage: 'Course image must be PNG, JPG, JPEG, WEBP, or SVG.',
      invalidCategory: 'The selected category is invalid. Please choose again.',
      invalidLevel: 'The selected course level is invalid.',
      imageUploadFailed: 'Course was created, but image upload failed. Backend default image will be used.',
    }

  const isCategoryNotFoundError = (error: ReturnType<typeof normalizeApiError>) =>
    error.httpStatus === 404 && (
      error.code === 'COURSE_CATEGORY_NOT_FOUND' ||
      error.message.toLocaleLowerCase('en-US').includes('category')
    )
  const isLevelNotFoundError = (error: ReturnType<typeof normalizeApiError>) =>
    error.httpStatus === 404 && (
      error.code === 'COURSE_LEVEL_NOT_FOUND' ||
      error.message.toLocaleLowerCase('en-US').includes('level')
    )
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedImageFile) {
      setImagePreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedImageFile)
    setImagePreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedImageFile])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null

    if (!nextFile) {
      setSelectedImageFile(null)
      setErrors((current) => {
        if (!current.image) {
          return current
        }

        const next = { ...current }
        delete next.image
        return next
      })
      return
    }

    if (!isAllowedImageFile(nextFile)) {
      event.target.value = ''
      setSelectedImageFile(null)
      setErrors((current) => ({ ...current, image: copy.validationImage }))
      return
    }

    setSelectedImageFile(nextFile)
    setErrors((current) => {
      if (!current.image) {
        return current
      }

      const next = { ...current }
      delete next.image
      return next
    })
  }

  const selectedCategoryName = categories.find((item) => categoryIds.includes(item.id))?.categoryName ?? copy.previewCategoryFallback
  const selectedLevelName = levels.find((item) => item.id === levelId)?.levelName ?? copy.previewLevelLabel

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
    const normalizedCategoryIds = [...new Set(
      categoryIds
        .map((item) => item.trim())
        .filter(Boolean),
    )]
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
    if (!levelId.trim()) {
      nextErrors.levelId = copy.validationLevelId
    }
    if (normalizedCategoryIds.length < MIN_CATEGORY_COUNT) {
      nextErrors.categoryIds = copy.validationCategoryIds
    }
    if (normalizedCategoryIds.length > MAX_CATEGORY_COUNT) {
      nextErrors.categoryIds = copy.validationCategoryIdsMax
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
    if (selectedImageFile && !isAllowedImageFile(selectedImageFile)) {
      nextErrors.image = copy.validationImage
    }

    return nextErrors
  }

  const handleCategoryChange = (values: string[]) => {
    setCategoryIds(values)
    setErrors((current) => {
      if (!current.categoryIds) {
        return current
      }

      const next = { ...current }
      delete next.categoryIds
      return next
    })
  }

  const handleLevelChange = (value: string) => {
    setLevelId(value)
    setErrors((current) => {
      if (!current.levelId) {
        return current
      }

      const next = { ...current }
      delete next.levelId
      return next
    })
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
      const normalizedCategoryIds = [...new Set(
        categoryIds
          .map((item) => item.trim())
          .filter(Boolean),
      )]
      const createdCourse = await instructorCourseService.createCourse({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        levelId: levelId.trim(),
        categoryIds: normalizedCategoryIds,
        learningOutcomes: normalizedLearningOutcomes,
        tags: normalizedTags,
      })

      if (selectedImageFile) {
        try {
          await instructorCourseService.uploadCourseImage(createdCourse.id, selectedImageFile)
        } catch {
          emitAppToast({
            tone: 'info',
            message: copy.imageUploadFailed,
          })
        }
      }

      navigate(ROUTES.instructorNewCourseVideo(createdCourse.id), { replace: true })
    } catch (error) {
      const appError = normalizeApiError(error)
      const nextErrors: FormErrors = {}
      nextErrors.title = appError.fieldErrors?.title?.[0] ?? nextErrors.title
      nextErrors.description = appError.fieldErrors?.description?.[0] ?? nextErrors.description
      nextErrors.price = appError.fieldErrors?.price?.[0] ?? nextErrors.price
      nextErrors.levelId = appError.fieldErrors?.levelId?.[0]
        ?? appError.fieldErrors?.level?.[0]
        ?? appError.fieldErrors?.['level.id']?.[0]
        ?? nextErrors.levelId
      nextErrors.categoryIds = appError.fieldErrors?.categoryIds?.[0]
        ?? appError.fieldErrors?.categoryId?.[0]
        ?? appError.fieldErrors?.category?.[0]
        ?? appError.fieldErrors?.['categoryIds[0]']?.[0]
        ?? appError.fieldErrors?.['category.id']?.[0]
        ?? nextErrors.categoryIds
      nextErrors.learningOutcomes = appError.fieldErrors?.learningOutcomes?.[0]
        ?? appError.fieldErrors?.outcomes?.[0]
        ?? nextErrors.learningOutcomes
      nextErrors.tags = appError.fieldErrors?.tags?.[0] ?? nextErrors.tags

      if (isCategoryNotFoundError(appError)) {
        nextErrors.categoryIds = copy.invalidCategory
        void refetchCategories()
      }
      if (isLevelNotFoundError(appError)) {
        nextErrors.levelId = copy.invalidLevel
        void refetchLevels()
      }

      if (Object.keys(nextErrors).length > 0) {
        setErrors((current) => ({ ...current, ...nextErrors }))
        setFormError(null)
        return
      }

      setFormError(appError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        description={copy.description}
        eyebrow={copy.eyebrow}
        title={copy.title}
      />

      <Card>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input
            error={errors.title}
            id="course-title"
            label={copy.titleLabel}
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />

          <label className="flex w-full flex-col gap-2" htmlFor="course-description">
            <span className="theme-text text-sm font-medium">{copy.descriptionLabel}</span>
            <span className="flex rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 transition focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--focus-ring)]">
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
            <CourseLevelSelector
              emptyStateText={copy.levelEmpty}
              errorMessage={errors.levelId}
              hasLoadError={Boolean(levelsError)}
              helperText={copy.levelHelper}
              label={copy.levelLabel}
              levels={levels}
              loadFailedText={copy.levelLoadFailed}
              loading={levelsLoading}
              loadingText={copy.levelLoading}
              onChange={handleLevelChange}
              onRetry={() => void refetchLevels()}
              placeholder={copy.levelPlaceholder}
              retryLabel={copy.levelReload}
              selectedId={levelId}
            />
          </div>

          <div>
            <CourseCategorySelector
              categories={categories}
              clearLabel={copy.categoryClear}
              emptyStateText={copy.categoryEmpty}
              errorMessage={errors.categoryIds}
              hasLoadError={Boolean(categoriesError)}
              helperText={copy.categoryHelper}
              label={copy.categoryLabel}
              loadFailedText={copy.categoryLoadFailed}
              loading={categoriesLoading}
              loadingText={copy.categoryLoading}
              onChange={handleCategoryChange}
              onRetry={() => void refetchCategories()}
              retryLabel={copy.categoryReload}
              selectedIds={categoryIds}
              selectedSummary={copy.categorySelectedSummary(categoryIds.length)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
            <div className="flex flex-col gap-2">
              <span className="theme-text text-sm font-medium">{copy.imageLabel}</span>
              <input
                accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                className="theme-text file:theme-text h-12 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-[var(--radius-navigation)] file:border file:border-[color:var(--border)] file:bg-[color:var(--surface-soft)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:hover:bg-[color:var(--surface-hover)]"
                onChange={handleImageChange}
                type="file"
              />
              <span className="theme-subtle text-xs">{copy.imageHelper}</span>
              {errors.image ? <span className="text-xs text-[color:var(--danger)]">{errors.image}</span> : null}
            </div>

            <div className="space-y-3 rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="theme-text text-sm font-medium">{copy.imagePreviewLabel}</span>
                <span className="theme-subtle text-xs">{selectedImageFile?.name ?? ''}</span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-2.5 py-1 text-xs font-medium theme-muted">
                  {selectedCategoryName}
                </span>
                <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-2.5 py-1 text-xs theme-muted">
                  {selectedLevelName}
                </span>
              </div>

              <div className="overflow-hidden rounded-[var(--radius-navigation)] border border-[color:var(--border)]">
                {imagePreviewUrl ? (
                  <img
                    alt={copy.imagePreviewAlt}
                    className="h-44 w-full object-cover"
                    src={imagePreviewUrl}
                  />
                ) : (
                  <div className="flex h-44 w-full flex-col items-center justify-center gap-2 bg-[color:var(--surface-strong)] px-4 text-center">
                    <ImageIcon aria-hidden className="h-6 w-6 text-[color:var(--text-muted)]" />
                    <p className="theme-text text-sm font-medium">{copy.imagePreviewEmptyTitle}</p>
                    <p className="theme-subtle text-xs">{copy.imagePreviewEmptyDescription}</p>
                  </div>
                )}
              </div>

              <p className="text-clamp-2 theme-heading text-sm font-semibold">
                {title.trim() || copy.titlePreviewFallback}
              </p>
              <span className="theme-subtle block text-xs">{copy.imagePreviewHelper}</span>
            </div>
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

          <div className="space-y-3 rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
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
