import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import LessonVideoActions from '../components/instructor/video/LessonVideoActions'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import InfoBadge from '../components/ui/InfoBadge'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import SectionHeader from '../components/ui/SectionHeader'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { instructorCourseService, type InstructorCourseLesson } from '../services/instructorCourseService'

const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024
const MP4_MIME_TYPE = 'video/mp4'

type MessageState = {
  type: 'success' | 'error'
  text: string
  details?: string[]
} | null

const isMp4File = (file: File) => {
  const fileType = file.type?.toLocaleLowerCase('en-US') ?? ''
  const fileName = file.name.toLocaleLowerCase('en-US')
  return fileType === MP4_MIME_TYPE || fileName.endsWith('.mp4')
}

const extractErrorMessage = (error: unknown, fallbackMessage: string) => {
  const appError = normalizeApiError(error)
  const details = Object.values(appError.fieldErrors ?? {}).flat().filter(Boolean)

  return {
    text: appError.message || fallbackMessage,
    details,
  }
}

const InstructorCourseVideoUploadPage = () => {
  const { courseId = '' } = useParams()
  const [newLessonTitle, setNewLessonTitle] = useState('')
  const [newLessonDescription, setNewLessonDescription] = useState('')
  const [newLessonOrderIndex, setNewLessonOrderIndex] = useState('1')
  const [creatingLesson, setCreatingLesson] = useState(false)
  const [publishingCourse, setPublishingCourse] = useState(false)
  const [selectedFilesByLesson, setSelectedFilesByLesson] = useState<Record<string, File | null>>({})
  const [uploadProgressByLesson, setUploadProgressByLesson] = useState<Record<string, number>>({})
  const [activeUploadLessonId, setActiveUploadLessonId] = useState<string | null>(null)
  const [previewUrlsByLesson, setPreviewUrlsByLesson] = useState<Record<string, string>>({})
  const [previewLoadingByLesson, setPreviewLoadingByLesson] = useState<Record<string, boolean>>({})
  const [previewErrorsByLesson, setPreviewErrorsByLesson] = useState<Record<string, string | null>>({})
  const [openPreviewByLesson, setOpenPreviewByLesson] = useState<Record<string, boolean>>({})
  const [message, setMessage] = useState<MessageState>(null)

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
      return 'Sadece MP4 formatındaki videolar yüklenebilir.'
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

  const refreshCourseDetail = async () => {
    await refetchCourseDetail()
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
        text: 'Ders başlığı zorunludur.',
      })
      return
    }

    if (!Number.isFinite(parsedOrderIndex) || parsedOrderIndex < 1) {
      setMessage({
        type: 'error',
        text: 'Ders sırası en az 1 olmalıdır.',
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
        text: 'Ders başarıyla eklendi.',
      })
    } catch (createError: unknown) {
      const resolvedError = extractErrorMessage(createError, 'Ders eklenirken bir sorun oluştu.')
      setMessage({
        type: 'error',
        text: resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setCreatingLesson(false)
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
      setMessage({
        type: 'success',
        text: 'Kurs yayına alındı. Artık kurslar bölümünde listelenir ve satın alınabilir.',
      })
    } catch (publishError: unknown) {
      const resolvedError = extractErrorMessage(
        publishError,
        'Kurs yayınlanırken bir sorun oluştu.',
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
        text: 'Lütfen önce bir video dosyası seçin.',
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
      setMessage({
        type: 'success',
        text: 'Video başarıyla yüklendi.',
      })
    } catch (uploadError: unknown) {
      const resolvedError = extractErrorMessage(uploadError, 'Video yüklenirken bir sorun oluştu.')

      setMessage({
        type: 'error',
        text: resolvedError.text,
        details: resolvedError.details,
      })
    } finally {
      setActiveUploadLessonId(null)
    }
  }

  const handleDelete = async (lesson: InstructorCourseLesson) => {
    if (!courseId) {
      return
    }

    const confirmed = window.confirm('Bu videoyu silmek istediğine emin misin?')

    if (!confirmed) {
      return
    }

    setMessage(null)
    setActiveUploadLessonId(lesson.id)

    try {
      await instructorCourseService.deleteLessonVideo(courseId, lesson.id)
      clearPreviewStateForLesson(lesson.id)
      await refreshCourseDetail()
      setMessage({
        type: 'success',
        text: 'Video başarıyla silindi.',
      })
    } catch (deleteError: unknown) {
      const resolvedError = extractErrorMessage(deleteError, 'Video silinirken bir sorun oluştu.')
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
      setPreviewUrlsByLesson((current) => {
        return {
          ...current,
          [lesson.id]: url,
        }
      })
    } catch (previewError: unknown) {
      const resolvedError = extractErrorMessage(previewError, 'Video önizlemesi yüklenemedi.')
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
    return <Loader label="Kurs detayları yükleniyor..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Dersleri ekle, videolari yukle veya gerekirse sil."
        eyebrow="Ders ve video yonetimi"
        title={`${courseDetail.title} · Ders yonetimi`}
      />

      <Card>
        <SectionHeader
          description="Yayin adimini tamamlamadan once derslerini ve videolarini kontrol et."
          title="Kurs durumu"
        />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="theme-muted text-sm">Toplam ders: {courseDetail.lessons.length}</p>
          <Button
            disabled={publishingCourse}
            onClick={() => void handlePublishCourse()}
            variant="secondary"
          >
            {publishingCourse ? 'Yayınlanıyor...' : 'Kursu yayına al'}
          </Button>
        </div>
      </Card>

      <Card>
        <SectionHeader description="Baslik, sira ve aciklama bilgileriyle yeni ders olustur." title="Ders ekle" />
        <div className="mt-4 space-y-3">
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
              className="theme-text theme-placeholder min-h-[84px] rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
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

      {message ? (
        <div className={message.type === 'success'
          ? 'rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] px-4 py-3'
          : 'rounded-lg border border-[color:var(--danger)] bg-[color:var(--surface-soft-peach)] px-4 py-3'}
        >
          <p className={message.type === 'success' ? 'theme-text text-sm' : 'text-sm text-[color:var(--danger)]'}>
            {message.text}
          </p>
          {message.details && message.details.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[color:var(--danger)]">
              {message.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-4">
        {courseDetail.lessons.length === 0 ? (
          <Card>
            <p className="theme-muted text-sm">Bu kurs icin henuz ders eklenmemis.</p>
          </Card>
        ) : courseDetail.lessons.map((lesson) => {
          const hasVideo = Boolean(lesson.videoUrl)
          const isUploading = activeUploadLessonId === lesson.id
          const uploadProgress = uploadProgressByLesson[lesson.id] ?? 0
          const statusText = isUploading
            ? `Yükleniyor... %${uploadProgress}`
            : hasVideo
              ? 'Video yüklendi'
              : 'Video yüklenmedi'

          return (
            <Card key={lesson.id}>
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="theme-subtle text-xs uppercase tracking-[0.16em]">
                      Ders #{lesson.orderIndex}
                    </p>
                    <h3 className="theme-heading mt-1 text-lg font-semibold">{lesson.title}</h3>
                    {lesson.description ? (
                      <p className="theme-muted mt-2 text-sm">{lesson.description}</p>
                    ) : null}
                  </div>
                  <InfoBadge tone={hasVideo ? 'success' : 'warning'}>
                    {statusText}
                  </InfoBadge>
                </div>

                <LessonVideoActions
                  hasVideo={hasVideo}
                  isUploading={isUploading}
                  lessonId={lesson.id}
                  onDelete={() => void handleDelete(lesson)}
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
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default InstructorCourseVideoUploadPage
