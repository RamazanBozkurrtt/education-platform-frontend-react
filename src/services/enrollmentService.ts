import api from './api'
import { API_ENDPOINTS } from './endpoints'
import type { ApiEnvelope } from '../utils/types'
import { isAppError } from '../shared/errors/types'
import type { AxiosRequestConfig } from 'axios'

export interface EnrollmentCreateRequest {
  courseId: string
  userId?: number
}

export interface EnrollmentResponse {
  id: number
  courseId: string
  userId: number
  status: 'ACTIVE' | 'CANCELLED'
  createdAt: string
  updatedAt: string
}

export interface CustomPageResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

interface EnrollmentListQuery {
  pageNumber?: number
  pageSize?: number
}

interface EnrollmentRequestOptions {
  skipGlobalErrorHandling?: boolean
}

const requireEnvelopeData = <T>(envelope: ApiEnvelope<T>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined' && envelope.data !== null) {
    return envelope.data
  }

  throw new Error(envelope.message || fallbackMessage)
}

const isAlreadyEnrolledConflict = (error: unknown) => {
  if (!isAppError(error)) {
    return false
  }

  return error.httpStatus === 409
}

const normalizeCourseId = (courseId: string) => courseId.trim()

const normalizeOptionalUserId = (userId?: number) => {
  if (typeof userId !== 'number' || !Number.isFinite(userId)) {
    return undefined
  }

  const normalizedUserId = Math.trunc(userId)
  return normalizedUserId > 0 ? normalizedUserId : undefined
}

const buildEnrollmentCreatePayload = (payload: EnrollmentCreateRequest): EnrollmentCreateRequest => {
  const courseId = normalizeCourseId(payload.courseId)
  const userId = normalizeOptionalUserId(payload.userId)

  return userId
    ? { courseId, userId }
    : { courseId }
}

const toRequestConfig = (options?: EnrollmentRequestOptions): AxiosRequestConfig => ({
  skipGlobalErrorHandling: options?.skipGlobalErrorHandling,
})

export const enrollmentService = {
  async createEnrollment(payload: EnrollmentCreateRequest, options?: EnrollmentRequestOptions) {
    try {
      const response = await api.post<ApiEnvelope<EnrollmentResponse>>(
        API_ENDPOINTS.enrollments.create,
        buildEnrollmentCreatePayload(payload),
        toRequestConfig(options),
      )
      return requireEnvelopeData(response.data, 'Enrollment response is missing data.')
    } catch (error) {
      if (isAlreadyEnrolledConflict(error)) {
        return null
      }

      throw error
    }
  },

  async createEnrollments(courseIds: string[], userId?: number, options?: EnrollmentRequestOptions) {
    const uniqueCourseIds = [...new Set(courseIds.map((courseId) => courseId.trim()).filter(Boolean))]

    for (const courseId of uniqueCourseIds) {
      await enrollmentService.createEnrollment({
        courseId,
        userId,
      }, options)
    }
  },

  async getEnrollmentById(enrollmentId: number | string) {
    const response = await api.get<ApiEnvelope<EnrollmentResponse>>(API_ENDPOINTS.enrollments.byId(enrollmentId))
    return requireEnvelopeData(response.data, 'Enrollment detail response is missing data.')
  },

  async getMyEnrollments({ pageNumber = 0, pageSize = 10 }: EnrollmentListQuery = {}) {
    const response = await api.get<ApiEnvelope<CustomPageResponse<EnrollmentResponse>>>(
      API_ENDPOINTS.enrollments.me,
      {
        params: { pageNumber, pageSize },
      },
    )

    return requireEnvelopeData(response.data, 'Enrollment list response is missing data.')
  },

  async getEnrollmentsByCourse(courseId: string, { pageNumber = 0, pageSize = 10 }: EnrollmentListQuery = {}) {
    const normalizedCourseId = normalizeCourseId(courseId)
    const response = await api.get<ApiEnvelope<CustomPageResponse<EnrollmentResponse>>>(
      API_ENDPOINTS.enrollments.byCourse(normalizedCourseId),
      {
        params: { pageNumber, pageSize },
      },
    )

    return requireEnvelopeData(response.data, 'Course enrollment list response is missing data.')
  },

  async cancelEnrollment(enrollmentId: number | string) {
    await api.delete(API_ENDPOINTS.enrollments.byId(enrollmentId))
  },
}
