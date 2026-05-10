import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, BadgeCheck, BookOpen, CheckCircle2, Clock3, PlayCircle, ShoppingCart, Star, Users2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import InfoBadge from '../components/ui/InfoBadge'
import Loader from '../components/ui/Loader'
import MetaRow from '../components/ui/MetaRow'
import QueryErrorState from '../components/ui/QueryErrorState'
import SectionHeader from '../components/ui/SectionHeader'
import TagList from '../components/ui/TagList'
import CourseReviewList from '../components/reviews/CourseReviewList'
import CourseReviewSummary from '../components/reviews/CourseReviewSummary'
import ReviewForm from '../components/reviews/ReviewForm'
import { courseService } from '../services/courseService'
import { reviewService } from '../services/reviewService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { formatCurrency } from '../utils/helpers'
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

const CourseDetailPage = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { language } = useLanguage()
  const { user, claims, isAuthenticated } = useAuth()
  const { addCourse, isInCart } = useCart()
  const { isPurchased } = useLibrary()
  const { slug = '' } = useParams()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null)

  const copy = language === 'tr'
    ? {
      detailsTitle: 'Kurs detaylar\u0131',
      detailsDescription: 'Kurs \u00f6zeti, dersler ve de\u011ferlendirmeler.',
      lessonsTitle: 'Dersler',
      lessonsDescription: 'Bu kurs i\u00e7in ders listesi.',
      tags: 'Etiketler',
      ratingLabel: 'Puan',
      statusTitle: 'Kurs durumu',
      statusDescription: 'Eri\u015fim ve sat\u0131n alma i\u015flemleri.',
      purchased: 'Kursa eri\u015fimin var',
      notPurchased: 'Hen\u00fcz sat\u0131n al\u0131nmad\u0131',
      reviewTitle: 'De\u011ferlendirmeler',
      reviewCount: 'degerlendirme',
      yourReview: 'Bu kurs i\u00e7in de\u011ferlendirmen',
      deleteReview: 'De\u011ferlendirmeyi sil',
      reviewLoginRequired: 'Devam etmek i\u00e7in giri\u015f yapmal\u0131s\u0131n.',
      noTag: 'Etiket yok.',
      noOutcome: 'Bu kurs i\u00e7in \u00f6\u011frenim kazan\u0131m\u0131 eklenmemi\u015f.',
      noLessons: 'Bu kurs i\u00e7in hen\u00fcz ders eklenmedi.',
      instructorTitle: 'E\u011fitmen',
      progressTitle: '\u0130lerleme',
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
      yourReview: 'Your review for this course',
      deleteReview: 'Delete review',
      reviewLoginRequired: 'Sign in to leave a review.',
      noTag: 'No tags added.',
      noOutcome: 'No learning outcomes added for this course.',
      noLessons: 'No lessons have been added to this course yet.',
      instructorTitle: 'Instructor',
      progressTitle: 'Progress',
    }

  const { data, error, isLoading } = useQuery({
    queryKey: ['course', language, slug],
    queryFn: () => courseService.getCourseBySlug(slug, language),
  })

  const courseId = data?.id ?? ''
  const isUserAdmin = isAdmin(user, claims)

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

  useEffect(() => {
    if (!courseId) {
      return
    }

    console.log('[REVIEW_FLOW] courseId:', courseId)
  }, [courseId])

  useEffect(() => {
    if (!reviewSummary) {
      return
    }

    console.log('[REVIEW_FLOW] summary:', reviewSummary)
  }, [reviewSummary])

  useEffect(() => {
    console.log('[REVIEW_FLOW] reviews:', reviews)
  }, [reviews])

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
      console.log('[REVIEW_FLOW] create payload:', payload)
      const response = await reviewService.createCourseReview(courseId, payload)
      console.log('[REVIEW_FLOW] create response:', response)
      return response
    },
  })

  const updateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, payload }: { reviewId: string; payload: UpdateReviewRequest }) => {
      const response = await reviewService.updateReview(reviewId, payload)
      console.log('[REVIEW_FLOW] update response:', response)
      return response
    },
  })

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await reviewService.deleteReview(reviewId)
      console.log('[REVIEW_FLOW] delete response:', response)
      return response
    },
  })

  const handleReviewSubmit = async (payload: CreateReviewRequest | UpdateReviewRequest) => {
    if (!courseId) {
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
      const axiosLikeError = error_ as { response?: { status?: number; data?: unknown } }
      console.log('[REVIEW_FLOW] error:', axiosLikeError.response?.status, axiosLikeError.response?.data)
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
      const axiosLikeError = error_ as { response?: { status?: number; data?: unknown } }
      console.log('[REVIEW_FLOW] error:', axiosLikeError.response?.status, axiosLikeError.response?.data)
      setSubmitError(resolveErrorMessageFromPayload(error_))
    } finally {
      setDeletingReviewId(null)
    }
  }

  const canEditReview = (review: Review) => Boolean(review.ownedByCurrentUser || review.userId === user?.id)
  const canDeleteReview = (review: Review) => canEditReview(review) || isUserAdmin

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !data) {
    return <Loader label={t('loader.courseDetails')} />
  }

  const purchased = isPurchased(data.id)

  return (
    <div className="space-y-7">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.16em]">{getCourseCategoryLabel(data)}</p>
            <h1 className="theme-heading mt-2 break-words text-3xl font-semibold leading-tight md:text-4xl">{data.title}</h1>
            <p className="theme-muted mt-3 text-sm leading-7">{data.description}</p>

            <MetaRow
              className="mt-4"
              items={[
                { key: 'rating', icon: Star, label: copy.ratingLabel, value: data.rating.toFixed(1) },
                { key: 'instructor', label: copy.instructorTitle, value: data.instructor.name },
                { key: 'duration', icon: Clock3, label: t('courseDetail.duration'), value: data.duration },
                { key: 'lessons', icon: BookOpen, label: t('courseDetail.lessons'), value: t('courseDetail.lessonsValue', { count: data.lessons }) },
                { key: 'students', icon: Users2, label: t('courseDetail.enrolled'), value: t('courseDetail.enrolledValue', { students: data.students }) },
                { key: 'level', label: 'Seviye', value: data.level },
              ]}
            />

            <div className="mt-4">
              <TagList emptyText={copy.noTag} hideWhenEmpty label={copy.tags} tags={data.tags} />
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {purchased ? (
              <Link className="w-full sm:w-auto" to={ROUTES.coursePlayer(data.slug)}>
                <Button asChild className="w-full justify-center">
                  <PlayCircle className="h-4 w-4" />
                  {t('common.watchCourse')}
                </Button>
              </Link>
            ) : isInCart(data.id) ? (
              <Link className="w-full sm:w-auto" to={ROUTES.cart}>
                <Button asChild className="w-full justify-center" variant="secondary">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('common.goToCart')}
                </Button>
              </Link>
            ) : (
              <Button className="w-full justify-center sm:w-auto" onClick={() => addCourse(data.id)}>
                <ShoppingCart className="h-4 w-4" />
                {t('common.addToCart')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="min-w-0 space-y-6">
          <Card>
            <SectionHeader
              description={copy.detailsDescription}
              title={copy.detailsTitle}
            />

            {data.outcomes.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.outcomes.map((outcome) => (
                  <div className="flex gap-3 rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]" key={outcome}>
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--primary)]" />
                    <p className="theme-text text-sm leading-6">{outcome}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="theme-muted mt-4 text-sm">{copy.noOutcome}</p>
            )}
          </Card>

          <Card>
            <SectionHeader
              description={copy.lessonsDescription}
              title={copy.lessonsTitle}
            />

            {data.modules.length > 0 ? (
              <div className="mt-4 space-y-3">
                {data.modules.map((module, index) => (
                  <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-4 transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]" key={module.id}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-navigation)] bg-[color:var(--surface-muted)] text-xs font-semibold theme-heading">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <p className="theme-heading truncate font-medium">{module.title}</p>
                          <p className="theme-muted mt-1 text-xs">
                            {module.type} - {module.duration}
                          </p>
                        </div>
                      </div>
                      <InfoBadge tone={module.completed ? 'success' : 'warning'}>
                        {module.completed ? t('common.completed') : t('common.upcoming')}
                      </InfoBadge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="theme-muted mt-4 text-sm">{copy.noLessons}</p>
            )}
          </Card>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
            <CourseReviewSummary isLoading={isReviewSummaryLoading} summary={reviewSummary} />

            <Card>
              <SectionHeader
                action={
                  reviewSummary?.totalReviews ? (
                    <InfoBadge>
                      {reviewSummary.totalReviews} {copy.reviewCount}
                    </InfoBadge>
                  ) : null
                }
                title={copy.reviewTitle}
              />

              {successMessage ? (
                <div className="mt-4 rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] px-4 py-3 text-sm theme-heading">
                  {successMessage}
                </div>
              ) : null}

              {isAuthenticated ? (
                <div className="mt-5">
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
                <p className="theme-muted mt-4 text-sm">{copy.reviewLoginRequired}</p>
              )}

              {reviewSummaryError || reviewListError ? (
                <div className="mt-6 rounded-[var(--radius-cards)] border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
                  {resolveErrorMessageFromPayload(reviewSummaryError ?? reviewListError)}
                </div>
              ) : (
                <div className="mt-6">
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
            </Card>
          </section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <SectionHeader
              description={copy.statusDescription}
              title={copy.statusTitle}
            />

            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <p className="theme-muted text-sm">{t('common.price')}</p>
                <p className="theme-heading mt-1 text-3xl font-semibold">{formatCurrency(data.price)}</p>
              </div>
              <InfoBadge>{data.level}</InfoBadge>
            </div>

            <div className="mt-4">
              <InfoBadge tone={purchased ? 'success' : 'warning'}>
                {purchased ? copy.purchased : copy.notPurchased}
              </InfoBadge>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {purchased ? (
                <Link className="sm:col-span-2" to={ROUTES.coursePlayer(data.slug)}>
                  <Button asChild className="w-full justify-center">
                    <PlayCircle className="h-4 w-4" />
                    {t('common.watchCourse')}
                  </Button>
                </Link>
              ) : isInCart(data.id) ? (
                <Link className="sm:col-span-2" to={ROUTES.cart}>
                  <Button asChild className="w-full justify-center" variant="secondary">
                    <CheckCircle2 className="h-4 w-4" />
                    {t('common.goToCart')}
                  </Button>
                </Link>
              ) : (
                <Button className="w-full justify-center sm:col-span-2" onClick={() => addCourse(data.id)}>
                  <ShoppingCart className="h-4 w-4" />
                  {t('common.addToCart')}
                </Button>
              )}
              {!purchased ? (
                <Link className="sm:col-span-2" to={ROUTES.payment}>
                  <Button asChild className="w-full justify-center" variant="ghost">
                    {t('common.continueToPayment')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </Card>

          <Card>
            <SectionHeader title={copy.instructorTitle} />
            <h3 className="theme-heading mt-3 text-xl font-semibold">{data.instructor.name}</h3>
            <p className="theme-muted mt-1 text-sm">{data.instructor.role}</p>
            <p className="theme-text mt-4 text-sm leading-7">{data.instructor.bio}</p>
          </Card>

          {purchased ? (
            <Card>
              <SectionHeader title={copy.progressTitle} />
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
            </Card>
          ) : null}
        </aside>
      </section>
    </div>
  )
}

export default CourseDetailPage

