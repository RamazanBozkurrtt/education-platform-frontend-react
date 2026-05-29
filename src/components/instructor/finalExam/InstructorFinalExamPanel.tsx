import { Image as ImageIcon, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import {
  useCreateOrUpdateFinalExam,
  useCreateQuestion,
  useDeleteFinalExam,
  useDeleteQuestion,
  useDeleteQuestionImage,
  useFinalExamManage,
  useUpdateQuestion,
  useUploadQuestionImage,
} from '../../../hooks/useFinalExam'
import { normalizeApiError } from '../../../shared/errors/normalizeApiError'
import { emitAppToast } from '../../../shared/notifications/appToast'
import type { ExamQuestion } from '../../../types/finalExam'
import { useLanguage } from '../../../hooks/useLanguage'
import Button from '../../ui/Button'
import Card from '../../ui/Card'
import Loader from '../../ui/Loader'
import Modal from '../../ui/Modal'
import QueryErrorState from '../../ui/QueryErrorState'
import SectionHeader from '../../ui/SectionHeader'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpg', 'image/jpeg', 'image/webp'])
const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

const isAllowedImage = (file: File) => {
  if (ALLOWED_IMAGE_TYPES.has(file.type)) {
    return true
  }

  const normalizedName = file.name.toLocaleLowerCase('en-US')
  return ALLOWED_IMAGE_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
}

const getExamSchema = (isTurkish: boolean) => z.object({
  title: z.string().trim().min(1, isTurkish ? 'Sinav basligi zorunludur.' : 'Exam title is required.'),
  description: z.string().trim().max(4000, isTurkish ? 'Sinav aciklamasi cok uzun.' : 'Exam description is too long.'),
  passingScore: z.coerce.number().min(0, isTurkish ? 'Gecme puani en az 0 olmalidir.' : 'Passing score must be at least 0.').max(100, isTurkish ? 'Gecme puani en fazla 100 olabilir.' : 'Passing score can be at most 100.'),
  questionCount: z.coerce.number().int().min(1, isTurkish ? 'Soru sayisi en az 1 olmalidir.' : 'Question count must be at least 1.').max(200, isTurkish ? 'Soru sayisi en fazla 200 olabilir.' : 'Question count can be at most 200.'),
  durationMinutes: z.coerce.number().int().min(1, isTurkish ? 'Sure en az 1 dakika olmalidir.' : 'Duration must be at least 1 minute.').max(600, isTurkish ? 'Sure en fazla 600 dakika olabilir.' : 'Duration can be at most 600 minutes.'),
  maxAttempts: z.coerce.number().int().min(1, isTurkish ? 'Maksimum deneme hakki en az 1 olmalidir.' : 'Maximum attempt limit must be at least 1.').max(20, isTurkish ? 'Maksimum deneme hakki en fazla 20 olabilir.' : 'Maximum attempt limit can be at most 20.'),
  availabilityDays: z.coerce.number().int().min(1, isTurkish ? 'Erisim gunu en az 1 olmalidir.' : 'Availability days must be at least 1.').max(365, isTurkish ? 'Erisim gunu en fazla 365 olabilir.' : 'Availability days can be at most 365.'),
  active: z.boolean(),
})

const getQuestionSchema = (isTurkish: boolean) => z.object({
  questionText: z.string().trim().min(1, isTurkish ? 'Soru metni zorunludur.' : 'Question text is required.'),
  options: z.array(
    z.object({
      id: z.string().optional(),
      text: z.string().trim().min(1, isTurkish ? 'Secenek metni bos olamaz.' : 'Option text cannot be empty.'),
      orderIndex: z.number().int().min(0),
    }),
  ).min(2, isTurkish ? 'En az 2 secenek olmalidir.' : 'At least 2 options are required.'),
  correctOptionId: z.string().trim().min(1, isTurkish ? 'Dogru cevabi secmelisiniz.' : 'You must select the correct answer.'),
  orderIndex: z.coerce.number().int().min(0, isTurkish ? 'Soru sirasi en az 0 olmalidir.' : 'Question order must be at least 0.'),
}).superRefine((value, ctx) => {
  const hasMatchingOption = value.options.some((option) => option.id === value.correctOptionId)

  if (!hasMatchingOption) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: isTurkish ? 'Dogru cevap gecerli bir secenek olmalidir.' : 'Correct answer must be a valid option.',
      path: ['correctOptionId'],
    })
  }
})

type ExamFormState = z.infer<ReturnType<typeof getExamSchema>>
type QuestionOptionFormState = {
  id?: string
  text: string
  orderIndex: number
}
type QuestionFormState = {
  questionText: string
  options: QuestionOptionFormState[]
  correctOptionId: string
  orderIndex: number
}

interface InstructorFinalExamPanelProps {
  courseId: string
}

const INITIAL_EXAM_FORM: ExamFormState = {
  title: '',
  description: '',
  passingScore: 70,
  questionCount: 20,
  durationMinutes: 30,
  maxAttempts: 3,
  availabilityDays: 7,
  active: true,
}

const INITIAL_QUESTION_FORM = (questionOrder: number): QuestionFormState => ({
  questionText: '',
  options: [
    { text: '', orderIndex: 0 },
    { text: '', orderIndex: 1 },
  ],
  correctOptionId: '',
  orderIndex: questionOrder,
})

const toQuestionForm = (question: ExamQuestion): QuestionFormState => ({
  questionText: question.questionText,
  options: question.options.map((option, index) => ({
    id: option.id,
    text: option.text,
    orderIndex: index,
  })),
  correctOptionId: question.correctOptionId ?? question.options[0]?.id ?? '',
  orderIndex: question.orderIndex,
})

const getQuestionOptionClientId = (option: QuestionOptionFormState, index: number) =>
  option.id ?? `new-option-${index + 1}`

const InstructorFinalExamPanel = ({ courseId }: InstructorFinalExamPanelProps) => {
  const { language } = useLanguage()
  const isTurkish = language === 'tr'
  const txt = (turkishText: string, englishText: string) => (isTurkish ? turkishText : englishText)
  const examSchema = useMemo(() => getExamSchema(isTurkish), [isTurkish])
  const questionSchema = useMemo(() => getQuestionSchema(isTurkish), [isTurkish])
  const [examForm, setExamForm] = useState<ExamFormState>(INITIAL_EXAM_FORM)
  const [examFormErrors, setExamFormErrors] = useState<Partial<Record<keyof ExamFormState, string>>>({})
  const [questionModalOpen, setQuestionModalOpen] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(INITIAL_QUESTION_FORM(0))
  const [questionFormError, setQuestionFormError] = useState<string | null>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [selectedImageError, setSelectedImageError] = useState<string | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  const {
    data,
    error,
    isLoading,
  } = useFinalExamManage(courseId)
  const saveExamMutation = useCreateOrUpdateFinalExam(courseId)
  const deleteExamMutation = useDeleteFinalExam(courseId)
  const createQuestionMutation = useCreateQuestion(courseId)
  const updateQuestionMutation = useUpdateQuestion(courseId)
  const deleteQuestionMutation = useDeleteQuestion(courseId)
  const uploadQuestionImageMutation = useUploadQuestionImage(courseId)
  const deleteQuestionImageMutation = useDeleteQuestionImage(courseId)

  const manageError = error ? normalizeApiError(error) : null
  const canCreateExamFromEmptyState = manageError?.httpStatus === 404
  const questions = canCreateExamFromEmptyState ? [] : (data?.questions ?? [])
  const exam = canCreateExamFromEmptyState ? null : (data?.exam ?? null)
  const editingQuestion = useMemo(
    () => questions.find((item) => item.id === editingQuestionId) ?? null,
    [editingQuestionId, questions],
  )

  useEffect(() => {
    if (!exam) {
      setExamForm((current) => ({ ...current, questionCount: Math.max(current.questionCount, questions.length || 1) }))
      return
    }

    setExamForm({
      title: exam.title,
      description: exam.description,
      passingScore: exam.passingScore,
      questionCount: Math.max(exam.questionCount, questions.length || 1),
      durationMinutes: exam.durationMinutes,
      maxAttempts: exam.maxAttempts,
      availabilityDays: exam.availabilityDays,
      active: exam.active,
    })
  }, [exam, questions.length])

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

  const updateExamField = <K extends keyof ExamFormState>(key: K, value: ExamFormState[K]) => {
    setExamForm((current) => ({ ...current, [key]: value }))
    setExamFormErrors((current) => {
      if (!current[key]) {
        return current
      }
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  const openCreateQuestionModal = () => {
    const maxQuestionCount = exam?.questionCount ?? examForm.questionCount
    if (questions.length >= maxQuestionCount) {
      setQuestionFormError(
        isTurkish
          ? `Soru limiti dolu. En fazla ${maxQuestionCount} soru ekleyebilirsiniz.`
          : `Question limit reached. You can add at most ${maxQuestionCount} questions.`,
      )
      return
    }

    setEditingQuestionId(null)
    setQuestionForm(INITIAL_QUESTION_FORM(questions.length))
    setSelectedImageFile(null)
    setSelectedImageError(null)
    setQuestionFormError(null)
    setQuestionModalOpen(true)
  }

  const openEditQuestionModal = (question: ExamQuestion) => {
    setEditingQuestionId(question.id)
    setQuestionForm(toQuestionForm(question))
    setSelectedImageFile(null)
    setSelectedImageError(null)
    setQuestionFormError(null)
    setQuestionModalOpen(true)
  }

  const handleSaveExam = async () => {
    const parseResult = examSchema.safeParse(examForm)
    if (!parseResult.success) {
      const nextErrors: Partial<Record<keyof ExamFormState, string>> = {}

      parseResult.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof ExamFormState
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message
        }
      })

      setExamFormErrors(nextErrors)
      return
    }

    if (questions.length > parseResult.data.questionCount) {
      setExamFormErrors((current) => ({
        ...current,
        questionCount: isTurkish
          ? `Soru sayisi ${questions.length} degerinden kucuk olamaz.`
          : `Question count cannot be less than ${questions.length}.`,
      }))
      return
    }

    try {
      await saveExamMutation.mutateAsync({
        mode: exam ? 'update' : 'create',
        values: parseResult.data,
      })

      emitAppToast({
        tone: 'success',
        message: exam ? txt('Final sinavi guncellendi.', 'Final exam updated.') : txt('Final sinavi olusturuldu.', 'Final exam created.'),
      })
    } catch (saveError) {
      emitAppToast({
        tone: 'error',
        message: normalizeApiError(saveError).message,
      })
    }
  }

  const handleDeleteExam = async () => {
    if (!window.confirm(txt('Final sinavi silmek istediginize emin misiniz?', 'Are you sure you want to delete the final exam?'))) {
      return
    }

    try {
      await deleteExamMutation.mutateAsync()
      emitAppToast({
        tone: 'success',
        message: txt('Final sinavi silindi.', 'Final exam deleted.'),
      })
    } catch (deleteError) {
      emitAppToast({
        tone: 'error',
        message: normalizeApiError(deleteError).message,
      })
    }
  }

  const handleQuestionImageChange = (file: File | null) => {
    if (!file) {
      setSelectedImageFile(null)
      setSelectedImageError(null)
      return
    }

    if (!isAllowedImage(file)) {
      setSelectedImageFile(null)
      setSelectedImageError(txt('Sadece PNG, JPG, JPEG ve WEBP dosyalari yuklenebilir.', 'Only PNG, JPG, JPEG, and WEBP files can be uploaded.'))
      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setSelectedImageFile(null)
      setSelectedImageError(txt('Gorsel boyutu en fazla 5 MB olabilir.', 'Image size can be at most 5 MB.'))
      return
    }

    setSelectedImageFile(file)
    setSelectedImageError(null)
  }

  const updateQuestionOption = (index: number, value: string) => {
    setQuestionForm((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => (
        optionIndex === index
          ? { ...option, text: value, orderIndex: optionIndex }
          : option
      )),
    }))
  }

  const handleAddOption = () => {
    setQuestionForm((current) => ({
      ...current,
      options: [...current.options, { text: '', orderIndex: current.options.length }],
    }))
  }

  const handleRemoveOption = (index: number) => {
    setQuestionForm((current) => {
      if (current.options.length <= 2) {
        return current
      }

      const nextOptions = current.options
        .filter((_, optionIndex) => optionIndex !== index)
        .map((option, optionIndex) => ({ ...option, orderIndex: optionIndex }))

      const selectedExists = nextOptions.some((option, optionIndex) =>
        getQuestionOptionClientId(option, optionIndex) === current.correctOptionId)
      const nextCorrectOptionId = selectedExists
        ? current.correctOptionId
        : (nextOptions[0] ? getQuestionOptionClientId(nextOptions[0], 0) : '')

      return {
        ...current,
        options: nextOptions,
        correctOptionId: nextCorrectOptionId,
      }
    })
  }

  const handleSaveQuestion = async () => {
    setQuestionFormError(null)
    const normalizedOptions = questionForm.options.map((option, index) => ({
      ...option,
      clientOptionId: getQuestionOptionClientId(option, index),
      text: option.text.trim(),
      orderIndex: index,
    }))
    const filledOptions = normalizedOptions.filter((option) => option.text.length > 0)
    const selectedFilledOption = filledOptions.find((option) => option.clientOptionId === questionForm.correctOptionId)
    const parseResult = questionSchema.safeParse({
      questionText: questionForm.questionText,
      options: filledOptions.map((option) => ({
        ...option,
        id: option.id ?? option.clientOptionId,
      })),
      correctOptionId: selectedFilledOption?.clientOptionId ?? '',
      orderIndex: questionForm.orderIndex,
    })

    if (!parseResult.success) {
      setQuestionFormError(parseResult.error.issues[0]?.message ?? txt('Lutfen soru formunu kontrol edin.', 'Please check the question form.'))
      return
    }

    if (!editingQuestionId && questions.length >= (exam?.questionCount ?? examForm.questionCount)) {
      setQuestionFormError(
        isTurkish
          ? `Soru limiti dolu. En fazla ${exam?.questionCount ?? examForm.questionCount} soru ekleyebilirsiniz.`
          : `Question limit reached. You can add at most ${exam?.questionCount ?? examForm.questionCount} questions.`,
      )
      return
    }

    const payload = {
      questionText: parseResult.data.questionText,
      orderIndex: parseResult.data.orderIndex,
      points: 1,
      active: true,
      options: parseResult.data.options.map((option, index) => ({
        optionText: option.text,
        isCorrect: option.id === parseResult.data.correctOptionId,
        orderIndex: index,
      })),
    }

    if (import.meta.env.DEV) {
      // Debug helper for contract checks in local development.
      // eslint-disable-next-line no-console
      console.log('final-exam add-question payload', JSON.stringify(payload, null, 2))
    }

    try {
      const response = editingQuestionId
        ? await updateQuestionMutation.mutateAsync({ questionId: editingQuestionId, values: payload })
        : await createQuestionMutation.mutateAsync(payload)

      const targetQuestionId = response?.id ?? editingQuestionId
      if (targetQuestionId && selectedImageFile) {
        await uploadQuestionImageMutation.mutateAsync({
          questionId: targetQuestionId,
          file: selectedImageFile,
          method: editingQuestion?.imageUrl ? 'PUT' : 'POST',
        })
      }

      emitAppToast({
        tone: 'success',
        message: editingQuestionId ? txt('Soru guncellendi.', 'Question updated.') : txt('Soru eklendi.', 'Question added.'),
      })
      setQuestionModalOpen(false)
    } catch (saveError) {
      setQuestionFormError(normalizeApiError(saveError).message)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm(txt('Bu soruyu silmek istediginize emin misiniz?', 'Are you sure you want to delete this question?'))) {
      return
    }

    try {
      await deleteQuestionMutation.mutateAsync(questionId)
      emitAppToast({
        tone: 'success',
        message: txt('Soru silindi.', 'Question deleted.'),
      })
    } catch (deleteError) {
      emitAppToast({
        tone: 'error',
        message: normalizeApiError(deleteError).message,
      })
    }
  }

  const handleDeleteQuestionImage = async (questionId: string) => {
    try {
      await deleteQuestionImageMutation.mutateAsync(questionId)
      emitAppToast({
        tone: 'success',
        message: txt('Soru gorseli kaldirildi.', 'Question image removed.'),
      })
    } catch (deleteError) {
      emitAppToast({
        tone: 'error',
        message: normalizeApiError(deleteError).message,
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-[color:var(--primary)]">
        <Loader label={txt('Final sinavi bilgileri yukleniyor...', 'Loading final exam details...')} />
      </Card>
    )
  }

  if (error && !canCreateExamFromEmptyState) {
    return (
      <Card className="border-l-4 border-l-[color:var(--danger)]">
        <QueryErrorState error={error} />
      </Card>
    )
  }

  return (
    <>
      <Card className="border-l-4 border-l-[color:var(--primary)]" id="final-exam">
        <SectionHeader
          description={txt('Kursun final sinavini olusturun, guncelleyin ve test sorularini yonetin.', 'Create, update, and manage the course final exam and test questions.')}
          title={txt('5. Final sinavi', '5. Final exam')}
        />

        {canCreateExamFromEmptyState ? (
          <div className="mt-4 rounded-md border border-[color:var(--border-strong)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm theme-muted">
            {txt(
              'Bu kurs icin final sinavi henuz bulunmuyor. Asagidaki alanlari doldurup kaydederek 5. adimi tamamlayabilirsiniz.',
              'No final exam exists for this course yet. Fill and save the fields below to complete step 5.',
            )}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="theme-subtle text-xs">{txt('Sinav basligi', 'Exam title')}</span>
            <input
              className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
              onChange={(event) => updateExamField('title', event.target.value)}
              value={examForm.title}
            />
            {examFormErrors.title ? <span className="text-xs text-[color:var(--danger)]">{examFormErrors.title}</span> : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="theme-subtle text-xs">{txt('Gecme puani', 'Passing score')}</span>
            <input
              className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
              min={1}
              max={100}
              onChange={(event) => updateExamField('passingScore', Number(event.target.value))}
              type="number"
              value={examForm.passingScore}
            />
            {examFormErrors.passingScore ? <span className="text-xs text-[color:var(--danger)]">{examFormErrors.passingScore}</span> : null}
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-1">
          <span className="theme-subtle text-xs">{txt('Aciklama', 'Description')}</span>
          <textarea
            className="theme-text min-h-[96px] rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
            onChange={(event) => updateExamField('description', event.target.value)}
            value={examForm.description}
          />
          {examFormErrors.description ? <span className="text-xs text-[color:var(--danger)]">{examFormErrors.description}</span> : null}
        </label>

        <div className="mt-4 grid gap-4 md:grid-cols-5">
          <label className="flex flex-col gap-1">
            <span className="theme-subtle text-xs">{txt('Soru sayisi', 'Question count')}</span>
            <input
              className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
              min={1}
              onChange={(event) => updateExamField('questionCount', Number(event.target.value))}
              type="number"
              value={examForm.questionCount}
            />
            {examFormErrors.questionCount ? <span className="text-xs text-[color:var(--danger)]">{examFormErrors.questionCount}</span> : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="theme-subtle text-xs">{txt('Sure (dakika)', 'Duration (minutes)')}</span>
            <input
              className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
              min={1}
              onChange={(event) => updateExamField('durationMinutes', Number(event.target.value))}
              type="number"
              value={examForm.durationMinutes}
            />
            {examFormErrors.durationMinutes ? <span className="text-xs text-[color:var(--danger)]">{examFormErrors.durationMinutes}</span> : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="theme-subtle text-xs">{txt('Maksimum deneme', 'Maximum attempts')}</span>
            <input
              className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
              min={1}
              onChange={(event) => updateExamField('maxAttempts', Number(event.target.value))}
              type="number"
              value={examForm.maxAttempts}
            />
            {examFormErrors.maxAttempts ? <span className="text-xs text-[color:var(--danger)]">{examFormErrors.maxAttempts}</span> : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="theme-subtle text-xs">{txt('Erisim gunu', 'Availability days')}</span>
            <input
              className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
              min={1}
              onChange={(event) => updateExamField('availabilityDays', Number(event.target.value))}
              type="number"
              value={examForm.availabilityDays}
            />
            {examFormErrors.availabilityDays ? <span className="text-xs text-[color:var(--danger)]">{examFormErrors.availabilityDays}</span> : null}
          </label>

          <div className="flex flex-col gap-2 pt-6">
            <span className="theme-subtle text-xs">{txt('Sinav durumu', 'Exam status')}</span>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => updateExamField('active', !examForm.active)}
                size="sm"
                type="button"
                variant={examForm.active ? 'ghost' : 'secondary'}
              >
                {examForm.active ? txt('Sinavi pasif yap', 'Deactivate exam') : txt('Sinavi aktif et', 'Activate exam')}
              </Button>
              <span className="theme-text text-sm">
                {txt('Durum', 'Status')}: {examForm.active ? txt('Aktif', 'Active') : txt('Pasif', 'Inactive')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] pt-4">
          <p className="theme-subtle text-xs">
            {txt('Toplam soru', 'Total questions')}: <strong className="theme-heading">{questions.length}</strong> / {exam?.questionCount ?? examForm.questionCount}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={saveExamMutation.isPending}
              onClick={() => {
                void handleSaveExam()
              }}
              type="button"
              variant="secondary"
            >
              <Save className="h-4 w-4" />
              {saveExamMutation.isPending ? txt('Kaydediliyor...', 'Saving...') : (exam ? txt('Sinavi guncelle', 'Update exam') : txt('Sinavi kaydet', 'Save exam'))}
            </Button>
            <Button
              className="border-[color:var(--danger)] text-[color:var(--danger)] hover:bg-[color:var(--surface-soft-peach)]"
              disabled={deleteExamMutation.isPending || !exam}
              onClick={() => {
                void handleDeleteExam()
              }}
              type="button"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
              {deleteExamMutation.isPending ? txt('Siliniyor...', 'Deleting...') : txt('Sinavi sil', 'Delete exam')}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-l-4 border-l-[color:var(--success)]">
        <div className="flex items-center justify-between gap-3">
          <SectionHeader
            description={txt('Sinav sorularini ekleyin, duzenleyin ve gerektiginde kaldirin.', 'Add, edit, and remove exam questions when needed.')}
            title={txt('6. Soru havuzu', '6. Question pool')}
          />
          <Button
            disabled={Boolean(!exam || questions.length >= (exam?.questionCount ?? examForm.questionCount))}
            onClick={openCreateQuestionModal}
            type="button"
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            {txt('Soru ekle', 'Add question')}
          </Button>
        </div>

        {!exam ? (
          <div className="mt-4 rounded-md border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-soft)] px-4 py-5 text-sm theme-muted">
            {txt('Once final sinavi bilgilerini kaydedin, ardindan soru ekleyin.', 'Save final exam details first, then add questions.')}
          </div>
        ) : null}

        {exam && questions.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-soft)] px-4 py-5 text-sm theme-muted">
            {txt('Henüz soru eklenmedi.', 'No questions added yet.')}
          </div>
        ) : null}

        {questions.length > 0 ? (
          <div className="mt-4 space-y-3">
            {questions.map((question) => (
              <div
                className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-4"
                key={question.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="theme-subtle text-xs uppercase tracking-[0.08em]">{isTurkish ? `Soru #${question.orderIndex + 1}` : `Question #${question.orderIndex + 1}`}</p>
                    <p className="theme-heading mt-1 text-sm font-medium">{question.questionText}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {question.options.map((option) => (
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${
                            question.correctOptionId === option.id
                              ? 'border-[color:var(--success)] bg-[color:var(--surface-soft-mint)] text-[color:var(--success)]'
                              : 'border-[color:var(--border)] bg-[color:var(--surface-strong)] theme-subtle'
                          }`}
                          key={option.id}
                        >
                          {option.text}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openEditQuestionModal(question)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {txt('Duzenle', 'Edit')}
                    </Button>
                    <Button
                      className="border-[color:var(--danger)] text-[color:var(--danger)] hover:bg-[color:var(--surface-soft-peach)]"
                      onClick={() => {
                        void handleDeleteQuestion(question.id)
                      }}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      {txt('Sil', 'Delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </Card>

      <Modal
        description={txt('Soru metnini, secenekleri ve dogru cevabi duzenleyin. Kaydetmeden once kontrol edin.', 'Edit question text, options, and correct answer. Review before saving.')}
        onClose={() => {
          if (!createQuestionMutation.isPending && !updateQuestionMutation.isPending && !uploadQuestionImageMutation.isPending) {
            setQuestionModalOpen(false)
          }
        }}
        open={questionModalOpen}
        title={editingQuestion ? txt('Soruyu duzenle', 'Edit question') : txt('Yeni soru ekle', 'Add new question')}
      >
        <div className="space-y-4">
          <label className="flex flex-col gap-1">
            <span className="theme-subtle text-xs">{txt('Soru metni', 'Question text')}</span>
            <textarea
              className="theme-text min-h-[96px] rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
              onChange={(event) => setQuestionForm((current) => ({ ...current, questionText: event.target.value }))}
              value={questionForm.questionText}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="theme-subtle text-xs">{txt('Soru gorseli (opsiyonel)', 'Question image (optional)')}</span>
            <input
              accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
              className="theme-text file:theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm file:mr-3 file:cursor-pointer file:border-0 file:bg-transparent file:text-xs file:font-medium"
              onChange={(event) => handleQuestionImageChange(event.target.files?.[0] ?? null)}
              type="file"
            />
            {selectedImageError ? <span className="text-xs text-[color:var(--danger)]">{selectedImageError}</span> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
                <p className="theme-subtle mb-2 text-xs">{txt('Mevcut gorsel', 'Current image')}</p>
                {editingQuestion?.imageUrl ? (
                  <img
                    alt={txt('Soru gorseli', 'Question image')}
                    className="h-24 w-full rounded-md object-cover"
                    src={editingQuestion.imageUrl}
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] text-xs theme-subtle">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {txt('Gorsel yok', 'No image')}
                  </div>
                )}
              </div>
              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-3">
                <p className="theme-subtle mb-2 text-xs">{txt('Yeni onizleme', 'New preview')}</p>
                {imagePreviewUrl ? (
                  <img
                    alt={txt('Yeni soru gorseli onizleme', 'New question image preview')}
                    className="h-24 w-full rounded-md object-cover"
                    src={imagePreviewUrl}
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-[color:var(--border)] bg-[color:var(--surface-strong)] text-xs theme-subtle">
                    {txt('Henuz dosya secilmedi', 'No file selected yet')}
                  </div>
                )}
              </div>
            </div>
            {editingQuestion?.imageUrl ? (
              <div className="flex justify-end">
                <Button
                  className="border-[color:var(--danger)] text-[color:var(--danger)] hover:bg-[color:var(--surface-soft-peach)]"
                  disabled={deleteQuestionImageMutation.isPending}
                  onClick={() => {
                    void handleDeleteQuestionImage(editingQuestion.id)
                  }}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  {txt('Gorseli kaldir', 'Remove image')}
                </Button>
              </div>
            ) : null}
          </label>

          <label className="flex flex-col gap-1">
            <span className="theme-subtle text-xs">{txt('Soru sirasi', 'Question order')}</span>
            <input
              className="theme-text h-10 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
              min={0}
              onChange={(event) => setQuestionForm((current) => ({ ...current, orderIndex: Number(event.target.value) }))}
              type="number"
              value={questionForm.orderIndex}
            />
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="theme-subtle text-xs">{txt('Secenekler', 'Options')}</span>
              <Button onClick={handleAddOption} size="sm" type="button" variant="secondary">
                <Plus className="h-4 w-4" />
                {txt('Secenek ekle', 'Add option')}
              </Button>
            </div>

            {questionForm.options.map((option, index) => {
              const optionId = getQuestionOptionClientId(option, index)
              const isCorrect = questionForm.correctOptionId === optionId

              return (
                <div className="flex items-center gap-2" key={`${optionId}-${index}`}>
                  <input
                    checked={isCorrect}
                    name="correct-option"
                    onChange={() => setQuestionForm((current) => ({ ...current, correctOptionId: optionId }))}
                    type="radio"
                  />
                  <input
                    className="theme-text h-10 w-full rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                    onChange={(event) => updateQuestionOption(index, event.target.value)}
                    placeholder={isTurkish ? `Secenek ${index + 1}` : `Option ${index + 1}`}
                    value={option.text}
                  />
                  <Button
                    className="border-[color:var(--border)]"
                    disabled={questionForm.options.length <= 2}
                    onClick={() => handleRemoveOption(index)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    {txt('Sil', 'Remove')}
                  </Button>
                </div>
              )
            })}
          </div>

          {questionFormError ? (
            <div className="rounded-md border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-3 py-2 text-sm text-[color:var(--danger)]">
              {questionFormError}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-[color:var(--border)] pt-4">
            <Button
              className="border-[color:var(--border)]"
              onClick={() => setQuestionModalOpen(false)}
              type="button"
              variant="ghost"
            >
              {txt('Iptal', 'Cancel')}
            </Button>
            <Button
              disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending || uploadQuestionImageMutation.isPending}
              onClick={() => {
                void handleSaveQuestion()
              }}
              type="button"
              variant="secondary"
            >
              {createQuestionMutation.isPending || updateQuestionMutation.isPending || uploadQuestionImageMutation.isPending
                ? txt('Kaydediliyor...', 'Saving...')
                : txt('Soruyu kaydet', 'Save question')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default InstructorFinalExamPanel


