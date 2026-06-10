import api from './api'
import { API_ENDPOINTS } from './endpoints'
import type {
  ApiEnvelope,
  CreateReviewRequest,
  PagedResponse,
  Review,
  ReviewSummary,
  UpdateReviewRequest,
} from '../utils/types'

interface ReviewListQuery {
  page?: number
  size?: number
  sort?: string
}

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const normalizePagedResponse = <T>(
  value: unknown,
  fallbackPage: number,
  fallbackSize: number,
): PagedResponse<T> => {
  const payload = toRecord(value)
  const content = Array.isArray(payload.content)
    ? payload.content as T[]
    : Array.isArray(payload.items)
      ? payload.items as T[]
      : []
  const numberValue = typeof payload.number === 'number'
    ? payload.number
    : typeof payload.pageNumber === 'number'
      ? payload.pageNumber
      : fallbackPage
  const sizeValue = typeof payload.size === 'number'
    ? payload.size
    : typeof payload.pageSize === 'number'
      ? payload.pageSize
      : fallbackSize
  const totalElements = typeof payload.totalElements === 'number'
    ? payload.totalElements
    : content.length
  const totalPages = typeof payload.totalPages === 'number'
    ? payload.totalPages
    : (content.length < sizeValue ? numberValue + 1 : numberValue + 2)
  const last = typeof payload.last === 'boolean'
    ? payload.last
    : numberValue >= Math.max(0, totalPages - 1)

  return {
    content,
    number: numberValue,
    size: sizeValue,
    totalElements,
    totalPages,
    last,
  }
}

const requireEnvelopeData = <T>(envelope: ApiEnvelope<T>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined' && envelope.data !== null) {
    return envelope.data
  }

  throw new Error(envelope.message || fallbackMessage)
}

const normalizeIdentifier = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  return ''
}

const normalizeCourseId = (courseId: string) => normalizeIdentifier(courseId)
const normalizeReviewId = (reviewId: unknown) => {
  const normalized = normalizeIdentifier(reviewId)

  if (!normalized) {
    throw new Error('Review id is required.')
  }

  return normalized
}

const normalizeReviewPayload = (payload: CreateReviewRequest | UpdateReviewRequest) => ({
  rating: payload.rating,
  comment: payload.comment.trim(),
})

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLocaleLowerCase('en-US')

    if (normalized === 'true') {
      return true
    }

    if (normalized === 'false') {
      return false
    }
  }

  return undefined
}

const toText = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const normalizeReview = (value: unknown): Review => {
  const payload = toRecord(value)
  const rating = toNumber(payload.rating) ?? 0
  const normalizedId = normalizeIdentifier(payload.id ?? payload.reviewId)
  const fallbackIdSource = [
    normalizeIdentifier(payload.userId ?? payload.user_id),
    toText(payload.createdAt),
  ].filter(Boolean).join('-')

  return {
    id: normalizedId || `review-${fallbackIdSource || 'unknown'}`,
    courseId: normalizeIdentifier(payload.courseId ?? payload.course_id),
    userId: normalizeIdentifier(payload.userId ?? payload.user_id),
    userDisplayName: toText(payload.userDisplayName ?? payload.userName ?? payload.fullName),
    userProfileImageUrl: toText(payload.userProfileImageUrl ?? payload.profileImageUrl),
    rating: Math.max(0, Math.min(5, Math.round(rating))),
    comment: toText(payload.comment) ?? '',
    createdAt: toText(payload.createdAt) ?? '',
    updatedAt: toText(payload.updatedAt) ?? toText(payload.createdAt) ?? '',
    ownedByCurrentUser: toBoolean(payload.ownedByCurrentUser ?? payload.ownedByUser),
  }
}

const normalizeReviewSummary = (value: unknown): ReviewSummary => {
  const payload = toRecord(value)
  const distributionPayload = toRecord(payload.ratingDistribution ?? payload.distribution)
  const normalizedDistribution: Record<string, number> = {}

  for (const rating of [1, 2, 3, 4, 5]) {
    normalizedDistribution[String(rating)] = Math.max(0, Math.round(toNumber(distributionPayload[String(rating)]) ?? 0))
  }

  return {
    courseId: normalizeIdentifier(payload.courseId ?? payload.course_id),
    averageRating: Math.max(0, Math.min(5, toNumber(payload.averageRating ?? payload.avgRating) ?? 0)),
    totalReviews: Math.max(0, Math.round(toNumber(payload.totalReviews ?? payload.reviewCount) ?? 0)),
    ratingDistribution: normalizedDistribution,
  }
}

export const reviewService = {
  async getCourseReviewSummary(courseId: string) {
    const response = await api.get<ApiEnvelope<ReviewSummary>>(
      API_ENDPOINTS.reviews.byCourseSummary(normalizeCourseId(courseId)),
      { skipGlobalErrorHandling: true },
    )

    return normalizeReviewSummary(requireEnvelopeData(response.data, 'Course review summary response is missing data.'))
  },

  async getCourseReviews(courseId: string, params: ReviewListQuery = {}) {
    const page = params.page ?? 0
    const size = params.size ?? 10
    const response = await api.get<ApiEnvelope<PagedResponse<Review>>>(
      API_ENDPOINTS.reviews.byCourse(normalizeCourseId(courseId)),
      {
        params: {
          page,
          size,
          sort: params.sort ?? 'createdAt,desc',
        },
        skipGlobalErrorHandling: true,
      },
    )

    const data = requireEnvelopeData(response.data, 'Course review list response is missing data.')
    const normalized = normalizePagedResponse<Review>(data, page, size)

    return {
      ...normalized,
      content: normalized.content.map((item) => normalizeReview(item)),
    }
  },

  async createCourseReview(courseId: string, payload: CreateReviewRequest) {
    const response = await api.post<ApiEnvelope<Review>>(
      API_ENDPOINTS.reviews.byCourse(normalizeCourseId(courseId)),
      normalizeReviewPayload(payload),
      { skipGlobalErrorHandling: true },
    )

    return normalizeReview(requireEnvelopeData(response.data, 'Review create response is missing data.'))
  },

  async updateReview(reviewId: string, payload: UpdateReviewRequest) {
    const response = await api.put<ApiEnvelope<Review>>(
      API_ENDPOINTS.reviews.byId(normalizeReviewId(reviewId)),
      normalizeReviewPayload(payload),
      { skipGlobalErrorHandling: true },
    )

    return normalizeReview(requireEnvelopeData(response.data, 'Review update response is missing data.'))
  },

  async deleteReview(reviewId: string) {
    const response = await api.delete<ApiEnvelope<null> | undefined>(
      API_ENDPOINTS.reviews.byId(normalizeReviewId(reviewId)),
      { skipGlobalErrorHandling: true },
    )
    const rawData = response.data as unknown

    if (
      response.status === 204 ||
      typeof rawData === 'undefined' ||
      rawData === null ||
      (typeof rawData === 'string' && rawData.trim() === '')
    ) {
      return null
    }

    const envelope = rawData as ApiEnvelope<null>
    return envelope.data ?? null
  },

  async getMyReviews(params: ReviewListQuery = {}) {
    const page = params.page ?? 0
    const size = params.size ?? 10
    const response = await api.get<ApiEnvelope<PagedResponse<Review>>>(API_ENDPOINTS.reviews.myReviews, {
      params: {
        page,
        size,
        sort: params.sort,
      },
      skipGlobalErrorHandling: true,
    })

    const data = requireEnvelopeData(response.data, 'My reviews response is missing data.')
    const normalized = normalizePagedResponse<Review>(data, page, size)

    return {
      ...normalized,
      content: normalized.content.map((item) => normalizeReview(item)),
    }
  },
}
