import { Image as ImageIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { resolveServiceUrl } from '../config/api'
import LessonVideoActions from '../components/instructor/video/LessonVideoActions'
import CourseCategorySelector from '../components/instructor/CourseCategorySelector'
import CourseLevelSelector from '../components/instructor/CourseLevelSelector'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import InfoBadge from '../components/ui/InfoBadge'
import Loader from '../components/ui/Loader'
import Modal from '../components/ui/Modal'
import QueryErrorState from '../components/ui/QueryErrorState'
import SectionHeader from '../components/ui/SectionHeader'
import { API_ENDPOINTS } from '../services/endpoints'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { emitAppToast } from '../shared/notifications/appToast'
import {
  instructorCourseService,
  type InstructorCourseCategoryOption,
  type InstructorCourseLesson,
} from '../services/instructorCourseService'
import { ROUTES } from '../utils/constants'

const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024
const MP4_MIME_TYPE = 'video/mp4'
const LEARNING_OUTCOME_COUNT = 4
const MIN_CATEGORY_COUNT = 1
const MAX_CATEGORY_COUNT = 5
const DEFAULT_TAG_FIELD_COUNT = 3
const MAX_TAG_COUNT = 6
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/svg+xml'])
const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg']

type MessageState = {
  type: 'success' | 'error'
  text: string
  details?: string[]
} | null

type CourseFormState = {
  title: string
  description: string
  price: string
  levelId: string
  categoryIds: string[]
  learningOutcomes: string[]
  tags: string[]
}

type CourseFormErrors = Partial<Record<'title' | 'description' | 'price' | 'levelId' | 'categoryIds' | 'learningOutcomes' | 'tags' | 'image', string>>

type LessonDraftState = {
  title: string
  summaryTitle: string
  orderIndex: string
  duration: string
  completed: boolean
}

const isMp4File = (file: File) => {
  const fileType = file.type?.toLocaleLowerCase('en-US') ?? ''
  const fileName = file.name.toLocaleLowerCase('en-US')
  return fileType === MP4_MIME_TYPE || fileName.endsWith('.mp4')
}

const isAllowedImageFile = (file: File) => {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) {
    return true
  }

  const normalizedName = file.name.toLocaleLowerCase('en-US')
  return ALLOWED_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
}

const extractErrorMessage = (error: unknown, fallbackMessage: string) => {
  const appError = normalizeApiError(error)
  const details = Object.values(appError.fieldErrors ?? {}).flat().filter(Boolean)

  return {
    text: appError.message || fallbackMessage,
    details,
  }
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

const ensureMinimumCount = (items: string[], minCount: number) => {
  if (items.length >= minCount) {
    return [...items]
  }

  return [...items, ...Array.from({ length: minCount - items.length }, () => '')]
}

const toSummaryTitle = (value: string) => value
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .join(' ')

const toLessonDraft = (lesson: InstructorCourseLesson): LessonDraftState => ({
  title: lesson.title,
  summaryTitle: lesson.summaryTitle || toSummaryTitle(lesson.title) || lesson.title,
  orderIndex: String(lesson.orderIndex),
  duration: lesson.duration === null ? '0' : String(lesson.duration),
  completed: lesson.completed,
})

const INITIAL_COURSE_FORM: CourseFormState = {
  title: '',
  description: '',
  price: '0',
  levelId: '',
  categoryIds: [],
  learningOutcomes: Array.from({ length: LEARNING_OUTCOME_COUNT }, () => ''),
  tags: Array.from({ length: DEFAULT_TAG_FIELD_COUNT }, () => ''),
}

const COURSE_CATEGORY_NOT_FOUND_MESSAGE = 'Secilen kategori gecersiz. Lutfen tekrar secin.'
const COURSE_LEVEL_NOT_FOUND_MESSAGE = 'Gecersiz kurs seviyesi secildi.'
const normalizeCategoryIds = (categoryIds: string[]) =>
  [...new Set(
    categoryIds
      .map((item) => item.trim())
      .filter(Boolean),
  )]

const InstructorCourseVideoUploadPage = () => {
  const { courseId = '' } = useParams()
  const navigate = useNavigate()
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonDescription, setNewLessonDescription] = useState('')
  const [newLessonOrderIndex, setNewLessonOrderIndex] = useState('1')
  const [creatingLesson, setCreatingLesson] = useState(false)
  const [publishingCourse, setPublishingCourse] = useState(false)
  const [unpublishingCourse, setUnpublishingCourse] = useState(false)
  const [savingCourse, setSavingCourse] = useState(false)
  const [deletingCourse, setDeletingCourse] = useState(false)
  const [updatingLessonId, setUpdatingLessonId] = useState<string | null>(null)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)
  const [selectedFilesByLesson, setSelectedFilesByLesson] = useState<Record<string, File | null>>({})
  const [uploadProgressByLesson, setUploadProgressByLesson] = useState<Record<string, number>>({})
  const [activeUploadLessonId, setActiveUploadLessonId] = useState<string | null>(null)
  const [previewUrlsByLesson, setPreviewUrlsByLesson] = useState<Record<string, string>>({})
  const [previewLoadingByLesson, setPreviewLoadingByLesson] = useState<Record<string, boolean>>({})
  const [previewErrorsByLesson, setPreviewErrorsByLesson] = useState<Record<string, string | null>>({})
  const [openPreviewByLesson, setOpenPreviewByLesson] = useState<Record<string, boolean>>({})
  const [courseForm, setCourseForm] = useState<CourseFormState>(INITIAL_COURSE_FORM)
  const [courseFormErrors, setCourseFormErrors] = useState<CourseFormErrors>({})
  const [selectedCourseImageFile, setSelectedCourseImageFile] = useState<File | null>(null)
  const [courseImagePreviewUrl, setCourseImagePreviewUrl] = useState<string | null>(null)
  const [lessonDraftsById, setLessonDraftsById] = useState<Record<string, LessonDraftState>>({})
  const [isCourseEditOpen, setIsCourseEditOpen] = useState(false)
  const [isUnpublishConfirmOpen, setIsUnpublishConfirmOpen] = useState(false)
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null)
  const [message, setMessage] = useState<MessageState>(null)

  useEffect(() => {
    if (!message) {
      return
    }

    emitAppToast({
      tone: message.type,
      message: message.text,
      details: message.details,
    })

    setMessage(null)
  }, [message])

  useEffect(() => {
    if (!selectedCourseImageFile) {
      setCourseImagePreviewUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(selectedCourseImageFile)
    setCourseImagePreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedCourseImageFile])

  useEffect(() => {
    if (isCourseEditOpen) {
      return
    }

    setSelectedCourseImageFile(null)
    setCourseFormErrors((current) => {
      if (!current.image) {
        return current
      }

      const next = { ...current }
      delete next.image
      return next
    })
  }, [isCourseEditOpen])

  const {
    data: courseDetail,
    error,
    isLoading,
    refetch: refetchCourseDetail,
  } = useQuery({
    queryKey: ['instructor-course-lessons', courseId],
    queryFn: () => instructorCourseService.getCourseById(courseId),
    enabled: Boolean(courseId),
  })
  const {
    data: courseLevels = [],
    isLoading: levelsLoading,
    error: levelsError,
    refetch: refetchLevels,
  } = useQuery({
    queryKey: ['instructor-course-levels'],
    queryFn: () => instructorCourseService.getPublicLevels(),
  })
  const {
    data: courseCategories = [] as InstructorCourseCategoryOption[],
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['instructor-course-categories'],
    queryFn: () => instructorCourseService.getPublicCategories(),
  })

  const clearPreviewStateForLesson = useCallback((lessonId: string) => {
    setPreviewUrlsByLesson((current) => {
      const next = { ...current }
      delete next[lessonId]
      return next
    })
    setPreviewLoadingByLesson((current) => {
      const next = { ...current }
      delete next[lessonId]
      return next
    })
    setPreviewErrorsByLesson((current) => {
      const next = { ...current }
      delete next[lessonId]
      return next
    })
    setOpenPreviewByLesson((current) => {
      const next = { ...current }
      delete next[lessonId]
      return next
    })
  }, [])

  useEffect(() => {
    if (!courseDetail) {
      return
    }

    setCourseForm({
      title: courseDetail.title,
      description: courseDetail.description,
      price: String(courseDetail.price),
      levelId: courseDetail.levelId,
      categoryIds: courseDetail.categoryIds,
      learningOutcomes: ensureMinimumCount(courseDetail.learningOutcomes, LEARNING_OUTCOME_COUNT).slice(0, LEARNING_OUTCOME_COUNT),
      tags: ensureMinimumCount(courseDetail.tags, DEFAULT_TAG_FIELD_COUNT).slice(0, MAX_TAG_COUNT),
    })
    setCourseFormErrors({})

    setLessonDraftsById(
      Object.fromEntries(
        courseDetail.lessons.map((lesson) => [lesson.id, toLessonDraft(lesson)]),
      ),
    )
  }, [courseDetail])

  useEffect(() => {
    if (!courseDetail) {
      return
    }

    const lessonIdsWithVideo = new Set(
      courseDetail.lessons
        .filter((lesson) => Boolean(lesson.videoUrl))
        .map((lesson) => lesson.id),
    )

    setPreviewUrlsByLesson((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([lessonId]) => lessonIdsWithVideo.has(lessonId)),
      )
      return Object.keys(next).length === Object.keys(current).length ? current : next
    })

    setOpenPreviewByLesson((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([lessonId]) => lessonIdsWithVideo.has(lessonId)),
      )
      return Object.keys(next).length === Object.keys(current).length ? current : next
    })
  }, [courseDetail])

  const validateSelectedFile = (file: File) => {
    if (!isMp4File(file)) {
      return 'Sadece MP4 formatindaki videolar yuklenebilir.'
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return 'Dosya boyutu en fazla 2GB olabilir.'
    }

    return null
  }

  const handleFileSelection = (lessonId: string, file: File | null) => {
    setMessage(null)

    if (!file) {
      setSelectedFilesByLesson((current) => ({
        ...current,
        [lessonId]: null,
      }))
      return
    }

    const validationMessage = validateSelectedFile(file)

    if (validationMessage) {
      setMessage({
        type: 'error',
        text: validationMessage,
      })
      setSelectedFilesByLesson((current) => ({
        ...current,
        [lessonId]: null,
      }))
      return
    }

    setSelectedFilesByLesson((current) => ({
      ...current,
      [lessonId]: file,
    }))
  }

  const handleCourseFieldChange = (field: 'title' | 'description' | 'price', value: string) => {
    setCourseForm((current) => ({
      ...current,
      [field]: value,
    }))
    setCourseFormErrors((current) => {
      if (!current[field as keyof CourseFormErrors]) {
        return current
      }

      const next = { ...current }
      delete next[field as keyof CourseFormErrors]
      return next
    })
  }

  const handleCategoryIdsChange = (categoryIds: string[]) => {
    setCourseForm((current) => ({
      ...current,
      categoryIds: normalizeCategoryIds(categoryIds),
    }))
    setCourseFormErrors((current) => {
      if (!current.categoryIds) {
        return current
      }

      const next = { ...current }
      delete next.categoryIds
      return next
    })
  }

  const handleLevelIdChange = (levelId: string) => {
    setCourseForm((current) => ({
      ...current,
      levelId: levelId.trim(),
    }))
    setCourseFormErrors((current) => {
      if (!current.levelId) {
        return current
      }

      const next = { ...current }
      delete next.levelId
      return next
    })
  }

  const handleLearningOutcomeChange = (index: number, value: string) => {
    setCourseForm((current) => ({
      ...current,
      learningOutcomes: current.learningOutcomes.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }))
    setCourseFormErrors((current) => {
      if (!current.learningOutcomes) {
        return current
      }

      const next = { ...current }
      delete next.learningOutcomes
      return next
    })
  }

  const handleTagChange = (index: number, value: string) => {
    setCourseForm((current) => ({
      ...current,
      tags: current.tags.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }))
    setCourseFormErrors((current) => {
      if (!current.tags) {
        return current
      }

      const next = { ...current }
      delete next.tags
      return next
    })
  }

  const handleAddTagField = () => {
    setCourseForm((current) => {
      if (current.tags.length >= MAX_TAG_COUNT) {
        return current
      }

      return {
        ...current,
        tags: [...current.tags, ''],
      }
    })
  }

  const handleRemoveTagField = (index: number) => {
    setCourseForm((current) => {
      if (current.tags.length <= 1) {
        return {
          ...current,
          tags: [''],
        }
      }

      return {
        ...current,
        tags: current.tags.filter((_, itemIndex) => itemIndex !== index),
      }
    })
  }

  const handleCourseImageChange = (file: File | null) => {
    setMessage(null)

    if (!file) {
      setSelectedCourseImageFile(null)
      setCourseFormErrors((current) => {
        if (!current.image) {
          return current
        }

        const next = { ...current }
        delete next.image
        return next
      })
      return
    }

    if (!isAllowedImageFile(file)) {
      setSelectedCourseImageFile(null)
      setCourseFormErrors((current) => ({ ...current, image: 'Kurs gorseli PNG, JPG, JPEG, WEBP veya SVG formatinda olmalidir.' }))
      return
    }

    setSelectedCourseImageFile(file)
    setCourseFormErrors((current) => {
      if (!current.image) {
        return current
      }

      const next = { ...current }
      delete next.image
      return next
    })
  }

  const refreshCourseDetail = async () => {
    await refetchCourseDetail()
  }

  const handleSaveCourse = async () => {
    if (!courseId || savingCourse) {
      return
    }

    const title = courseForm.title.trim()
    const description = courseForm.description.trim()
    const levelId = courseForm.levelId.trim()
    const categoryIds = normalizeCategoryIds(courseForm.categoryIds)
    const price = Number(courseForm.price)
    const learningOutcomes = courseForm.learningOutcomes.map((item) => item.trim()).filter(Boolean)
    const tags = courseForm.tags.map((item) => item.trim()).filter(Boolean)
    const nextErrors: CourseFormErrors = {}

    if (!title) {
      nextErrors.title = 'Kurs basligi zorunludur.'
    }

    if (!description) {
      nextErrors.description = 'Kurs aciklamasi zorunludur.'
    }

    if (!levelId) {
      nextErrors.levelId = 'Kurs seviyesi secimi zorunludur.'
    }

    if (categoryIds.length < MIN_CATEGORY_COUNT) {
      nextErrors.categoryIds = `En az ${MIN_CATEGORY_COUNT} kategori secmelisin.`
    }

    if (categoryIds.length > MAX_CATEGORY_COUNT) {
      nextErrors.categoryIds = `En fazla ${MAX_CATEGORY_COUNT} kategori secebilirsin.`
    }

    if (!Number.isFinite(price) || price < 0) {
      nextErrors.price = 'Fiyat 0 veya daha buyuk bir sayi olmalidir.'
    }

    if (learningOutcomes.length !== LEARNING_OUTCOME_COUNT) {
      nextErrors.learningOutcomes = 'Tam olarak 4 ogrenim ciktisi doldurulmalidir.'
    }

    if (tags.length === 0) {
      nextErrors.tags = 'En az bir etiket girilmelidir.'
    }

    if (selectedCourseImageFile && !isAllowedImageFile(selectedCourseImageFile)) {
      nextErrors.image = 'Kurs gorseli PNG, JPG, JPEG, WEBP veya SVG formatinda olmalidir.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setCourseFormErrors(nextErrors)
      setMessage({
        type: 'error',
        text: Object.values(nextErrors)[0] ?? 'Lutfen form alanlarini kontrol et.',
      })
      return
    }

    setSavingCourse(true)
    setMessage(null)
    setCourseFormErrors({})

    try {
      await instructorCourseService.updateCourse(courseId, {
        title,
        description,
        price,
        levelId,
        categoryIds,
        learningOutcomes,
        tags,
      })

      let imageUploadFailure: ReturnType<typeof extractErrorMessage> | null = null

      if (selectedCourseImageFile) {
        try {
          await instructorCourseService.uploadCourseImage(courseId, selectedCourseImageFile)
        } catch (uploadError: unknown) {
          imageUploadFailure = extractErrorMessage(uploadError, 'Kurs gorseli guncellenemedi.')
        }
      }

      await refreshCourseDetail()

      if (imageUploadFailure) {
        setCourseFormErrors((current) => ({
          ...current,
          image: imageUploadFailure?.text ?? 'Kurs gorseli guncellenemedi.',
        }))
        setMessage({
          type: 'error',
          text: 'Kurs bilgileri guncellendi fakat kurs gorseli yuklenemedi.',
          details: imageUploadFailure.details.length > 0 ? imageUploadFailure.details : [imageUploadFailure.text],
        })
      } else {
        setSelectedCourseImageFile(null)
        setIsCourseEditOpen(false)
        setMessage({
          type: 'success',
          text: 'Kurs bilgileri basariyla guncellendi.',
        })
      }
    } catch (updateError: unknown) {
      const appError = normalizeApiError(updateError)
      const serverErrors: CourseFormErrors = {}

      serverErrors.title = appError.fieldErrors?.title?.[0] ?? serverErrors.title
      serverErrors.description = appError.fieldErrors?.description?.[0] ?? serverErrors.description
      serverErrors.price = appError.fieldErrors?.price?.[0] ?? serverErrors.price
      serverErrors.levelId = appError.fieldErrors?.levelId?.[0]
        ?? appError.fieldErrors?.level?.[0]
        ?? appError.fieldErrors?.['level.id']?.[0]
        ?? serverErrors.levelId
      serverErrors.categoryIds = appError.fieldErrors?.categoryIds?.[0]
        ?? appError.fieldErrors?.categoryId?.[0]
        ?? appError.fieldErrors?.category?.[0]
        ?? appError.fieldErrors?.['categoryIds[0]']?.[0]
        ?? appError.fieldErrors?.['category.id']?.[0]
        ?? serverErrors.categoryIds
      serverErrors.learningOutcomes = appError.fieldErrors?.learningOutcomes?.[0]
        ?? appError.fieldErrors?.outcomes?.[0]
        ?? serverErrors.learningOutcomes
      serverErrors.tags = appError.fieldErrors?.tags?.[0] ?? serverErrors.tags

      if (isCategoryNotFoundError(appError)) {
        serverErrors.categoryIds = COURSE_CATEGORY_NOT_FOUND_MESSAGE
        void refetchCategories()
      }
      if (isLevelNotFoundError(appError)) {
        serverErrors.levelId = COURSE_LEVEL_NOT_FOUND_MESSAGE
        void refetchLevels()
      }

      const hasServerFieldErrors = Object.values(serverErrors).some(Boolean)

      if (hasServerFieldErrors) {
        setCourseFormErrors((current) => ({ ...current, ...serverErrors }))
      }

      const resolvedError = extractErrorMessage(updateError, 'Kurs guncellenirken bir sorun olustu.')
      setMessage({
        type: 'error',
        text: hasServerFieldErrors
          ? Object.values(serverErrors).find((item) => Boolean(item)) ?? resolvedError.text
          : resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setSavingCourse(false)
    }
  }

  const handleDeleteCourse = async () => {
    if (!courseId || deletingCourse) {
      return
    }

    const confirmed = window.confirm('Bu kursu tamamen silmek istedigine emin misin? Bu islem geri alinamaz.')

    if (!confirmed) {
      return
    }

    setDeletingCourse(true)
    setMessage(null)

    try {
      await instructorCourseService.deleteCourse(courseId)
      setMessage({
        type: 'success',
        text: 'Kurs basariyla silindi.',
      })
      navigate(ROUTES.instructorDashboard, { replace: true })
    } catch (deleteError: unknown) {
      const resolvedError = extractErrorMessage(deleteError, 'Kurs silinirken bir sorun olustu.')
      setMessage({
        type: 'error',
        text: resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setDeletingCourse(false)
    }
  }

  const handleCreateLesson = async () => {
    if (!courseId || creatingLesson) {
      return
    }

    const trimmedTitle = newLessonTitle.trim()
    const parsedOrderIndex = Number(newLessonOrderIndex)

    if (!trimmedTitle) {
      setMessage({
        type: 'error',
        text: 'Ders basligi zorunludur.',
      })
      return
    }

    if (!Number.isFinite(parsedOrderIndex) || parsedOrderIndex < 1) {
      setMessage({
        type: 'error',
        text: 'Ders sirasi en az 1 olmalidir.',
      })
      return
    }

    setCreatingLesson(true)
    setMessage(null)

    try {
      await instructorCourseService.createLesson(courseId, {
        title: trimmedTitle,
        description: newLessonDescription,
        orderIndex: Math.trunc(parsedOrderIndex),
      })

      setNewLessonTitle('')
      setNewLessonDescription('')
      setNewLessonOrderIndex('1')
      await refreshCourseDetail()
      setMessage({
        type: 'success',
        text: 'Ders basariyla eklendi.',
      })
    } catch (createError: unknown) {
      const resolvedError = extractErrorMessage(createError, 'Ders eklenirken bir sorun olustu.')
      setMessage({
        type: 'error',
        text: resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setCreatingLesson(false)
    }
  }

  const handleUpdateLessonField = (lessonId: string, field: keyof LessonDraftState, value: string | boolean) => {
    setLessonDraftsById((current) => {
      const previous = current[lessonId]

      if (!previous) {
        return current
      }

      return {
        ...current,
        [lessonId]: {
          ...previous,
          [field]: value,
        },
      }
    })
  }

  const handleUpdateLesson = async (lesson: InstructorCourseLesson) => {
    if (!courseId || updatingLessonId === lesson.id) {
      return
    }

    const draft = lessonDraftsById[lesson.id] ?? toLessonDraft(lesson)
    const title = draft.title.trim()
    const summaryTitle = draft.summaryTitle.trim() || toSummaryTitle(title) || title
    const orderIndex = Number(draft.orderIndex)
    const duration = Number(draft.duration)

    if (!title) {
      setMessage({ type: 'error', text: 'Ders basligi zorunludur.' })
      return
    }

    if (!Number.isFinite(orderIndex) || orderIndex < 1) {
      setMessage({ type: 'error', text: 'Ders sirasi en az 1 olmalidir.' })
      return
    }

    if (!Number.isFinite(duration) || duration < 0) {
      setMessage({ type: 'error', text: 'Ders suresi 0 veya daha buyuk bir sayi olmalidir.' })
      return
    }

    setUpdatingLessonId(lesson.id)
    setMessage(null)

    try {
      await instructorCourseService.updateLesson(courseId, lesson.id, {
        title,
        summaryTitle,
        videoUrl: lesson.videoUrl,
        duration,
        orderIndex,
        completed: draft.completed,
      })

      await refreshCourseDetail()
      setExpandedLessonId(null)
      setMessage({
        type: 'success',
        text: `"${title}" dersi guncellendi.`,
      })
    } catch (updateError: unknown) {
      const resolvedError = extractErrorMessage(updateError, 'Ders guncellenirken bir sorun olustu.')
      setMessage({
        type: 'error',
        text: resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setUpdatingLessonId(null)
    }
  }

  const handleDeleteLesson = async (lesson: InstructorCourseLesson) => {
    if (!courseId || deletingLessonId === lesson.id) {
      return
    }

    const confirmed = window.confirm('Bu dersi silmek istedigine emin misin? Derse ait video da silinir.')

    if (!confirmed) {
      return
    }

    setDeletingLessonId(lesson.id)
    setMessage(null)

    try {
      await instructorCourseService.deleteLesson(courseId, lesson.id)
      clearPreviewStateForLesson(lesson.id)
      setSelectedFilesByLesson((current) => {
        const next = { ...current }
        delete next[lesson.id]
        return next
      })
      setUploadProgressByLesson((current) => {
        const next = { ...current }
        delete next[lesson.id]
        return next
      })
      setLessonDraftsById((current) => {
        const next = { ...current }
        delete next[lesson.id]
        return next
      })
      await refreshCourseDetail()
      setExpandedLessonId(null)
      setMessage({
        type: 'success',
        text: 'Ders basariyla silindi.',
      })
    } catch (deleteError: unknown) {
      const resolvedError = extractErrorMessage(deleteError, 'Ders silinirken bir sorun olustu.')
      setMessage({
        type: 'error',
        text: resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setDeletingLessonId(null)
    }
  }

  const handlePublishCourse = async () => {
    if (!courseId || publishingCourse) {
      return
    }

    setPublishingCourse(true)
    setMessage(null)

    try {
      await instructorCourseService.publishCourse(courseId)
      await refreshCourseDetail()
      setMessage({
        type: 'success',
        text: 'Kurs yayina alindi.',
      })
    } catch (publishError: unknown) {
      const resolvedError = extractErrorMessage(
        publishError,
        'Kurs yayinlanirken bir sorun olustu.',
      )
      setMessage({
        type: 'error',
        text: resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setPublishingCourse(false)
    }
  }

  const handleUnpublishCourse = async () => {
    if (!courseId || unpublishingCourse) {
      return
    }

    setUnpublishingCourse(true)
    setMessage(null)

    try {
      await instructorCourseService.unpublishCourse(courseId)
      await refreshCourseDetail()
      setIsUnpublishConfirmOpen(false)
      setMessage({
        type: 'success',
        text: 'Kurs yayindan kaldirildi.',
      })
    } catch (unpublishError: unknown) {
      const resolvedError = extractErrorMessage(
        unpublishError,
        'Kurs yayindan kaldirilirken bir sorun olustu.',
      )
      setMessage({
        type: 'error',
        text: resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setUnpublishingCourse(false)
    }
  }

  const handleUpload = async (lesson: InstructorCourseLesson) => {
    if (!courseId) {
      return
    }

    if (activeUploadLessonId === lesson.id) {
      return
    }

    const selectedFile = selectedFilesByLesson[lesson.id]

    if (!selectedFile) {
      setMessage({
        type: 'error',
        text: 'Lutfen once bir video dosyasi secin.',
      })
      return
    }

    const validationMessage = validateSelectedFile(selectedFile)

    if (validationMessage) {
      setMessage({
        type: 'error',
        text: validationMessage,
      })
      return
    }

    setMessage(null)
    setActiveUploadLessonId(lesson.id)
    setUploadProgressByLesson((current) => ({
      ...current,
      [lesson.id]: 0,
    }))

    try {
      await instructorCourseService.uploadLessonVideo(
        courseId,
        lesson.id,
        selectedFile,
        (progressEvent) => {
          const total = progressEvent.total ?? selectedFile.size
          const progress = Math.max(0, Math.min(100, Math.round((progressEvent.loaded * 100) / Math.max(total, 1))))
          setUploadProgressByLesson((current) => ({
            ...current,
            [lesson.id]: progress,
          }))
        },
      )

      await refreshCourseDetail()
      setSelectedFilesByLesson((current) => ({
        ...current,
        [lesson.id]: null,
      }))
      setExpandedLessonId(null)
      setMessage({
        type: 'success',
        text: 'Video basariyla yuklendi.',
      })
    } catch (uploadError: unknown) {
      const resolvedError = extractErrorMessage(uploadError, 'Video yuklenirken bir sorun olustu.')
      setMessage({
        type: 'error',
        text: resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setActiveUploadLessonId(null)
    }
  }

  const handleDeleteVideo = async (lesson: InstructorCourseLesson) => {
    if (!courseId) {
      return
    }

    const confirmed = window.confirm('Bu videoyu silmek istedigine emin misin?')

    if (!confirmed) {
      return
    }

    setMessage(null)
    setActiveUploadLessonId(lesson.id)

    try {
      await instructorCourseService.deleteLessonVideo(courseId, lesson.id)
      clearPreviewStateForLesson(lesson.id)
      await refreshCourseDetail()
      setExpandedLessonId(null)
      setMessage({
        type: 'success',
        text: 'Video basariyla silindi.',
      })
    } catch (deleteError: unknown) {
      const resolvedError = extractErrorMessage(deleteError, 'Video silinirken bir sorun olustu.')
      setMessage({
        type: 'error',
        text: resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setActiveUploadLessonId(null)
    }
  }

  const handleTogglePreview = async (lesson: InstructorCourseLesson) => {
    if (!courseId || !lesson.videoUrl) {
      return
    }

    const isAlreadyOpen = Boolean(openPreviewByLesson[lesson.id])

    if (isAlreadyOpen) {
      setOpenPreviewByLesson((current) => ({
        ...current,
        [lesson.id]: false,
      }))
      return
    }

    setOpenPreviewByLesson((current) => ({
      ...current,
      [lesson.id]: true,
    }))

    if (previewUrlsByLesson[lesson.id] || previewLoadingByLesson[lesson.id]) {
      return
    }

    setPreviewErrorsByLesson((current) => ({
      ...current,
      [lesson.id]: null,
    }))
    setPreviewLoadingByLesson((current) => ({
      ...current,
      [lesson.id]: true,
    }))

    try {
      const { url } = await instructorCourseService.getLessonPlaybackUrl(courseId, lesson.id)
      setPreviewUrlsByLesson((current) => ({
        ...current,
        [lesson.id]: url,
      }))
    } catch (previewError: unknown) {
      const resolvedError = extractErrorMessage(previewError, 'Video onizlemesi yuklenemedi.')
      setPreviewErrorsByLesson((current) => ({
        ...current,
        [lesson.id]: resolvedError.text,
      }))
    } finally {
      setPreviewLoadingByLesson((current) => ({
        ...current,
        [lesson.id]: false,
      }))
    }
  }

  if (!courseId) {
    return (
      <Card>
        <p className="text-sm text-[color:var(--danger)]">Gecerli bir kurs kimligi bulunamadi.</p>
      </Card>
    )
  }

  if (courseId.includes('{') || courseId.includes('}')) {
    return (
      <Card>
        <p className="text-sm text-[color:var(--danger)]">
          URL hatali gorunuyor. `{`'{id}'`}` yerine gercek courseId kullanilmali.
        </p>
      </Card>
    )
  }

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !courseDetail) {
    return <Loader label="Kurs detaylari yukleniyor..." />
  }

  const isPublished = courseDetail.status === 'PUBLISHED'
  const lessons = [...courseDetail.lessons].sort((left, right) => left.orderIndex - right.orderIndex)
  const totalLessons = lessons.length
  const lessonsWithVideo = lessons.filter((lesson) => Boolean(lesson.videoUrl)).length
  const completedLessons = lessons.filter((lesson) => lesson.completed).length
  const missingVideoLessons = totalLessons - lessonsWithVideo
  const completionRate = totalLessons === 0 ? 0 : Math.round((completedLessons * 100) / totalLessons)
  const videoCoverageRate = totalLessons === 0 ? 0 : Math.round((lessonsWithVideo * 100) / totalLessons)
  const categoryOptions = [
    ...courseCategories,
    ...courseForm.categoryIds
      .filter((categoryId) => !courseCategories.some((item) => item.id === categoryId))
      .map((categoryId) => ({
        id: categoryId,
        categoryName: `Mevcut degil: ${categoryId}`,
      })),
  ]
  const levelOptions = [
    ...courseLevels,
    ...(
      courseForm.levelId && !courseLevels.some((item) => item.id === courseForm.levelId)
        ? [{ id: courseForm.levelId, levelName: `Mevcut degil: ${courseForm.levelId}` }]
        : []
    ),
  ]
  const selectedCategoryLabels = courseDetail.categoryIds
    .map((categoryId) => courseCategories.find((item) => item.id === categoryId)?.categoryName ?? categoryId)
    .filter(Boolean)
  const selectedLevelLabel = courseDetail.level.levelName
  const hasDraftGaps = totalLessons === 0 || missingVideoLessons > 0
  const fallbackCourseImageUrl = resolveServiceUrl(API_ENDPOINTS.courses.image.public(courseDetail.id))
  const courseImageDisplayUrl = courseImagePreviewUrl ?? courseDetail.imageUrl ?? fallbackCourseImageUrl

  return (
    <div className="space-y-7">
      <PageHeader
        description="Akisi adim adim takip ederek kurs ayarlarini, ders planini ve video yayinini tek yerden yonet."
        eyebrow="Ders ve video yonetimi"
        title={`${courseDetail.title} - Ders yonetimi`}
      />

      <Card className="border-[color:var(--border-strong)] bg-[color:var(--surface-strong)]">
        <SectionHeader
          description="Ilk bakista kursun yayin hazirligini gor."
          title="Yonetim ozeti"
        />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-center">
            <p className="theme-subtle text-xs uppercase tracking-[0.12em]">Yayin durumu</p>
            <div className="mt-2 flex flex-col items-center gap-2">
              <p className="theme-heading text-lg font-semibold">{isPublished ? 'Yayinda' : 'Taslak'}</p>
              <InfoBadge tone={isPublished ? 'success' : 'warning'}>
                {isPublished ? 'Aktif' : 'Yayin bekliyor'}
              </InfoBadge>
            </div>
          </div>
          <div className="rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-center">
            <p className="theme-subtle text-xs uppercase tracking-[0.12em]">Ders tamamlama</p>
            <p className="theme-heading mt-2 text-lg font-semibold">%{completionRate}</p>
            <p className="theme-muted mt-1 text-sm">{completedLessons} / {totalLessons} ders tamamlandi</p>
          </div>
          <div className="rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-center">
            <p className="theme-subtle text-xs uppercase tracking-[0.12em]">Video kapsami</p>
            <p className="theme-heading mt-2 text-lg font-semibold">%{videoCoverageRate}</p>
            <p className="theme-muted mt-1 text-sm">{lessonsWithVideo} / {totalLessons} derste video var</p>
          </div>
        </div>
        <div className="mt-4 rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-center">
          <p className="theme-text text-sm">
            {hasDraftGaps
              ? 'Sonraki adim: Eksik ders veya video alanlarini tamamlayip kursu yayina alin.'
              : 'Kurs yapisi hazir gorunuyor. Dilersen yayina alip ogrenci erisimini acabilirsin.'}
          </p>
        </div>
      </Card>

      <Card className="border-l-4 border-l-[color:var(--primary)]" id="course-status">
        <SectionHeader
          description="Yayin acma veya yayindan kaldirma islemlerini buradan guvenli sekilde yonet."
          title="1. Kurs durumu"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <InfoBadge tone={isPublished ? 'success' : 'warning'}>
              {isPublished ? 'Yayinda' : 'Taslak'}
            </InfoBadge>
            <p className="theme-muted text-sm">Toplam ders: {totalLessons}</p>
            {missingVideoLessons > 0 ? (
              <InfoBadge tone="warning">{missingVideoLessons} derste video eksik</InfoBadge>
            ) : (
              <InfoBadge tone="success">Tum derslerde video hazir</InfoBadge>
            )}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {isPublished ? (
              <Button
                className="border-[color:var(--border)] hover:border-[color:var(--border-strong)]"
                disabled={unpublishingCourse}
                onClick={() => setIsUnpublishConfirmOpen(true)}
                variant="ghost"
              >
                {unpublishingCourse ? 'Kaldiriliyor...' : 'Kursu yayindan kaldir'}
              </Button>
            ) : (
              <Button
                disabled={publishingCourse}
                onClick={() => void handlePublishCourse()}
                variant="secondary"
              >
                {publishingCourse ? 'Yayinlaniyor...' : 'Kursu yayina al'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-[color:var(--border-strong)]" id="course-info">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader
            description="Baslik, aciklama, fiyat, kategori ve ogrenim ciktisi gibi temel bilgileri duzenle."
            title="2. Kurs bilgileri"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setIsCourseEditOpen((current) => !current)}
              type="button"
              variant="secondary"
            >
              {isCourseEditOpen ? 'Guncellemeyi kapat' : 'Guncelle'}
            </Button>
            <Button
              className="border-[color:var(--border)] hover:border-[color:var(--border-strong)]"
              disabled={deletingCourse}
              onClick={() => void handleDeleteCourse()}
              type="button"
              variant="ghost"
            >
              {deletingCourse ? 'Kurs siliniyor...' : 'Kursu sil'}
            </Button>
          </div>
        </div>

        {isCourseEditOpen ? (
          <div className="mt-4 space-y-4 border-t border-[color:var(--border)] pt-4">
            <label className="flex flex-col gap-1">
              <span className="theme-subtle text-xs">Kurs basligi</span>
              <input
                aria-invalid={Boolean(courseFormErrors.title)}
                className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                onChange={(event) => handleCourseFieldChange('title', event.target.value)}
                value={courseForm.title}
              />
              {courseFormErrors.title ? <span className="text-xs text-[color:var(--danger)]">{courseFormErrors.title}</span> : null}
            </label>

            <label className="flex flex-col gap-1">
              <span className="theme-subtle text-xs">Kurs aciklamasi</span>
              <textarea
                aria-invalid={Boolean(courseFormErrors.description)}
                className="theme-text theme-placeholder min-h-[84px] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                onChange={(event) => handleCourseFieldChange('description', event.target.value)}
                value={courseForm.description}
              />
              {courseFormErrors.description ? <span className="text-xs text-[color:var(--danger)]">{courseFormErrors.description}</span> : null}
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="theme-subtle text-xs">Fiyat</span>
                <input
                  aria-invalid={Boolean(courseFormErrors.price)}
                  className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                  min={0}
                  onChange={(event) => handleCourseFieldChange('price', event.target.value)}
                  step="0.01"
                  type="number"
                  value={courseForm.price}
                />
                {courseFormErrors.price ? <span className="text-xs text-[color:var(--danger)]">{courseFormErrors.price}</span> : null}
              </label>
              <CourseLevelSelector
                emptyStateText="Secim icin uygun seviye bulunamadi."
                errorMessage={courseFormErrors.levelId}
                hasLoadError={Boolean(levelsError)}
                helperText="Kurs seviyesi secimi zorunludur."
                label="Seviye"
                levels={levelOptions}
                loadFailedText="Seviye listesi alinamadi."
                loading={levelsLoading}
                loadingText="Seviyeler yukleniyor..."
                onChange={handleLevelIdChange}
                onRetry={() => void refetchLevels()}
                placeholder="Seviye secin"
                retryLabel="Tekrar yukle"
                selectedId={courseForm.levelId}
              />
            </div>
            <div>
              <CourseCategorySelector
                categories={categoryOptions}
                clearLabel="Secimi temizle"
                emptyStateText="Secim icin uygun kategori bulunamadi."
                errorMessage={courseFormErrors.categoryIds}
                hasLoadError={Boolean(categoriesError)}
                helperText={`En az ${MIN_CATEGORY_COUNT}, en fazla ${MAX_CATEGORY_COUNT} kategori sec.`}
                label="Kategoriler"
                loadFailedText="Kategori listesi alinamadi."
                loading={categoriesLoading}
                loadingText="Kategoriler yukleniyor..."
                onChange={handleCategoryIdsChange}
                onRetry={() => void refetchCategories()}
                retryLabel="Tekrar yukle"
                selectedIds={courseForm.categoryIds}
                selectedSummary={`Secilen: ${courseForm.categoryIds.length}/${MAX_CATEGORY_COUNT}`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="theme-subtle text-xs">Kurs gorseli (opsiyonel)</span>
                  {selectedCourseImageFile ? (
                    <Button
                      onClick={() => handleCourseImageChange(null)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Secimi temizle
                    </Button>
                  ) : null}
                </div>
                <input
                  accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
                  className="theme-text file:theme-text h-11 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-[var(--radius-navigation)] file:border file:border-[color:var(--border)] file:bg-[color:var(--surface-soft)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:hover:bg-[color:var(--surface-hover)]"
                  onChange={(event) => handleCourseImageChange(event.target.files?.[0] ?? null)}
                  type="file"
                />
                <span className="theme-subtle text-xs">
                  Gorsel secmezsen mevcut kurs gorseli korunur.
                </span>
                {courseFormErrors.image ? <span className="text-xs text-[color:var(--danger)]">{courseFormErrors.image}</span> : null}
              </div>

              <div className="space-y-3 rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="theme-text text-sm font-medium">Kurs karti onizlemesi</span>
                  <span className="theme-subtle text-xs">{selectedCourseImageFile?.name ?? 'Mevcut gorsel'}</span>
                </div>
                <div className="overflow-hidden rounded-[var(--radius-navigation)] border border-[color:var(--border)]">
                  {courseImageDisplayUrl ? (
                    <img
                      alt="Kurs gorseli onizlemesi"
                      className="h-44 w-full object-cover"
                      onError={(event) => {
                        const target = event.currentTarget

                        if (target.dataset.fallbackApplied === 'true') {
                          return
                        }

                        target.dataset.fallbackApplied = 'true'
                        target.src = fallbackCourseImageUrl
                      }}
                      src={courseImageDisplayUrl}
                    />
                  ) : (
                    <div className="flex h-44 w-full flex-col items-center justify-center gap-2 bg-[color:var(--surface-strong)] text-center">
                      <ImageIcon aria-hidden className="h-6 w-6 text-[color:var(--text-muted)]" />
                      <p className="theme-subtle text-xs">Kurs gorseli bulunamadi</p>
                    </div>
                  )}
                </div>
                <p className="text-clamp-2 theme-heading text-sm font-semibold">
                  {courseForm.title.trim() || 'Kurs basligi'}
                </p>
                <span className="theme-subtle block text-xs">Gorselin kurs kartinda kirpilmis gorunumu.</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="theme-subtle text-xs">Ogrenim ciktisi (4 adet)</p>
              <div className="grid gap-3 md:grid-cols-2">
                {courseForm.learningOutcomes.map((item, index) => (
                  <input
                    className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                    key={`learning-outcome-${index + 1}`}
                    onChange={(event) => handleLearningOutcomeChange(index, event.target.value)}
                    placeholder={`Ogrenim ciktisi ${index + 1}`}
                    value={item}
                  />
                ))}
              </div>
              {courseFormErrors.learningOutcomes ? <span className="text-xs text-[color:var(--danger)]">{courseFormErrors.learningOutcomes}</span> : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="theme-subtle text-xs">Etiketler (maks {MAX_TAG_COUNT})</p>
                <Button
                  disabled={courseForm.tags.length >= MAX_TAG_COUNT}
                  onClick={handleAddTagField}
                  type="button"
                  variant="secondary"
                >
                  Etiket ekle
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {courseForm.tags.map((item, index) => (
                  <div className="flex items-center gap-2" key={`tag-${index + 1}`}>
                    <input
                      className="theme-text h-10 w-full rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                      onChange={(event) => handleTagChange(index, event.target.value)}
                      placeholder={`Etiket ${index + 1}`}
                      value={item}
                    />
                    <Button
                      className="border-[color:var(--border)] hover:border-[color:var(--border-strong)]"
                      onClick={() => handleRemoveTagField(index)}
                      type="button"
                      variant="ghost"
                    >
                      Sil
                    </Button>
                  </div>
                ))}
              </div>
              {courseFormErrors.tags ? <span className="text-xs text-[color:var(--danger)]">{courseFormErrors.tags}</span> : null}
            </div>

            <div className="flex justify-end border-t border-[color:var(--border)] pt-4">
              <Button
                disabled={savingCourse}
                onClick={() => void handleSaveCourse()}
                type="button"
                variant="secondary"
              >
                {savingCourse ? 'Kaydediliyor...' : 'Kursu guncelle'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 border-t border-[color:var(--border)] pt-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">
              <p className="theme-subtle text-xs">Baslik</p>
              <p className="theme-heading mt-1 line-clamp-2 text-sm font-medium">{courseDetail.title}</p>
            </div>
            <div className="border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">
              <p className="theme-subtle text-xs">Seviye</p>
              <p className="theme-heading mt-1 text-sm font-medium">{selectedLevelLabel}</p>
            </div>
            <div className="border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">
              <p className="theme-subtle text-xs">Kategoriler</p>
              {selectedCategoryLabels.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {selectedCategoryLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-2 py-0.5 text-xs font-medium theme-heading"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="theme-subtle mt-1 text-sm">Kategori secilmedi</p>
              )}
            </div>
            <div className="border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">
              <p className="theme-subtle text-xs">Fiyat</p>
              <p className="theme-heading mt-1 text-sm font-medium">{courseDetail.price.toFixed(2)}</p>
            </div>
            <div className="border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">
              <p className="theme-subtle text-xs">Etiket sayisi</p>
              <p className="theme-heading mt-1 text-sm font-medium">{courseDetail.tags.length}</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="border-l-4 border-l-[color:var(--warning)]" id="add-lesson">
        <SectionHeader description="Yeni dersleri duzenli bir sira ile ekleyip kurs akisina dahil et." title="3. Ders ekle" />
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="theme-subtle text-xs">Ders basligi</span>
              <input
                className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                onChange={(event) => setNewLessonTitle(event.target.value)}
                placeholder="Ornek: React giris dersi"
                value={newLessonTitle}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="theme-subtle text-xs">Sira</span>
              <input
                className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                min={1}
                onChange={(event) => setNewLessonOrderIndex(event.target.value)}
                type="number"
                value={newLessonOrderIndex}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="theme-subtle text-xs">Ders aciklamasi (opsiyonel)</span>
            <textarea
              className="theme-text theme-placeholder min-h-[84px] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
              onChange={(event) => setNewLessonDescription(event.target.value)}
              placeholder="Dersin icerigini kisa sekilde yazabilirsin."
              value={newLessonDescription}
            />
          </label>
          <div className="flex justify-end">
            <Button
              disabled={creatingLesson}
              onClick={() => void handleCreateLesson()}
              type="button"
              variant="secondary"
            >
              {creatingLesson ? 'Ekleniyor...' : 'Ders ekle'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-[color:var(--success)]" id="lesson-list">
        <SectionHeader
          description="Her ders kartindan bilgileri guncelle, video yukle, onizle veya gerekirse sil."
          title="4. Dersler ve video islemleri"
        />
        <div className="mt-4 space-y-4">
          {lessons.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-soft)] px-4 py-6 text-center">
              <p className="theme-heading text-base font-semibold">Bu kurs icin henuz ders eklenmemis.</p>
              <p className="theme-muted mt-2 text-sm">Once "Ders ekle" bolumunden ilk dersi olusturarak devam edebilirsin.</p>
            </div>
          ) : lessons.map((lesson) => {
            const hasVideo = Boolean(lesson.videoUrl)
            const isUploading = activeUploadLessonId === lesson.id
            const isUpdating = updatingLessonId === lesson.id
            const isDeletingLesson = deletingLessonId === lesson.id
            const uploadProgress = uploadProgressByLesson[lesson.id] ?? 0
            const draft = lessonDraftsById[lesson.id] ?? toLessonDraft(lesson)
            const isExpanded = expandedLessonId === lesson.id
            const statusText = isUploading
              ? `Yukleniyor... %${uploadProgress}`
              : hasVideo
                ? 'Video yuklendi'
                : 'Video yuklenmedi'

            return (
              <div
                className={`rounded-lg border bg-[color:var(--surface-soft)] transition hover:border-[color:var(--border-strong)] ${
                  isExpanded
                    ? 'border-[color:var(--primary)] shadow-[0_0_0_2px_var(--focus-ring)]'
                    : 'border-[color:var(--border)]'
                }`}
                key={lesson.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="theme-subtle text-xs uppercase tracking-[0.12em]">Ders #{lesson.orderIndex}</p>
                    <p className="theme-heading truncate text-sm font-semibold">{lesson.title}</p>
                    <p className="theme-muted mt-1 text-xs">
                      Sure: {lesson.duration ?? 0} sn | {lesson.completed ? 'Tamamlandi' : 'Devam ediyor'}
                    </p>
                  </div>
                  <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <InfoBadge tone={hasVideo ? 'success' : 'warning'}>{statusText}</InfoBadge>
                    <InfoBadge tone={lesson.completed ? 'success' : 'warning'}>
                      {lesson.completed ? 'Tamamlandi' : 'Tamamlanmadi'}
                    </InfoBadge>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => setExpandedLessonId((current) => (current === lesson.id ? null : lesson.id))}
                      aria-expanded={isExpanded}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {isExpanded ? 'Duzenlemeyi kapat' : 'Duzenle ve video yonet'}
                    </Button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="space-y-4 border-t border-[color:var(--border)] px-4 py-4">
                    <div className="space-y-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                      <p className="theme-subtle text-xs uppercase tracking-[0.12em]">Ders bilgilerini guncelle</p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1">
                          <span className="theme-subtle text-xs">Ders basligi</span>
                          <input
                            className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                            onChange={(event) => handleUpdateLessonField(lesson.id, 'title', event.target.value)}
                            value={draft.title}
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="theme-subtle text-xs">Summary title</span>
                          <input
                            className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                            onChange={(event) => handleUpdateLessonField(lesson.id, 'summaryTitle', event.target.value)}
                            value={draft.summaryTitle}
                          />
                        </label>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <label className="flex flex-col gap-1">
                          <span className="theme-subtle text-xs">Sira</span>
                          <input
                            className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                            min={1}
                            onChange={(event) => handleUpdateLessonField(lesson.id, 'orderIndex', event.target.value)}
                            type="number"
                            value={draft.orderIndex}
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="theme-subtle text-xs">Sure (sn)</span>
                          <input
                            className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                            min={0}
                            onChange={(event) => handleUpdateLessonField(lesson.id, 'duration', event.target.value)}
                            type="number"
                            value={draft.duration}
                          />
                        </label>
                        <label className="flex items-center gap-2 self-end pb-2">
                          <input
                            checked={draft.completed}
                            onChange={(event) => handleUpdateLessonField(lesson.id, 'completed', event.target.checked)}
                            type="checkbox"
                          />
                          <span className="theme-subtle text-xs">Tamamlandi</span>
                        </label>
                      </div>

                      <div className="flex flex-wrap justify-end gap-3 border-t border-[color:var(--border)] pt-4">
                        <Button
                          className="w-full border-[color:var(--border)] hover:border-[color:var(--border-strong)] sm:w-auto"
                          disabled={isDeletingLesson}
                          onClick={() => void handleDeleteLesson(lesson)}
                          type="button"
                          variant="ghost"
                        >
                          {isDeletingLesson ? 'Ders siliniyor...' : 'Dersi sil'}
                        </Button>
                        <Button
                          className="w-full sm:w-auto"
                          disabled={isUpdating}
                          onClick={() => void handleUpdateLesson(lesson)}
                          type="button"
                          variant="secondary"
                        >
                          {isUpdating ? 'Guncelleniyor...' : 'Dersi guncelle'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
                      <p className="theme-subtle text-xs uppercase tracking-[0.12em]">Video islemleri</p>
                      <LessonVideoActions
                        hasVideo={hasVideo}
                        isUploading={isUploading}
                        lessonId={lesson.id}
                        onDelete={() => void handleDeleteVideo(lesson)}
                        onSelectFile={(file) => handleFileSelection(lesson.id, file)}
                        onTogglePreview={() => void handleTogglePreview(lesson)}
                        onUpload={() => void handleUpload(lesson)}
                        previewError={previewErrorsByLesson[lesson.id]}
                        previewLoading={Boolean(previewLoadingByLesson[lesson.id])}
                        previewOpen={Boolean(openPreviewByLesson[lesson.id])}
                        previewSrc={previewUrlsByLesson[lesson.id]}
                        selectedFile={selectedFilesByLesson[lesson.id] ?? null}
                        uploadProgress={uploadProgress}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </Card>

      <Modal
        description="Bu islem kursu taslak durumuna alir. Ogrenciler kursa yeni kayit yapamaz."
        onClose={() => {
          if (unpublishingCourse) {
            return
          }

          setIsUnpublishConfirmOpen(false)
        }}
        open={isUnpublishConfirmOpen}
        title="Kursu yayindan kaldir?"
      >
        <div className="space-y-4">
          <div className="rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3">
            <p className="theme-text text-sm">
              Kursu tekrar yayinlamak istersen panelden yeniden yayina alabilirsin.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              className="border-[color:var(--border)] hover:border-[color:var(--border-strong)]"
              disabled={unpublishingCourse}
              onClick={() => setIsUnpublishConfirmOpen(false)}
              variant="ghost"
            >
              Vazgec
            </Button>
            <Button
              className="border-[color:var(--danger)] bg-[color:var(--danger)] text-white hover:border-[color:var(--danger)] hover:bg-[color:var(--danger)] hover:opacity-90"
              disabled={unpublishingCourse}
              onClick={() => void handleUnpublishCourse()}
              variant="primary"
            >
              {unpublishingCourse ? 'Kaldiriliyor...' : 'Yayindan kaldir'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default InstructorCourseVideoUploadPage
