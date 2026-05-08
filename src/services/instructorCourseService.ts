import type { AxiosProgressEvent } from 'axios'
import api from './api'
import { courseMediaService } from './courseMediaService'
import { courseService } from './courseService'
import { API_ENDPOINTS } from './endpoints'
import { mapBackendCourseToCourse } from './courseMappers'
import type { ApiEnvelope } from '../utils/types'

const VIDEO_UPLOAD_TIMEOUT_MS = 30 * 60_000

const requireEnvelopeData = <T>(envelope: ApiEnvelope<T>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined') {
    return envelope.data
  }

  throw new Error(envelope.message || fallbackMessage)
}

export interface InstructorCourseLesson {
  id: string
  title: string
  description?: string
  orderIndex: number
  videoUrl: string | null
}

export interface InstructorCourseDetail {
  id: string
  title: string
  description: string
  lessons: InstructorCourseLesson[]
}

interface CreateLessonPayload {
  title: string
  description?: string
  orderIndex: number
}

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const toText = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const toId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }

  return toText(value)
}

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

const extractRawLessons = (payload: Record<string, unknown>) => {
  const course = toRecord(payload.course)
  const data = toRecord(payload.data)
  const candidates = [
    payload.lessons,
    payload.lessonList,
    payload.lessonsList,
    payload.modules,
    course.lessons,
    course.lessonList,
    course.lessonsList,
    course.modules,
    data.lessons,
    data.lessonList,
    data.lessonsList,
    data.modules,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

const toCourseDetail = (payload: unknown): InstructorCourseDetail => {
  const source = toRecord(payload)
  const rawLessons = extractRawLessons(source)
  const mappedLessons = rawLessons.map((item, index) => {
    const lesson = toRecord(item)
    const lessonId = toId(lesson.id ?? lesson.lessonId) ?? `lesson-${index + 1}`
    const title = toText(lesson.title ?? lesson.name) ?? `Ders ${index + 1}`
    const description = toText(lesson.description ?? lesson.summary)
    const orderIndex = toNumber(lesson.orderIndex ?? lesson.order) ?? index + 1
    const videoUrl = toText(lesson.videoUrl) ?? null

    return {
      id: lessonId,
      title,
      description,
      orderIndex,
      videoUrl,
    } satisfies InstructorCourseLesson
  })

  if (mappedLessons.length > 0) {
    const mappedCourse = mapBackendCourseToCourse(payload)

    return {
      id: mappedCourse.id,
      title: mappedCourse.title,
      description: mappedCourse.description,
      lessons: mappedLessons.sort((left, right) => left.orderIndex - right.orderIndex),
    }
  }

  const mappedCourse = mapBackendCourseToCourse(payload)

  return {
    id: mappedCourse.id,
    title: mappedCourse.title,
    description: mappedCourse.description,
    lessons: mappedCourse.modules.map((module, index) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      orderIndex: module.order ?? index + 1,
      videoUrl: module.videoUrl?.trim() || null,
    })),
  }
}

export const instructorCourseService = {
  async createCourse(payload: Record<string, unknown>) {
    return courseService.createCourse(payload)
  },

  async getCourseById(courseId: string) {
    const response = await api.get<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.authorizedDetail(courseId))
    const data = requireEnvelopeData(response.data, 'Course detail response is missing data.')
    return toCourseDetail(data)
  },

  async uploadLessonVideo(
    courseId: string,
    lessonId: string,
    file: File,
    onUploadProgress?: (event: AxiosProgressEvent) => void,
  ) {
    const formData = new FormData()
    formData.append('file', file)

    await api.put(
      API_ENDPOINTS.courses.lessons.video(courseId, lessonId),
      formData,
      {
        onUploadProgress,
        timeout: VIDEO_UPLOAD_TIMEOUT_MS,
      },
    )
  },

  async uploadCourseVideo(courseId: string, payload: { lessonId: string; file: File }) {
    await instructorCourseService.uploadLessonVideo(courseId, payload.lessonId, payload.file)
  },

  async deleteLessonVideo(courseId: string, lessonId: string) {
    await api.delete(API_ENDPOINTS.courses.lessons.video(courseId, lessonId))
  },

  async getLessonPlaybackUrl(courseId: string, lessonId: string) {
    return courseMediaService.getLessonPlaybackUrl(courseId, lessonId)
  },

  async createLesson(courseId: string, payload: CreateLessonPayload) {
    const trimmedTitle = payload.title.trim()
    const summaryTitle = trimmedTitle
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .join(' ')

    const requestPayload = {
      title: trimmedTitle,
      summaryTitle: summaryTitle || trimmedTitle,
      duration: 1,
      orderIndex: payload.orderIndex,
      completed: false,
      description: payload.description?.trim() || undefined,
    }

    const response = await api.post<ApiEnvelope<unknown>>(
      API_ENDPOINTS.courses.lessons.create(courseId),
      requestPayload,
    )

    return requireEnvelopeData(response.data, 'Lesson create response is missing data.')
  },

  async publishCourse(courseId: string) {
    return courseService.publishCourse(courseId)
  },
}
