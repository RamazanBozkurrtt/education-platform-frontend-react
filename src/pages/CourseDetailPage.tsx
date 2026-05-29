import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, CheckCircle2, Clock3, FileCheck2, LockKeyhole, PlayCircle, ShoppingCart, Star, Users2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import StatusBadge from '../components/dashboard/StatusBadge'
import CourseProgressBar from '../components/progress/CourseProgressBar'
import LessonProgressBadge from '../components/progress/LessonProgressBadge'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import MetaRow from '../components/ui/MetaRow'
import QueryErrorState from '../components/ui/QueryErrorState'
import TagList from '../components/ui/TagList'
import CourseReviewList from '../components/reviews/CourseReviewList'
import CourseReviewSummary from '../components/reviews/CourseReviewSummary'
import ReviewForm from '../components/reviews/ReviewForm'
import { useLanguage } from '../hooks/useLanguage'
import { useCourseLessonProgress, useCourseProgressSummary } from '../hooks/useCourseProgress'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
import { useAuth } from '../hooks/useAuth'
import { resolveServiceUrl } from '../config/api'
import { courseService } from '../services/courseService'
import { enrollmentService } from '../services/enrollmentService'
import { API_ENDPOINTS } from '../services/endpoints'
import { reviewService } from '../services/reviewService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { formatCoursePrice } from '../utils/helpers'
import { isAdmin } from '../utils/roles'
import type { CreateReviewRequest, Review, UpdateReviewRequest } from '../utils/types'
import { buildCoursePlayerPath, resolveContinueLessonId, resolveLessonProgressStatus } from '../utils/courseProgress'

const REVIEW_PAGE_SIZE = 10

const resolveErrorMessageFromPayload = (error: unknown) => {
  const appError = normalizeApiError(error)
  const rawPayload = appError.raw && typeof appError.raw === 'object'
    ? appError.raw as Record<string, unknown>
    : undefined

  if (rawPayload) {
    if (typeof rawPayload.message === 'string' && rawPayload.message.trim()) {
      return rawPayload.message.trim()
    }

    const errorValues = rawPayload.errors

    if (Array.isArray(errorValues)) {
      const firstError = errorValues.find((item) => typeof item === 'string' && item.trim())

      if (typeof firstError === 'string') {
        return firstError.trim()
      }
    }

    if (errorValues && typeof errorValues === 'object') {
      for (const messages of Object.values(errorValues as Record<string, unknown>)) {
        if (typeof messages === 'string' && messages.trim()) {
          return messages.trim()
        }

        if (Array.isArray(messages)) {
          const firstMessage = messages.find((item) => typeof item === 'string' && item.trim())

          if (typeof firstMessage === 'string') {
            return firstMessage.trim()
          }
        }
      }
    }
  }

  if (appError.httpStatus === 400) {
    return 'Lutfen girdigin bilgileri kontrol et.'
  }

  if (appError.httpStatus === 401) {
    return 'Degerlendirme yapmak icin giris yapmalisin.'
  }

  if (appError.httpStatus === 403) {
    return 'Bu islem icin yetkin yok.'
  }

  if (appError.httpStatus === 404) {
    return 'Kurs veya degerlendirme bulunamadi.'
  }

  if (appError.httpStatus === 409) {
    return 'Bu kurs icin daha once degerlendirme yapmissin.'
  }

  if (appError.httpStatus && appError.httpStatus >= 500) {
    return 'Degerlendirme sirasinda beklenmeyen bir sorun olustu.'
  }

  return appError.message
}

const isPaymentRequiredForEnrollmentError = (error: unknown) => {
  const appError = normalizeApiError(error)

  if (appError.httpStatus === 402) {
    return true
  }

  if (appError.code?.trim().toUpperCase() === 'PAYMENT_REQUIRED_FOR_ENROLLMENT') {
    return true
  }

  const rawPayload = appError.raw && typeof appError.raw === 'object'
    ? appError.raw as Record<string, unknown>
    : undefined

  const codeFromPayload = typeof rawPayload?.code === 'string'
    ? rawPayload.code.trim().toUpperCase()
    : typeof rawPayload?.error === 'string'
      ? rawPayload.error.trim().toUpperCase()
      : undefined

  return codeFromPayload === 'PAYMENT_REQUIRED_FOR_ENROLLMENT'
}

const CourseDetailPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useLanguage()
  const { user, claims, isAuthenticated } = useAuth()
  const { addCourse, isInCart, removeCourse } = useCart()
  const { isPurchased, purchaseCourses } = useLibrary()
  const { slug = '' } = useParams()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null)
  const [purchaseStage, setPurchaseStage] = useState<'enrollment' | null>(null)
  const [isInstructorAvatarBroken, setIsInstructorAvatarBroken] = useState(false)

  const copy = language === 'tr'
    ? {
      detailsTitle: 'Kurs detaylari',
      detailsDescription: 'Kurs ozeti, dersler ve degerlendirmeler.',
      lessonsTitle: 'Dersler',
      lessonsDescription: 'Bu kurs icin ders listesi.',
      tags: 'Etiketler',
      ratingLabel: 'Puan',
      statusTitle: 'Kurs durumu',
      statusDescription: 'Erisim ve satin alma islemleri.',
      purchased: 'Kursa erisimin var',
      notPurchased: 'Henuz satin alinmadi',
      reviewTitle: 'Degerlendirmeler',
      reviewCount: 'degerlendirme',
      reviewWriteTitle: 'Degerlendirme yap',
      reviewListTitle: 'Tum yorumlar',
      yourReview: 'Bu kurs icin degerlendirmen',
      deleteReview: 'Degerlendirmeyi sil',
      reviewLoginRequired: 'Devam etmek icin giris yapmalisin.',
      reviewPurchaseRequired: 'Degerlendirme yapmak icin kursu satin almalisin.',
      noTag: 'Etiket yok.',
      noOutcome: 'Bu kurs icin ogrenim kazanimi eklenmemis.',
      noLessons: 'Bu kurs icin henuz ders eklenmedi.',
      instructorTitle: 'Egitmen',
      progressTitle: 'Ilerleme',
      level: 'Seviye',
      includedOutcomes: 'Kazanacagin yetkinlikler',
      enrollFree: 'Kursa Katıl',
      enrollmentCreating: 'Kayıt oluşturuluyor...',
      enrollmentSuccess: 'Kurs kaydınız oluşturuldu.',
      paymentRequiredMessage: 'Bu kursa kayıt olmak için önce ödeme işlemini tamamlamalısınız.',
      enrollmentFailedMessage: 'Kurs kaydı oluşturulamadı. Lütfen tekrar deneyin.',
      finalExamCtaTitle: 'Final sınavı',
      finalExamUnlockHint: 'Final sınavına girebilmek için kurs içeriğini %100 tamamlamalısın.',
      finalExamRequiresEnrollment: 'Final sınavına erişmek için önce kursa kayıt olmalısın.',
      finalExamReady: 'Kurs içeriğini tamamladın. Final sınavına başlayabilirsin.',
      finalExamGo: 'Final sınavına git',
      finalExamLocked: 'Final sınavı kilitli',
      progressSummary: (value: number) => `Tamamlanma: %${value}`,
    }
    : {
      detailsTitle: 'Course details',
      detailsDescription: 'Course summary, lessons, and reviews.',
      lessonsTitle: 'Lessons',
      lessonsDescription: 'Lesson list for this course.',
      tags: 'Tags',
      ratingLabel: 'Rating',
      statusTitle: 'Course status',
      statusDescription: 'Manage access and purchase actions.',
      purchased: 'You have access',
      notPurchased: 'Not purchased yet',
      reviewTitle: 'Reviews',
      reviewCount: 'reviews',
      reviewWriteTitle: 'Write a review',
      reviewListTitle: 'All reviews',
      yourReview: 'Your review for this course',
      deleteReview: 'Delete review',
      reviewLoginRequired: 'Sign in to leave a review.',
      reviewPurchaseRequired: 'You need to purchase this course before leaving a review.',
      noTag: 'No tags added.',
      noOutcome: 'No learning outcomes added for this course.',
      noLessons: 'No lessons have been added to this course yet.',
      instructorTitle: 'Instructor',
      progressTitle: 'Progress',
      level: 'Level',
      includedOutcomes: 'What you will learn',
      enrollFree: 'Join Course',
      enrollmentCreating: 'Creating enrollment...',
      enrollmentSuccess: 'Your enrollment has been created.',
      paymentRequiredMessage: 'You need to complete payment before enrolling in this course.',
      enrollmentFailedMessage: 'Enrollment could not be created. Please try again.',
      finalExamCtaTitle: 'Final exam',
      finalExamUnlockHint: 'You must complete 100% of course content before taking the final exam.',
      finalExamRequiresEnrollment: 'You need to enroll before you can access the final exam.',
      finalExamReady: 'You completed the course content. You can start the final exam.',
      finalExamGo: 'Go to final exam',
      finalExamLocked: 'Final exam is locked',
      progressSummary: (value: number) => `Completion: ${value}%`,
    }

  const { data, error, isLoading } = useQuery({
    queryKey: ['course', language, slug],
    queryFn: () => courseService.getCourseBySlug(slug, language),
  })

  const courseId = data?.id ?? ''
  const isUserAdmin = isAdmin(user, claims)
  const purchased = data ? isPurchased(data.id) : false
  const inCart = data ? isInCart(data.id) : false
  const { data: courseProgressSummary } = useCourseProgressSummary(purchased ? courseId : null)
  const { data: courseLessonProgress = [] } = useCourseLessonProgress(purchased ? courseId : null)
  const courseLessonProgressById = useMemo(
    () => courseLessonProgress.reduce<Record<string, typeof courseLessonProgress[number]>>((accumulator, progress) => {
      if (!progress.lessonId) {
        return accumulator
      }

      accumulator[progress.lessonId] = progress
      return accumulator
    }, {}),
    [courseLessonProgress],
  )
  const isPaidCourse = Boolean(data && data.price > 0)
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const freeLabel = language === 'tr' ? 'Ücretsiz' : 'Free'
  const continueLessonId = data
    ? resolveContinueLessonId(courseProgressSummary, data.modules)
    : null
  const coursePlayerPath = data
    ? buildCoursePlayerPath(data.slug, continueLessonId)
    : ROUTES.coursePlayer(slug)
  const canResumeCourse = Boolean(
    courseProgressSummary && (courseProgressSummary.overallPercentage > 0 || courseProgressSummary.lastLessonId),
  )
  const watchCourseButtonLabel = purchased
    ? (canResumeCourse ? (language === 'tr' ? 'Devam et' : 'Continue') : (language === 'tr' ? 'Kursa basla' : 'Start course'))
    : t('common.watchCourse')
  const completionPercentage = purchased
    ? Math.max(0, Math.min(100, Math.round(courseProgressSummary?.overallPercentage ?? data?.progress ?? 0)))
    : 0
  const isFinalExamUnlocked = purchased && completionPercentage >= 100
  const finalExamLockReason = purchased ? copy.finalExamUnlockHint : copy.finalExamRequiresEnrollment
  const finalExamPath = data
    ? ROUTES.courseFinalExamOverview(data.id)
    : ROUTES.courseFinalExamOverview(courseId)

  const {
    data: reviewSummary,
    isLoading: isReviewSummaryLoading,
    error: reviewSummaryError,
  } = useQuery({
    queryKey: ['course-reviews-summary', courseId],
    queryFn: () => reviewService.getCourseReviewSummary(courseId),
    enabled: Boolean(courseId),
  })

  const {
    data: reviewPages,
    isLoading: isReviewListLoading,
    error: reviewListError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['course-reviews', courseId],
    queryFn: ({ pageParam }) => reviewService.getCourseReviews(courseId, {
      page: typeof pageParam === 'number' ? pageParam : 0,
      size: REVIEW_PAGE_SIZE,
      sort: 'createdAt,desc',
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) {
        return undefined
      }

      const nextPage = lastPage.number + 1
      return nextPage < lastPage.totalPages ? nextPage : undefined
    },
    enabled: Boolean(courseId),
  })

  const reviews = useMemo(
    () => reviewPages?.pages.flatMap((page) => page.content) ?? [],
    [reviewPages?.pages],
  )

  const ownReview = useMemo(
    () => reviews.find((review) => review.ownedByCurrentUser || (Boolean(user?.id) && review.userId === user?.id)) ?? null,
    [reviews, user?.id],
  )

  const visibleEditReview = editingReview ?? ownReview
  const reviewFormMode = visibleEditReview ? 'update' : 'create'

  const refreshReviewData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['course-reviews-summary', courseId] }),
      queryClient.invalidateQueries({ queryKey: ['course-reviews', courseId] }),
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] }),
    ])
  }

  const createReviewMutation = useMutation({
    mutationFn: async (payload: CreateReviewRequest) => {
      return reviewService.createCourseReview(courseId, payload)
    },
  })

  const updateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, payload }: { reviewId: string; payload: UpdateReviewRequest }) => {
      return reviewService.updateReview(reviewId, payload)
    },
  })

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      return reviewService.deleteReview(reviewId)
    },
  })

  const handleReviewSubmit = async (payload: CreateReviewRequest | UpdateReviewRequest) => {
    if (!courseId) {
      return
    }

    if (!isAuthenticated) {
      setSubmitError(copy.reviewLoginRequired)
      return
    }

    if (!purchased) {
      setSubmitError(copy.reviewPurchaseRequired)
      return
    }

    setSubmitError(null)
    setSuccessMessage(null)

    try {
      if (reviewFormMode === 'update' && visibleEditReview) {
        await updateReviewMutation.mutateAsync({ reviewId: visibleEditReview.id, payload })
        setEditingReview(null)
        setSuccessMessage(language === 'tr' ? 'Degerlendirme guncellendi.' : 'Review updated.')
      } else {
        await createReviewMutation.mutateAsync(payload)
        setSuccessMessage(language === 'tr' ? 'Degerlendirme kaydedildi.' : 'Review submitted.')
      }

      await refreshReviewData()
    } catch (error_) {
      const appError = normalizeApiError(error_)

      if (appError.httpStatus === 409) {
        setSubmitError(
          language === 'tr'
            ? 'Bu kurs icin zaten yorum yapmissin. Mevcut yorumunu guncelleyebilirsin.'
            : 'You already reviewed this course. You can update your existing review.',
        )
        await refreshReviewData()
        return
      }

      setSubmitError(resolveErrorMessageFromPayload(error_))
    }
  }

  const handleDeleteReview = async (review: Review) => {
    if (!isUserAdmin && !purchased) {
      setSubmitError(copy.reviewPurchaseRequired)
      return
    }

    setDeletingReviewId(review.id)
    setSubmitError(null)
    setSuccessMessage(null)

    try {
      await deleteReviewMutation.mutateAsync(review.id)

      if (editingReview?.id === review.id) {
        setEditingReview(null)
      }

      setSuccessMessage(language === 'tr' ? 'Degerlendirme silindi.' : 'Review deleted.')
      await refreshReviewData()
    } catch (error_) {
      setSubmitError(resolveErrorMessageFromPayload(error_))
    } finally {
      setDeletingReviewId(null)
    }
  }

  const canManageOwnReview = isAuthenticated && purchased
  const canEditReview = (review: Review) =>
    canManageOwnReview && Boolean(review.ownedByCurrentUser || review.userId === user?.id)
  const canDeleteReview = (review: Review) => canEditReview(review) || isUserAdmin

  const refreshEnrollmentState = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['my-courses'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] }),
      queryClient.invalidateQueries({ queryKey: ['course', language, slug] }),
    ])
  }

  const handleFreeEnrollment = async () => {
    if (!data || purchased || purchaseStage) {
      return
    }

    setPurchaseError(null)
    setPurchaseSuccess(null)
    setPurchaseStage('enrollment')

    try {
      await enrollmentService.createEnrollment(
        { courseId: data.id },
        { skipGlobalErrorHandling: true },
      )
      purchaseCourses([data.id])
      removeCourse(data.id)
      await refreshEnrollmentState()
      setPurchaseSuccess(copy.enrollmentSuccess)
    } catch (error) {
      if (isPaymentRequiredForEnrollmentError(error)) {
        setPurchaseError(copy.paymentRequiredMessage)
      } else {
        setPurchaseError(copy.enrollmentFailedMessage)
      }
    } finally {
      setPurchaseStage(null)
    }
  }

  const handleAddToCart = () => {
    if (!data || purchased) {
      return
    }

    addCourse(data.id)
    navigate(ROUTES.cart)
  }

  useEffect(() => {
    setIsInstructorAvatarBroken(false)
  }, [data?.instructor.avatarUrl])

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !data) {
    return <Loader label={t('loader.courseDetails')} />
  }

  const fallbackCourseImageUrl = resolveServiceUrl(API_ENDPOINTS.courses.image.public(data.id))
  const courseImageUrl = data.imageUrl || fallbackCourseImageUrl
  const instructorAvatarUrl = data.instructor.avatarUrl ?? ''
  const showInstructorAvatar = Boolean(instructorAvatarUrl && !isInstructorAvatarBroken)
  const instructorInitials = data.instructor.name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
  const coursePreviewLabel = language === 'tr' ? 'Kurs gorseli' : 'Course preview'

  const handleMediaImageError = (event: SyntheticEvent<HTMLImageElement>, fallbackSrc: string) => {
    const target = event.currentTarget

    if (target.dataset.fallbackApplied === 'true') {
      return
    }

    target.dataset.fallbackApplied = 'true'
    target.src = fallbackSrc
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        actions={(
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {purchased ? (
              <Link className="w-full sm:w-auto" to={coursePlayerPath}>
                <Button asChild className="w-full justify-center">
                  <PlayCircle className="h-4 w-4" />
                  {watchCourseButtonLabel}
                </Button>
              </Link>
            ) : (
              <>
                {isPaidCourse ? (
                  inCart ? (
                    <Link className="w-full sm:w-auto" to={ROUTES.cart}>
                      <Button asChild className="w-full justify-center sm:w-auto" variant="secondary">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('common.goToCart')}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      className="w-full justify-center sm:w-auto"
                      onClick={handleAddToCart}
                      variant="secondary"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {t('common.addToCart')}
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full justify-center sm:w-auto"
                    disabled={Boolean(purchaseStage)}
                    onClick={() => {
                      void handleFreeEnrollment()
                    }}
                  >
                    {purchaseStage === 'enrollment' ? copy.enrollmentCreating : copy.enrollFree}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
        description={data.description}
        eyebrow={getCourseCategoryLabel(data)}
        title={data.title}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <article className="overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
          <div className="relative">
            <img
              alt={data.title}
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
              onError={(event) => handleMediaImageError(event, fallbackCourseImageUrl)}
              src={courseImageUrl}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[color:rgba(6,10,16,0.6)] via-transparent to-transparent" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <span className="rounded-sm border border-white/20 bg-black/35 px-2.5 py-1 text-xs font-semibold text-white">
                {getCourseCategoryLabel(data)}
              </span>
              <span className="rounded-sm border border-white/20 bg-black/35 px-2.5 py-1 text-xs font-semibold text-white">
                {data.level.levelName}
              </span>
            </div>
          </div>
          <div className="border-t border-[color:var(--border)] px-5 py-4">
            <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.14em]">{coursePreviewLabel}</p>
            <p className="theme-muted mt-2 text-sm leading-7">{data.summary}</p>
          </div>
        </article>

        <article className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-5">
          <h3 className="theme-heading text-base font-semibold">{copy.instructorTitle}</h3>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)]">
              {showInstructorAvatar ? (
                <img
                  alt={data.instructor.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => setIsInstructorAvatarBroken(true)}
                  src={instructorAvatarUrl}
                />
              ) : (
                <span className="text-sm font-semibold text-[color:var(--text-heading)]">{instructorInitials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="theme-heading truncate text-lg font-semibold">{data.instructor.name}</p>
              <p className="theme-muted mt-1 text-sm">{data.instructor.role}</p>
            </div>
          </div>
          <p className="theme-text mt-4 text-sm leading-7">{data.instructor.bio}</p>
        </article>
      </section>

      <section className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-5">
        <MetaRow
          items={[
            { key: 'rating', icon: Star, label: copy.ratingLabel, value: data.rating.toFixed(1) },
            { key: 'instructor', label: copy.instructorTitle, value: data.instructor.name },
            { key: 'duration', icon: Clock3, label: t('courseDetail.duration'), value: data.duration },
            { key: 'lessons', icon: BookOpen, label: t('courseDetail.lessons'), value: t('courseDetail.lessonsValue', { count: data.lessons }) },
            { key: 'students', icon: Users2, label: t('courseDetail.enrolled'), value: t('courseDetail.enrolledValue', { students: data.students }) },
            { key: 'level', label: copy.level, value: data.level.levelName },
          ]}
        />

        <div className="mt-4 border-t border-[color:var(--border)] pt-4">
          <TagList emptyText={copy.noTag} hideWhenEmpty label={copy.tags} tags={data.tags} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
        <div className="min-w-0 space-y-7">
          <DashboardSection description={copy.detailsDescription} title={copy.detailsTitle}>
            {data.outcomes.length > 0 ? (
              <ul className="divide-y divide-[color:var(--border)] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
                {data.outcomes.map((outcome) => (
                  <li className="theme-text px-4 py-3 text-sm leading-6" key={outcome}>{outcome}</li>
                ))}
              </ul>
            ) : (
              <p className="theme-muted text-sm">{copy.noOutcome}</p>
            )}
          </DashboardSection>

          <DashboardSection description={copy.lessonsDescription} title={copy.lessonsTitle}>
            {data.modules.length > 0 ? (
              <ul className="divide-y divide-[color:var(--border)] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
                {data.modules.map((module, index) => {
                  const lessonProgress = purchased ? courseLessonProgressById[module.id] : undefined
                  const lessonStatus = resolveLessonProgressStatus(lessonProgress)

                  return (
                    <li className="px-4 py-3.5" key={module.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="theme-subtle w-7 text-xs font-semibold">{String(index + 1).padStart(2, '0')}</span>
                        <div className="min-w-0">
                          <p className="theme-heading truncate text-sm font-medium">{module.title}</p>
                          <p className="theme-muted mt-1 text-xs">{module.type} - {module.duration}</p>
                          {purchased ? (
                            <>
                              <div className="mt-2">
                                <LessonProgressBadge
                                  language={language}
                                  status={lessonStatus}
                                  watchedPercentage={lessonProgress?.watchedPercentage}
                                />
                              </div>
                              {lessonStatus === 'in_progress' ? (
                                <div className="mt-2 h-1.5 w-[160px] rounded-full bg-[color:var(--surface-muted)]">
                                  <div
                                    className="h-full rounded-full bg-[color:var(--primary)]"
                                    style={{ width: `${Math.round(lessonProgress?.watchedPercentage ?? 0)}%` }}
                                  />
                                </div>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </div>
                      {!purchased ? (
                        <StatusBadge tone={module.completed ? 'success' : 'warning'}>
                          {module.completed ? t('common.completed') : t('common.upcoming')}
                        </StatusBadge>
                      ) : null}
                    </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="theme-muted text-sm">{copy.noLessons}</p>
            )}

            <div className="mt-4 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="theme-heading text-sm font-semibold">{copy.finalExamCtaTitle}</p>
                  <p className="theme-subtle mt-1 text-xs">{copy.progressSummary(completionPercentage)}</p>
                </div>
                {isFinalExamUnlocked ? (
                  <Link to={finalExamPath}>
                    <Button asChild className="w-full sm:w-auto" variant="secondary">
                      <FileCheck2 className="h-4 w-4" />
                      {copy.finalExamGo}
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="w-full sm:w-auto" variant="secondary">
                    <LockKeyhole className="h-4 w-4" />
                    {copy.finalExamLocked}
                  </Button>
                )}
              </div>

              <p className={`mt-3 text-sm ${isFinalExamUnlocked ? 'text-[color:var(--success)]' : 'theme-muted'}`}>
                {isFinalExamUnlocked ? copy.finalExamReady : finalExamLockReason}
              </p>
            </div>
          </DashboardSection>

          <DashboardSection title={copy.reviewTitle}>
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <CourseReviewSummary isLoading={isReviewSummaryLoading} summary={reviewSummary} />

                <section className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] pb-3">
                    <h3 className="theme-heading text-sm font-semibold">{copy.reviewWriteTitle}</h3>
                    {reviewSummary?.totalReviews ? (
                      <StatusBadge>{reviewSummary.totalReviews} {copy.reviewCount}</StatusBadge>
                    ) : null}
                  </div>

                  {successMessage ? (
                    <div className="mt-4 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] px-4 py-3 text-sm theme-heading">
                      {successMessage}
                    </div>
                  ) : null}

                  {isAuthenticated && purchased ? (
                    <div className="mt-4">
                      {visibleEditReview ? (
                        <p className="theme-heading mb-3 text-sm font-semibold">{copy.yourReview}</p>
                      ) : null}
                      <ReviewForm
                        initialValue={visibleEditReview ? { rating: visibleEditReview.rating, comment: visibleEditReview.comment } : undefined}
                        isSubmitting={createReviewMutation.isPending || updateReviewMutation.isPending}
                        mode={reviewFormMode}
                        onSubmit={handleReviewSubmit}
                        submitError={submitError}
                      />
                      {visibleEditReview ? (
                        <div className="mt-3">
                          <Button
                            disabled={deleteReviewMutation.isPending}
                            onClick={() => handleDeleteReview(visibleEditReview)}
                            type="button"
                            variant="ghost"
                          >
                            {copy.deleteReview}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="theme-muted mt-4 text-sm">
                      {isAuthenticated ? copy.reviewPurchaseRequired : copy.reviewLoginRequired}
                    </p>
                  )}
                </section>
              </div>

              {reviewSummaryError || reviewListError ? (
                <div className="rounded-sm border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
                  {resolveErrorMessageFromPayload(reviewSummaryError ?? reviewListError)}
                </div>
              ) : (
                <div className="border-t border-[color:var(--border)] pt-4">
                  <p className="theme-heading mb-3 text-sm font-semibold">{copy.reviewListTitle}</p>
                  <CourseReviewList
                    canDeleteReview={canDeleteReview}
                    canEditReview={canEditReview}
                    deletingReviewId={deletingReviewId}
                    hasNextPage={Boolean(hasNextPage)}
                    isFetchingNextPage={isFetchingNextPage}
                    isLoading={isReviewListLoading}
                    onDeleteReview={handleDeleteReview}
                    onEditReview={setEditingReview}
                    onLoadMore={() => {
                      void fetchNextPage()
                    }}
                    reviews={reviews}
                  />
                </div>
              )}
            </div>
          </DashboardSection>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-5">
            <h3 className="theme-heading text-base font-semibold">{copy.statusTitle}</h3>
            <p className="theme-muted mt-1 text-sm">{copy.statusDescription}</p>

            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <p className="theme-muted text-sm">{t('common.price')}</p>
                <p className="theme-heading mt-1 text-3xl font-semibold">
                  {formatCoursePrice(data.price, data.currency, { locale, freeLabel })}
                </p>
              </div>
              <StatusBadge>{data.level.levelName}</StatusBadge>
            </div>

            <div className="mt-4">
              <StatusBadge tone={purchased ? 'success' : 'warning'}>
                {purchased ? copy.purchased : copy.notPurchased}
              </StatusBadge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {purchased ? (
                <div className="sm:col-span-2">
                  <Link to={coursePlayerPath}>
                    <Button asChild className="w-full justify-center">
                      <PlayCircle className="h-4 w-4" />
                      {watchCourseButtonLabel}
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {isPaidCourse ? (
                    inCart ? (
                      <Link className="sm:col-span-2" to={ROUTES.cart}>
                        <Button asChild className="w-full justify-center" variant="secondary">
                          <CheckCircle2 className="h-4 w-4" />
                          {t('common.goToCart')}
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className="w-full justify-center sm:col-span-2"
                        onClick={handleAddToCart}
                        variant="secondary"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {t('common.addToCart')}
                      </Button>
                    )
                  ) : (
                    <Button
                      className="w-full justify-center sm:col-span-2"
                      disabled={Boolean(purchaseStage)}
                      onClick={() => {
                        void handleFreeEnrollment()
                      }}
                    >
                      {purchaseStage === 'enrollment' ? copy.enrollmentCreating : copy.enrollFree}
                    </Button>
                  )}
                </>
              )}
            </div>

            {(purchaseError || purchaseSuccess) ? (
              <div
                className={`mt-4 rounded-sm border px-3 py-2 text-sm ${
                  purchaseError
                    ? 'border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] text-[color:var(--danger)]'
                    : 'border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] theme-heading'
                }`}
              >
                {purchaseError ?? purchaseSuccess}
              </div>
            ) : null}
          </section>

          {purchased ? (
            <section className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-5">
              <h3 className="theme-heading text-base font-semibold">{copy.progressTitle}</h3>
              <div className="mt-3">
                <CourseProgressBar
                  completedLessons={courseProgressSummary?.completedLessons}
                  language={language}
                  percentage={courseProgressSummary?.overallPercentage ?? data.progress}
                  totalLessons={courseProgressSummary?.totalLessons}
                />
              </div>
            </section>
          ) : null}
        </aside>
      </section>

    </div>
  )
}

export default CourseDetailPage


