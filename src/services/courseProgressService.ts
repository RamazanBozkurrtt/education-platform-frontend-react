import api from './api'
import { API_ENDPOINTS } from './endpoints'
import type {
  ApiEnvelope,
  CourseProgressSummary,
  LessonProgress,
  LessonProgressUpdateRequest,
} from '../utils/types'
import { isAppError } from '../shared/errors/types'

const requireEnvelopeData = <T>(envelope: ApiEnvelope<T>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined' && envelope.data !== null) {
    return envelope.data
  }

  throw new Error(envelope.message || fallbackMessage)
}

const isNotFoundError = (error: unknown) => isAppError(error) && (error.kind === 'not_found' || error.httpStatus === 404)

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const toIdentifier = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  return ''
}

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 1) {
      return true
    }

    if (value === 0) {
      return false
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLocaleLowerCase('en-US')

    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true
    }

    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false
    }
  }

  return undefined
}

const toOptionalDateString = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const mapLessonProgress = (value: unknown): LessonProgress => {
  const payload = toRecord(value)
  const completed = toBoolean(payload.completed ?? payload.isCompleted ?? payload.is_completed)

  return {
    courseId: toIdentifier(payload.courseId ?? payload.course_id),
    lessonId: toIdentifier(payload.lessonId ?? payload.lesson_id),
    lastWatchedSecond: Math.max(0, Math.trunc(toNumber(payload.lastWatchedSecond ?? payload.last_watched_second, 0))),
    watchedPercentage: Math.max(0, Math.min(100, toNumber(payload.watchedPercentage ?? payload.watched_percentage, 0))),
    completed: completed ?? false,
    completedAt: toOptionalDateString(payload.completedAt ?? payload.completed_at),
    updatedAt: toOptionalDateString(payload.updatedAt ?? payload.updated_at),
  }
}

const mapCourseProgressSummary = (value: unknown): CourseProgressSummary => {
  const payload = toRecord(value)

  return {
    courseId: toIdentifier(payload.courseId ?? payload.course_id),
    totalLessons: Math.max(0, Math.trunc(toNumber(payload.totalLessons ?? payload.total_lessons, 0))),
    completedLessons: Math.max(0, Math.trunc(toNumber(payload.completedLessons ?? payload.completed_lessons, 0))),
    overallPercentage: Math.max(0, Math.min(100, toNumber(payload.overallPercentage ?? payload.overall_percentage, 0))),
    lastLessonId: toIdentifier(payload.lastLessonId ?? payload.last_lesson_id) || null,
    lastWatchedSecond: Math.max(0, Math.trunc(toNumber(payload.lastWatchedSecond ?? payload.last_watched_second, 0))),
    lastActivityAt: toOptionalDateString(payload.lastActivityAt ?? payload.last_activity_at),
  }
}

export const courseProgressService = {
  async getLessonProgress(courseId: string, lessonId: string) {
    try {
      const response = await api.get<ApiEnvelope<unknown>>(
        API_ENDPOINTS.courses.lessons.progress(courseId, lessonId),
        { skipGlobalErrorHandling: true },
      )

      return mapLessonProgress(requireEnvelopeData(response.data, 'Lesson progress response is missing data.'))
    } catch (error) {
      if (isNotFoundError(error)) {
        return null
      }

      throw error
    }
  },

  async updateLessonProgress(courseId: string, lessonId: string, payload: LessonProgressUpdateRequest) {
    const response = await api.put<ApiEnvelope<unknown>>(
      API_ENDPOINTS.courses.lessons.progress(courseId, lessonId),
      payload,
      { skipGlobalErrorHandling: true },
    )

    return mapLessonProgress(requireEnvelopeData(response.data, 'Lesson progress update response is missing data.'))
  },

  async getCourseLessonProgress(courseId: string) {
    try {
      const response = await api.get<ApiEnvelope<unknown>>(
        API_ENDPOINTS.courses.lessons.courseProgress(courseId),
        { skipGlobalErrorHandling: true },
      )
      const data = requireEnvelopeData(response.data, 'Course lesson progress response is missing data.')

      if (!Array.isArray(data)) {
        return []
      }

      return data.map((item) => mapLessonProgress(item))
    } catch (error) {
      if (isNotFoundError(error)) {
        return []
      }

      throw error
    }
  },

  async getCourseProgressSummary(courseId: string) {
    try {
      const response = await api.get<ApiEnvelope<unknown>>(
        API_ENDPOINTS.courses.progress(courseId),
        { skipGlobalErrorHandling: true },
      )

      return mapCourseProgressSummary(requireEnvelopeData(response.data, 'Course progress summary response is missing data.'))
    } catch (error) {
      if (isNotFoundError(error)) {
        return null
      }

      throw error
    }
  },
}
