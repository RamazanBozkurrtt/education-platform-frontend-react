import { useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Clock3, PlayCircle, Star, Users2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import StatusBadge from '../components/dashboard/StatusBadge'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import MetaRow from '../components/ui/MetaRow'
import Modal from '../components/ui/Modal'
import QueryErrorState from '../components/ui/QueryErrorState'
import TagList from '../components/ui/TagList'
import CourseReviewList from '../components/reviews/CourseReviewList'
import CourseReviewSummary from '../components/reviews/CourseReviewSummary'
import ReviewForm from '../components/reviews/ReviewForm'
import { useLanguage } from '../hooks/useLanguage'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
import { useAuth } from '../hooks/useAuth'
import { useCreatePaymentMutation } from '../hooks/usePayments'
import { courseService } from '../services/courseService'
import { enrollmentService } from '../services/enrollmentService'
import { reviewService } from '../services/reviewService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { createIdempotencyKey, formatCoursePrice } from '../utils/helpers'
import { isAdmin } from '../utils/roles'
import type { CreateReviewRequest, Review, UpdateReviewRequest } from '../utils/types'

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
  const queryClient = useQueryClient()
  const { language } = useLanguage()
  const { user, claims, isAuthenticated } = useAuth()
  const { removeCourse } = useCart()
  const { isPurchased, purchaseCourses } = useLibrary()
  const { slug = '' } = useParams()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null)
  const [purchaseStage, setPurchaseStage] = useState<'payment' | 'enrollment' | null>(null)
  const createPaymentMutation = useCreatePaymentMutation()

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
      buyAndEnroll: 'Satın Al ve Katıl',
      checkoutTitle: 'Ödeme Onayı',
      checkoutDescription: 'Bu kursa kaydolmak için ödemeyi onaylayın.',
      paymentProvider: 'Provider',
      paymentMethod: 'Ödeme yöntemi',
      completePayment: 'Ödemeyi Tamamla',
      paymentPreparing: 'Ödeme hazırlanıyor...',
      enrollmentCreating: 'Kayıt oluşturuluyor...',
      paymentSuccess: 'Ödeme başarılı. Kurs kaydınız oluşturuldu.',
      enrollmentSuccess: 'Kurs kaydınız oluşturuldu.',
      paymentRequiredMessage: 'Bu kursa kayıt olmak için önce ödeme işlemini tamamlamalısınız.',
      paymentFailedMessage: 'Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.',
      enrollmentFailedMessage: 'Kurs kaydı oluşturulamadı. Lütfen tekrar deneyin.',
      enrollmentAfterPaymentFailedMessage: 'Ödeme alındı ancak kayıt işlemi tamamlanamadı. Lütfen tekrar deneyin veya destek ile iletişime geçin.',
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
      buyAndEnroll: 'Buy and Join',
      checkoutTitle: 'Payment confirmation',
      checkoutDescription: 'Confirm payment to enroll in this course.',
      paymentProvider: 'Provider',
      paymentMethod: 'Payment method',
      completePayment: 'Complete Payment',
      paymentPreparing: 'Preparing payment...',
      enrollmentCreating: 'Creating enrollment...',
      paymentSuccess: 'Payment succeeded. Your enrollment has been created.',
      enrollmentSuccess: 'Your enrollment has been created.',
      paymentRequiredMessage: 'You need to complete payment before enrolling in this course.',
      paymentFailedMessage: 'Payment could not be completed. Please try again.',
      enrollmentFailedMessage: 'Enrollment could not be created. Please try again.',
      enrollmentAfterPaymentFailedMessage: 'Payment was captured but enrollment could not be completed. Please try again or contact support.',
    }

  const { data, error, isLoading } = useQuery({
    queryKey: ['course', language, slug],
    queryFn: () => courseService.getCourseBySlug(slug, language),
  })

  const courseId = data?.id ?? ''
  const isUserAdmin = isAdmin(user, claims)
  const purchased = data ? isPurchased(data.id) : false
  const isPaidCourse = Boolean(data && data.price > 0)
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const freeLabel = language === 'tr' ? 'Ücretsiz' : 'Free'

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

  const handlePaidEnrollment = async () => {
    if (!data || purchased || purchaseStage) {
      return
    }

    setPurchaseError(null)
    setPurchaseSuccess(null)
    setPurchaseStage('payment')

    try {
      await createPaymentMutation.mutateAsync({
        courseId: data.id,
        provider: 'MOCK_GATEWAY',
        paymentMethod: 'CARD',
        idempotencyKey: createIdempotencyKey(),
      })

      setPurchaseStage('enrollment')

      try {
        await enrollmentService.createEnrollment(
          { courseId: data.id },
          { skipGlobalErrorHandling: true },
        )
      } catch (enrollmentError) {
        if (isPaymentRequiredForEnrollmentError(enrollmentError)) {
          setPurchaseError(copy.paymentRequiredMessage)
        } else {
          setPurchaseError(copy.enrollmentAfterPaymentFailedMessage)
        }
        return
      }

      purchaseCourses([data.id])
      removeCourse(data.id)
      await refreshEnrollmentState()
      setPurchaseSuccess(copy.paymentSuccess)
      setCheckoutOpen(false)
    } catch {
      setPurchaseError(copy.paymentFailedMessage)
    } finally {
      setPurchaseStage(null)
    }
  }

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !data) {
    return <Loader label={t('loader.courseDetails')} />
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        actions={(
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {purchased ? (
              <Link className="w-full sm:w-auto" to={ROUTES.coursePlayer(data.slug)}>
                <Button asChild className="w-full justify-center">
                  <PlayCircle className="h-4 w-4" />
                  {t('common.watchCourse')}
                </Button>
              </Link>
            ) : (
              <>
                {isPaidCourse ? (
                  <Button
                    className="w-full justify-center sm:w-auto"
                    disabled={Boolean(purchaseStage)}
                    onClick={() => setCheckoutOpen(true)}
                  >
                    {copy.buyAndEnroll}
                  </Button>
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
                {data.modules.map((module, index) => (
                  <li className="px-4 py-3.5" key={module.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="theme-subtle w-7 text-xs font-semibold">{String(index + 1).padStart(2, '0')}</span>
                        <div className="min-w-0">
                          <p className="theme-heading truncate text-sm font-medium">{module.title}</p>
                          <p className="theme-muted mt-1 text-xs">{module.type} - {module.duration}</p>
                        </div>
                      </div>
                      <StatusBadge tone={module.completed ? 'success' : 'warning'}>
                        {module.completed ? t('common.completed') : t('common.upcoming')}
                      </StatusBadge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="theme-muted text-sm">{copy.noLessons}</p>
            )}
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
                <Link className="sm:col-span-2" to={ROUTES.coursePlayer(data.slug)}>
                  <Button asChild className="w-full justify-center">
                    <PlayCircle className="h-4 w-4" />
                    {t('common.watchCourse')}
                  </Button>
                </Link>
              ) : (
                <>
                  {isPaidCourse ? (
                    <Button
                      className="w-full justify-center sm:col-span-2"
                      disabled={Boolean(purchaseStage)}
                      onClick={() => setCheckoutOpen(true)}
                    >
                      {copy.buyAndEnroll}
                    </Button>
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

          <section className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-5">
            <h3 className="theme-heading text-base font-semibold">{copy.instructorTitle}</h3>
            <p className="theme-heading mt-3 text-lg font-semibold">{data.instructor.name}</p>
            <p className="theme-muted mt-1 text-sm">{data.instructor.role}</p>
            <p className="theme-text mt-4 text-sm leading-7">{data.instructor.bio}</p>
          </section>

          {purchased ? (
            <section className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-5">
              <h3 className="theme-heading text-base font-semibold">{copy.progressTitle}</h3>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="theme-heading text-2xl font-semibold">%{data.progress}</p>
                <p className="theme-muted text-sm">{t('dashboard.progressComplete', { progress: data.progress })}</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[color:var(--surface-muted)]">
                <div
                  className="h-2 rounded-full bg-[color:var(--primary)]"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
            </section>
          ) : null}
        </aside>
      </section>

      <Modal
        description={copy.checkoutDescription}
        onClose={() => {
          if (!purchaseStage) {
            setCheckoutOpen(false)
          }
        }}
        open={checkoutOpen && isPaidCourse && !purchased}
        title={copy.checkoutTitle}
      >
        <div className="space-y-4">
          <div className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Kurs' : 'Course'}</dt>
                <dd className="theme-heading mt-1 font-medium">{data.title}</dd>
              </div>
              <div>
                <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{t('common.price')}</dt>
                <dd className="theme-heading mt-1 font-medium">
                  {formatCoursePrice(data.price, data.currency, { locale, freeLabel })}
                </dd>
              </div>
              <div>
                <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{copy.paymentProvider}</dt>
                <dd className="theme-heading mt-1 font-medium">MOCK_GATEWAY</dd>
              </div>
              <div>
                <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{copy.paymentMethod}</dt>
                <dd className="theme-heading mt-1 font-medium">CARD</dd>
              </div>
            </dl>
          </div>

          {purchaseError ? (
            <p className="rounded-sm border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-3 py-2 text-sm text-[color:var(--danger)]">
              {purchaseError}
            </p>
          ) : null}

          <Button
            className="w-full justify-center"
            disabled={Boolean(purchaseStage)}
            onClick={() => {
              void handlePaidEnrollment()
            }}
          >
            {purchaseStage === 'payment'
              ? copy.paymentPreparing
              : purchaseStage === 'enrollment'
                ? copy.enrollmentCreating
                : copy.completePayment}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default CourseDetailPage
