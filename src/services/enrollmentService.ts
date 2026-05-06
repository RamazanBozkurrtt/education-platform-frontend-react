import api from './api'
import { API_ENDPOINTS } from './endpoints'
import type { ApiEnvelope } from '../utils/types'
import { isAppError } from '../shared/errors/types'

interface EnrollmentCreateRequest {
  courseId: string
  userId?: string
}

const requireEnvelopeData = <T>(envelope: ApiEnvelope<T>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined') {
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

export const enrollmentService = {
  async createEnrollment(payload: EnrollmentCreateRequest) {
    try {
      const response = await api.post<ApiEnvelope<unknown>>(API_ENDPOINTS.enrollments.create, payload)
      return requireEnvelopeData(response.data, 'Enrollment response is missing data.')
    } catch (error) {
      if (isAlreadyEnrolledConflict(error)) {
        return null
      }

      throw error
    }
  },

  async createEnrollments(courseIds: string[], userId?: string) {
    const uniqueCourseIds = [...new Set(courseIds.map((courseId) => courseId.trim()).filter(Boolean))]

    for (const courseId of uniqueCourseIds) {
      await enrollmentService.createEnrollment({
        courseId,
        userId,
      })
    }
  },
}
