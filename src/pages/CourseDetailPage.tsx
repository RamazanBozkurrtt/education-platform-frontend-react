import { useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, BadgeCheck, BookOpen, CheckCircle2, Clock3, PlayCircle, ShoppingCart, Star, Users2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
import { useAuth } from '../hooks/useAuth'
import PageHeader from '../components/PageHeader'
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
    return 'Lütfen girdiğiniz bilgileri kontrol edin.'
  }

  if (appError.httpStatus === 401) {
    return 'Değerlendirme yapmak için giriş yapmalısın.'
  }

  if (appError.httpStatus === 403) {
    return 'Bu işlem için yetkin yok.'
  }

  if (appError.httpStatus === 404) {
    return 'Kurs veya değerlendirme bulunamadı.'
  }

  if (appError.httpStatus === 409) {
    return 'Bu kurs için daha önce değerlendirme yapmışsın.'
  }

  if (appError.httpStatus && appError.httpStatus >= 500) {
    return 'Değerlendirme işlemi sırasında beklenmeyen bir sorun oluştu.'
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
      courseInfoTitle: 'Kurs bilgileri',
      courseInfoDescription: 'Öne çıkan detayları buradan inceleyebilirsin.',
      detailsTitle: 'Kurs içeriği',
      detailsDescription: 'Bu kursta işleyeceğin dersler aşağıda listelenir.',
      tags: 'Etiketler',
      ratingLabel: 'Puan',
      statusTitle: 'Kurs durumu',
      statusDescription: 'Satın alma ve erişim işlemlerini bu alandan yönetebilirsin.',
      purchased: 'Kursa erişimin var',
      notPurchased: 'Henüz satın alınmadı',
      reviewTitle: 'Değerlendirmeler',
      reviewCount: 'yorum',
      yourReview: 'Bu kurs için değerlendirme notun',
      deleteReview: 'Değerlendirmeyi sil',
      reviewLoginRequired: 'Yorum yapmak için giriş yapmalısın.',
      noTag: 'Etiket eklenmemiş.',
      noOutcome: 'Bu kurs için öğrenim kazanımı eklenmemiş.',
    }
    : {
      courseInfoTitle: 'Course details',
      courseInfoDescription: 'Review key information before you start.',
      detailsTitle: 'Course content',
      detailsDescription: 'Lessons included in this course.',
      tags: 'Tags',
      ratingLabel: 'Rating',
      statusTitle: 'Course status',
      statusDescription: 'Manage purchase and access actions here.',
      purchased: 'You have access',
      notPurchased: 'Not purchased yet',
      reviewTitle: 'Reviews',
      reviewCount: 'reviews',
      yourReview: 'Your review for this course',
      deleteReview: 'Delete review',
      reviewLoginRequired: 'Sign in to leave a review.',
      noTag: 'No tags added.',
      noOutcome: 'No learning outcomes added for this course.',
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
        setSuccessMessage(language === 'tr' ? 'Değerlendirme güncellendi.' : 'Review updated.')
      } else {
        await createReviewMutation.mutateAsync(payload)
        setSuccessMessage(language === 'tr' ? 'Değerlendirme kaydedildi.' : 'Review submitted.')
      }

      await refreshReviewData()
    } catch (error_) {
      const axiosLikeError = error_ as { response?: { status?: number; data?: unknown } }
      console.log('[REVIEW_FLOW] error:', axiosLikeError.response?.status, axiosLikeError.response?.data)
      const appError = normalizeApiError(error_)

      if (appError.httpStatus === 409) {
        setSubmitError(
          language === 'tr'
            ? 'Bu kurs için zaten yorum yapmışsın. Mevcut yorumunu güncelleyebilirsin.'
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

      setSuccessMessage(language === 'tr' ? 'Değerlendirme silindi.' : 'Review deleted.')
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
    <div className="space-y-6">
      <PageHeader
        actions={
          purchased ? (
            <Link to={ROUTES.coursePlayer(data.slug)}>
              <Button asChild>
                <PlayCircle className="h-4 w-4" />
                {t('common.watchCourse')}
              </Button>
            </Link>
          ) : isInCart(data.id) ? (
            <Link to={ROUTES.cart}>
              <Button asChild variant="secondary">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                {t('common.goToCart')}
              </Button>
            </Link>
          ) : (
            <Button onClick={() => addCourse(data.id)}>
              <ShoppingCart className="h-4 w-4" />
              {t('common.addToCart')}
            </Button>
          )
        }
        description={data.description}
        eyebrow={data.category}
        title={data.title}
      />

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card>
          <SectionHeader
            description={copy.courseInfoDescription}
            title={copy.courseInfoTitle}
          />

          <MetaRow
            className="mt-5"
            items={[
              { key: 'duration', icon: Clock3, label: t('courseDetail.duration'), value: data.duration },
              { key: 'lessons', icon: BookOpen, label: t('courseDetail.lessons'), value: t('courseDetail.lessonsValue', { count: data.lessons }) },
              { key: 'students', icon: Users2, label: t('courseDetail.enrolled'), value: t('courseDetail.enrolledValue', { students: data.students }) },
              { key: 'rating', icon: Star, label: copy.ratingLabel, value: data.rating.toFixed(1) },
              { key: 'level', label: 'Seviye', value: data.level },
            ]}
          />

          <div className="mt-5 border-t border-white/8 pt-5">
            <TagList emptyText={copy.noTag} label={copy.tags} tags={data.tags} />
          </div>

          <div className="mt-7 border-t border-white/8 pt-6">
            <SectionHeader
              description={copy.detailsDescription}
              title={copy.detailsTitle}
            />

            {data.outcomes.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.outcomes.map((outcome) => (
                  <div key={outcome} className="flex gap-3 rounded-lg border border-white/8 bg-[color:var(--surface-muted)] p-4">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                    <p className="text-sm leading-6 text-slate-300">{outcome}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">{copy.noOutcome}</p>
            )}

            <div className="mt-6 space-y-3">
              {data.modules.map((module, index) => (
                <div key={module.id} className="rounded-lg border border-white/8 bg-[color:var(--surface-muted)] px-4 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--surface-strong)] text-xs font-semibold text-slate-200">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div>
                        <p className="font-medium text-white">{module.title}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {module.type} · {module.duration}
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
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionHeader
              description={copy.statusDescription}
              title={copy.statusTitle}
            />

            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">{t('common.price')}</p>
                <p className="mt-1 text-3xl font-semibold text-white">{formatCurrency(data.price)}</p>
              </div>
              <InfoBadge>{data.level}</InfoBadge>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <InfoBadge tone={purchased ? 'success' : 'warning'}>
                {purchased ? copy.purchased : copy.notPurchased}
              </InfoBadge>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {purchased ? (
                <Link to={ROUTES.coursePlayer(data.slug)}>
                  <Button asChild>
                    <PlayCircle className="h-4 w-4" />
                    {t('common.watchCourse')}
                  </Button>
                </Link>
              ) : isInCart(data.id) ? (
                <Link to={ROUTES.cart}>
                  <Button asChild variant="secondary">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {t('common.goToCart')}
                  </Button>
                </Link>
              ) : (
                <Button onClick={() => addCourse(data.id)}>
                  <ShoppingCart className="h-4 w-4" />
                  {t('common.addToCart')}
                </Button>
              )}
              {!purchased ? (
                <Link to={ROUTES.payment}>
                  <Button asChild variant="ghost">
                    {t('common.continueToPayment')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-medium text-slate-400">{t('courseDetail.instructor')}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{data.instructor.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{data.instructor.role}</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">{data.instructor.bio}</p>
          </Card>

          {purchased ? (
            <Card>
              <p className="text-xs font-medium text-slate-400">{t('courseDetail.progressSnapshot')}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-2xl font-semibold text-white">%{data.progress}</p>
                <p className="text-sm text-slate-400">{t('dashboard.progressComplete', { progress: data.progress })}</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-200/15">
                <div
                  className="h-2 rounded-full bg-[color:var(--primary)]"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
            </Card>
          ) : null}
        </div>
      </section>

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
            <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          ) : null}

          {isAuthenticated ? (
            <div className="mt-5">
              {visibleEditReview ? (
                <p className="mb-3 text-sm font-medium text-slate-200">{copy.yourReview}</p>
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
            <p className="mt-4 text-sm text-slate-300">{copy.reviewLoginRequired}</p>
          )}

          {reviewSummaryError || reviewListError ? (
            <div className="mt-6 rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
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
  )
}

export default CourseDetailPage
