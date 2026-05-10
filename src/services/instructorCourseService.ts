import type { AxiosProgressEvent } from 'axios'
import api from './api'
import { courseMediaService } from './courseMediaService'
import { courseService } from './courseService'
import { API_ENDPOINTS } from './endpoints'
import { mapBackendCourseToCourse } from './courseMappers'
import type { ApiEnvelope, CourseCategoryOption } from '../utils/types'

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
  summaryTitle: string
  description?: string
  duration: number | null
  orderIndex: number
  completed: boolean
  videoUrl: string | null
}

export interface InstructorCourseDetail {
  id: string
  title: string
  description: string
  status: string
  price: number
  categoryId: string
  learningOutcomes: string[]
  tags: string[]
  lessons: InstructorCourseLesson[]
}

export interface InstructorCourseCategoryOption extends CourseCategoryOption {}

interface CreateLessonPayload {
  title: string
  description?: string
  orderIndex: number
}

interface CreateCoursePayload {
  title: string
  description: string
  price: number
  categoryId: string
  learningOutcomes: string[]
  tags: string[]
}

interface UpdateCoursePayload {
  title: string
  description: string
  price: number
  categoryId: string
  learningOutcomes: string[]
  tags: string[]
}

interface UpdateLessonPayload {
  title: string
  summaryTitle?: string
  videoUrl: string | null
  duration: number | null
  orderIndex: number
  completed: boolean
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

const toDurationSeconds = (value: unknown) => {
  const numeric = toNumber(value)

  if (typeof numeric === 'number' && numeric >= 0) {
    return Math.trunc(numeric)
  }

  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const match = trimmed.match(/^(\d{1,3}):(\d{2})(?::(\d{2}))?$/)

  if (!match) {
    return null
  }

  const [, first, second, third] = match
  const firstPart = Number(first)
  const secondPart = Number(second)
  const thirdPart = typeof third === 'string' ? Number(third) : undefined

  if (!Number.isFinite(firstPart) || !Number.isFinite(secondPart)) {
    return null
  }

  if (typeof thirdPart === 'number' && Number.isFinite(thirdPart)) {
    return (firstPart * 3600) + (secondPart * 60) + thirdPart
  }

  return (firstPart * 60) + secondPart
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

const toStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => toText(item))
    .filter((item): item is string => Boolean(item))
}

const createSummaryTitle = (value: string) => value
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .join(' ')

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
  const course = toRecord(source.course)
  const data = toRecord(source.data)
  const courseCandidates = [source, course, data]
  const resolveText = (...values: unknown[]) => values.map((value) => toText(value)).find(Boolean)
  const resolveNumber = (...values: unknown[]) => values.map((value) => toNumber(value)).find((value) => typeof value === 'number')
  const resolveStringArray = (...values: unknown[]) => {
    for (const value of values) {
      const items = toStringArray(value)

      if (items.length > 0) {
        return items
      }
    }

    return []
  }
  const rawLessons = extractRawLessons(source)
  const mappedLessons = rawLessons.map((item, index) => {
    const lesson = toRecord(item)
    const trimmedTitle = toText(lesson.title ?? lesson.name) ?? `Ders ${index + 1}`
    const lessonId = toId(lesson.id ?? lesson.lessonId) ?? `lesson-${index + 1}`
    const title = trimmedTitle
    const summaryTitle = toText(lesson.summaryTitle) ?? (createSummaryTitle(trimmedTitle) || trimmedTitle)
    const description = toText(lesson.description ?? lesson.summary)
    const orderIndex = toNumber(lesson.orderIndex ?? lesson.order) ?? index + 1
    const duration = toDurationSeconds(lesson.duration)
    const completed = toBoolean(lesson.completed) ?? false
    const videoUrl = toText(lesson.videoUrl) ?? null

    return {
      id: lessonId,
      title,
      summaryTitle,
      description,
      duration,
      orderIndex,
      completed,
      videoUrl,
    } satisfies InstructorCourseLesson
  })

  const mappedCourse = mapBackendCourseToCourse(payload)
  const resolvedTitle = resolveText(
    ...courseCandidates.map((candidate) => candidate.title),
    mappedCourse.title,
  ) ?? mappedCourse.title
  const resolvedDescription = resolveText(
    ...courseCandidates.map((candidate) => candidate.description),
    mappedCourse.description,
  ) ?? mappedCourse.description
  const resolvedPrice = resolveNumber(
    ...courseCandidates.map((candidate) => candidate.price),
    mappedCourse.price,
  ) ?? 0
  const resolvedStatus = (resolveText(
    ...courseCandidates.map((candidate) => candidate.status),
  ) ?? 'DRAFT').toLocaleUpperCase('en-US')
  const resolvedCategoryId = resolveText(
    ...courseCandidates.map((candidate) => candidate.categoryId),
    ...courseCandidates.map((candidate) => toId(toRecord(candidate.category).id)),
    ...courseCandidates.map((candidate) => candidate.category),
    mappedCourse.categoryId,
    mappedCourse.category,
  ) ?? ''
  const resolvedLearningOutcomes = resolveStringArray(
    ...courseCandidates.map((candidate) => candidate.learningOutcomes),
    ...courseCandidates.map((candidate) => candidate.outcomes),
    mappedCourse.outcomes,
  )
  const resolvedTags = resolveStringArray(
    ...courseCandidates.map((candidate) => candidate.tags),
    mappedCourse.tags,
  )

  if (mappedLessons.length > 0) {
    return {
      id: mappedCourse.id,
      title: resolvedTitle,
      description: resolvedDescription,
      status: resolvedStatus,
      price: resolvedPrice,
      categoryId: resolvedCategoryId,
      learningOutcomes: resolvedLearningOutcomes,
      tags: resolvedTags,
      lessons: mappedLessons.sort((left, right) => left.orderIndex - right.orderIndex),
    }
  }

  return {
    id: mappedCourse.id,
    title: resolvedTitle,
    description: resolvedDescription,
    status: resolvedStatus,
    price: resolvedPrice,
    categoryId: resolvedCategoryId,
    learningOutcomes: resolvedLearningOutcomes,
    tags: resolvedTags,
    lessons: mappedCourse.modules.map((module, index) => ({
      id: module.id,
      title: module.title,
      summaryTitle: createSummaryTitle(module.title) || module.title,
      description: module.description,
      duration: toDurationSeconds(module.duration),
      orderIndex: module.order ?? index + 1,
      completed: module.completed,
      videoUrl: module.videoUrl?.trim() || null,
    })),
  }
}

export const instructorCourseService = {
  async getPublicCategories() {
    return courseService.getPublicCategories()
  },

  async createCourse(payload: CreateCoursePayload) {
    const requestPayload = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      price: Number.isFinite(payload.price) ? payload.price : 0,
      categoryId: payload.categoryId.trim(),
      learningOutcomes: payload.learningOutcomes.map((item) => item.trim()).filter(Boolean),
      tags: payload.tags.map((item) => item.trim()).filter(Boolean),
    }

    return courseService.createCourse(requestPayload)
  },

  async uploadCourseImage(courseId: string, file: File) {
    await courseMediaService.uploadCourseImage(courseId, file)
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

  async updateCourse(courseId: string, payload: UpdateCoursePayload) {
    const requestPayload = {
      title: payload.title.trim(),
      description: payload.description.trim(),
      price: Number.isFinite(payload.price) ? payload.price : 0,
      categoryId: payload.categoryId.trim(),
      learningOutcomes: payload.learningOutcomes.map((item) => item.trim()).filter(Boolean),
      tags: payload.tags.map((item) => item.trim()).filter(Boolean),
    }

    const response = await api.put<ApiEnvelope<unknown>>(
      API_ENDPOINTS.courses.update(courseId),
      requestPayload,
    )

    return requireEnvelopeData(response.data, 'Course update response is missing data.')
  },

  async updateLesson(courseId: string, lessonId: string, payload: UpdateLessonPayload) {
    const trimmedTitle = payload.title.trim()
    const summaryTitle = payload.summaryTitle?.trim() || createSummaryTitle(trimmedTitle) || trimmedTitle

    const requestPayload = {
      title: trimmedTitle,
      summaryTitle,
      videoUrl: payload.videoUrl,
      duration: Number.isFinite(payload.duration) && typeof payload.duration === 'number'
        ? Math.max(0, Math.trunc(payload.duration))
        : 0,
      orderIndex: Math.max(1, Math.trunc(payload.orderIndex)),
      completed: Boolean(payload.completed),
    }

    const response = await api.put<ApiEnvelope<unknown>>(
      API_ENDPOINTS.courses.lessons.update(courseId, lessonId),
      requestPayload,
    )

    return requireEnvelopeData(response.data, 'Lesson update response is missing data.')
  },

  async deleteLesson(courseId: string, lessonId: string) {
    await api.delete(API_ENDPOINTS.courses.lessons.remove(courseId, lessonId))
  },

  async deleteCourse(courseId: string) {
    await api.delete(API_ENDPOINTS.courses.remove(courseId))
  },

  async publishCourse(courseId: string) {
    return courseService.publishCourse(courseId)
  },

  async unpublishCourse(courseId: string) {
    return courseService.unpublishCourse(courseId)
  },
}
