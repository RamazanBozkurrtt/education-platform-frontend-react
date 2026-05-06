import api from './api'
import { API_ENDPOINTS } from './endpoints'
import { extractCourseCollection, mapBackendCourseToCourse } from './courseMappers'
import type {
  ApiEnvelope,
  AppLanguage,
  Course,
  DashboardOverview,
} from '../utils/types'
import { isAppError } from '../shared/errors/types'

type CoursePayload = Record<string, unknown>
type LessonPayload = Record<string, unknown>
export type DashboardAudience = 'instructor' | 'student'

interface CourseQueryOptions {
  audience?: DashboardAudience
}

interface PagedCourseListOptions {
  params?: Record<string, unknown>
  publicRequest?: boolean
}

const requireEnvelopeData = <T>(envelope: ApiEnvelope<T>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined') {
    return envelope.data
  }

  throw new Error(envelope.message || fallbackMessage)
}

const isNotFoundError = (error: unknown) => isAppError(error) && (error.kind === 'not_found' || error.httpStatus === 404)
const ENROLLMENTS_PAGE_SIZE = 50
const MAX_ENROLLMENT_PAGE_COUNT = 20
const COURSES_PAGE_SIZE = 50
const MAX_COURSE_PAGE_COUNT = 20

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const extractPagedItems = (value: unknown) => {
  if (Array.isArray(value)) {
    return {
      items: value,
      lastPage: true,
    }
  }

  const payload = toRecord(value)
  const content = Array.isArray(payload.content)
    ? payload.content
    : Array.isArray(payload.items)
      ? payload.items
      : []

  if (content.length === 0 && Object.keys(payload).length > 0) {
    return {
      items: [payload],
      lastPage: true,
    }
  }

  const pageNumber = typeof payload.number === 'number' ? payload.number : undefined
  const totalPages = typeof payload.totalPages === 'number' ? payload.totalPages : undefined
  const hasLastFlag = typeof payload.last === 'boolean'
  const lastPage = hasLastFlag
    ? Boolean(payload.last)
    : typeof pageNumber === 'number' && typeof totalPages === 'number'
      ? pageNumber >= Math.max(0, totalPages - 1)
      : true

  return {
    items: content,
    lastPage,
  }
}

const toIdentifier = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }

  return undefined
}

const fetchPagedCourseList = async (endpoint: string, options: PagedCourseListOptions = {}) => {
  const { params, publicRequest = false } = options
  const aggregatedItems: unknown[] = []
  let pageNumber = 0
  let isLastPage = false

  while (!isLastPage && pageNumber < MAX_COURSE_PAGE_COUNT) {
    const response = await api.get<ApiEnvelope<unknown>>(endpoint, {
      params: {
        ...(params ?? {}),
        pageNumber,
        pageSize: COURSES_PAGE_SIZE,
      },
      skipAuthRefresh: publicRequest,
      skipGlobalErrorHandling: publicRequest,
    })
    const data = requireEnvelopeData(response.data, 'Course list response is missing data.')
    const page = extractPagedItems(data)

    for (const item of page.items) {
      aggregatedItems.push(item)
    }

    isLastPage = page.lastPage
    pageNumber += 1
  }

  return aggregatedItems
}

const fetchPublicCoursesRaw = async (language: AppLanguage) => fetchPagedCourseList(
  API_ENDPOINTS.courses.publicList,
  {
    params: { lang: language },
    publicRequest: true,
  },
)

const fetchPublicCourseByIdRaw = async (courseId: string, language: AppLanguage) => {
  const response = await api.get<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.publicDetail(courseId), {
    params: { lang: language },
    skipAuthRefresh: true,
    skipGlobalErrorHandling: true,
  })

  return requireEnvelopeData(response.data, 'Course detail response is missing data.')
}

const fetchMyInstructorCoursesRaw = async (language: AppLanguage) => fetchPagedCourseList(
  API_ENDPOINTS.courses.myCourses,
  { params: { lang: language } },
)

const extractEnrollmentCourseIds = (value: unknown) => {
  const payload = toRecord(value)
  const content = Array.isArray(payload.content)
    ? payload.content
    : Array.isArray(payload.items)
      ? payload.items
      : []
  const courseIds: string[] = []
  const seenIds = new Set<string>()

  for (const item of content) {
    const enrollment = toRecord(item)
    const nestedCourse = toRecord(enrollment.course)
    const courseId = toIdentifier(enrollment.courseId ?? nestedCourse.id)

    if (!courseId || seenIds.has(courseId)) {
      continue
    }

    seenIds.add(courseId)
    courseIds.push(courseId)
  }

  return {
    courseIds,
    lastPage: typeof payload.last === 'boolean' ? payload.last : true,
  }
}

const fetchMyEnrollmentCourseIds = async () => {
  const courseIds: string[] = []
  const seenIds = new Set<string>()
  let pageNumber = 0
  let isLastPage = false

  while (!isLastPage && pageNumber < MAX_ENROLLMENT_PAGE_COUNT) {
    const response = await api.get<ApiEnvelope<unknown>>(API_ENDPOINTS.enrollments.me, {
      params: {
        pageNumber,
        pageSize: ENROLLMENTS_PAGE_SIZE,
      },
    })
    const data = requireEnvelopeData(response.data, 'Enrollment response is missing data.')
    const page = extractEnrollmentCourseIds(data)

    for (const courseId of page.courseIds) {
      if (seenIds.has(courseId)) {
        continue
      }

      seenIds.add(courseId)
      courseIds.push(courseId)
    }

    isLastPage = page.lastPage
    pageNumber += 1
  }

  return courseIds
}

const fetchMyStudentCoursesRaw = async (language: AppLanguage) => {
  const courseIds = await fetchMyEnrollmentCourseIds()

  if (courseIds.length === 0) {
    return []
  }

  const results = await Promise.all(courseIds.map(async (courseId) => {
    try {
      return await fetchPublicCourseByIdRaw(courseId, language)
    } catch (error) {
      if (isNotFoundError(error)) {
        return null
      }

      throw error
    }
  }))

  return results.filter((item): item is NonNullable<typeof item> => item !== null)
}

const fetchMyCoursesRaw = async (language: AppLanguage, audience: DashboardAudience) => {
  if (audience === 'student') {
    return fetchMyStudentCoursesRaw(language)
  }

  return fetchMyInstructorCoursesRaw(language)
}

const resolveCourseIdBySlug = async (slug: string, language: AppLanguage) => {
  const rawCourses = await fetchPublicCoursesRaw(language)
  const courses = extractCourseCollection(rawCourses)
  const bySlug = courses.find((course) => course.slug === slug)

  return bySlug?.id
}

const formatMetricValue = (value: number) => value.toLocaleString('en-US')

const createDashboardOverview = (courses: Course[], language: AppLanguage): DashboardOverview => {
  const hasCourses = courses.length > 0
  const focusCourse = courses[0] ?? {
    id: 'placeholder',
    slug: 'placeholder',
    title: language === 'tr' ? 'Kayıtlı kurs bulunamadı' : 'No enrolled course available',
    imageUrl: '',
    category: language === 'tr' ? 'Genel' : 'General',
    categoryKey: 'general',
    level: language === 'tr' ? 'Tüm seviyeler' : 'All levels',
    levelKey: 'all-levels',
    duration: 'N/A',
    lessons: 0,
    progress: 0,
    students: '0',
    rating: 0,
    price: 0,
    accent: 'from-cyan-500/30 via-sky-500/10 to-transparent',
    summary: language === 'tr' ? 'Henüz kayıtlı kursunuz yok.' : 'You do not have any enrolled courses yet.',
    description: language === 'tr' ? 'Henüz kayıtlı kursunuz yok.' : 'You do not have any enrolled courses yet.',
    outcomes: [],
    tags: [],
    modules: [],
    instructor: {
      name: language === 'tr' ? 'Bilinmiyor' : 'Unknown',
      role: language === 'tr' ? 'Eğitmen' : 'Instructor',
      bio: language === 'tr' ? 'Kurs açıklaması henüz eklenmemiş.' : 'Course details are unavailable.',
    },
  }
  const totalLessons = courses.reduce((sum, course) => sum + course.lessons, 0)
  const totalLearners = courses.reduce((sum, course) => {
    const asNumber = Number(course.students.replace(/[^0-9.]/g, ''))

    if (Number.isNaN(asNumber)) {
      return sum
    }

    const multiplier = course.students.toLocaleLowerCase('en-US').includes('k') ? 1000 : 1
    return sum + (asNumber * multiplier)
  }, 0)
  const averageRating = hasCourses
    ? courses.reduce((sum, course) => sum + course.rating, 0) / courses.length
    : 0

  return {
    metrics: [
      {
        label: language === 'tr' ? 'Kayıtlı kurs' : 'Enrolled courses',
        value: formatMetricValue(courses.length),
        progress: 100,
        tone: 'cyan',
      },
      {
        label: language === 'tr' ? 'Toplam ders' : 'Total lessons',
        value: formatMetricValue(totalLessons),
        progress: hasCourses ? Math.min(100, Math.round((totalLessons / (courses.length * 20)) * 100)) : 0,
        tone: 'emerald',
      },
      {
        label: language === 'tr' ? 'Katılımcı' : 'Learners',
        value: formatMetricValue(Math.round(totalLearners)),
        progress: hasCourses ? 100 : 0,
        tone: 'amber',
      },
      {
        label: language === 'tr' ? 'Ortalama puan' : 'Average rating',
        value: averageRating.toFixed(1),
        progress: Math.min(100, Math.round((averageRating / 5) * 100)),
        tone: 'indigo',
      },
    ],
    recentActivity: focusCourse.modules.slice(0, 3).map((module) => ({
      id: module.id,
      title: module.title,
      description: focusCourse.title,
      time: language === 'tr' ? 'Az önce' : 'Recently',
      tag: module.completed
        ? (language === 'tr' ? 'Tamamlandı' : 'Completed')
        : (language === 'tr' ? 'Sıradaki' : 'Upcoming'),
    })),
    focusCourse,
    upcomingMilestones: focusCourse.modules.slice(0, 3).map((module) => ({
      id: module.id,
      label: module.title,
      due: module.duration,
      status: module.completed
        ? (language === 'tr' ? 'Hazır' : 'Ready')
        : (language === 'tr' ? 'Planlandı' : 'Planned'),
    })),
  }
}

const getCourseByIdentifier = async (identifier: string, language: AppLanguage) => {
  try {
    const rawDetail = await fetchPublicCourseByIdRaw(identifier, language)
    return mapBackendCourseToCourse(rawDetail)
  } catch (error) {
    if (!isNotFoundError(error)) {
      throw error
    }
  }

  const resolvedId = await resolveCourseIdBySlug(identifier, language)

  if (!resolvedId) {
    throw new Error(`Course "${identifier}" could not be found.`)
  }

  const rawDetail = await fetchPublicCourseByIdRaw(resolvedId, language)
  return mapBackendCourseToCourse(rawDetail)
}

export const courseService = {
  async getDashboardOverview(language: AppLanguage, audience: DashboardAudience = 'instructor') {
    const courses = await courseService.getMyCourses(language, { audience })
    return createDashboardOverview(courses, language)
  },

  async getCourses(language: AppLanguage) {
    const rawCourses = await fetchPublicCoursesRaw(language)
    return extractCourseCollection(rawCourses)
  },

  async getMyCourses(language: AppLanguage, options?: CourseQueryOptions) {
    const audience = options?.audience ?? 'instructor'
    const rawCourses = await fetchMyCoursesRaw(language, audience)
    return extractCourseCollection(rawCourses)
  },

  async getCourseBySlug(identifier: string, language: AppLanguage) {
    return getCourseByIdentifier(identifier, language)
  },

  async createCourse(payload: CoursePayload) {
    const response = await api.post<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.create, payload)
    return mapBackendCourseToCourse(requireEnvelopeData(response.data, 'Course create response is missing data.'))
  },

  async updateCourse(courseId: string, payload: CoursePayload) {
    const response = await api.put<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.update(courseId), payload)
    return mapBackendCourseToCourse(requireEnvelopeData(response.data, 'Course update response is missing data.'))
  },

  async deleteCourse(courseId: string) {
    await api.delete(API_ENDPOINTS.courses.remove(courseId))
  },

  async publishCourse(courseId: string) {
    const response = await api.post<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.publish(courseId))
    return requireEnvelopeData(response.data, 'Course publish response is missing data.')
  },

  async createLesson(courseId: string, payload: LessonPayload) {
    const response = await api.post<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.lessons.create(courseId), payload)
    return requireEnvelopeData(response.data, 'Lesson create response is missing data.')
  },

  async updateLesson(courseId: string, lessonId: string, payload: LessonPayload) {
    const response = await api.put<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.lessons.update(courseId, lessonId), payload)
    return requireEnvelopeData(response.data, 'Lesson update response is missing data.')
  },

  async deleteLesson(courseId: string, lessonId: string) {
    await api.delete(API_ENDPOINTS.courses.lessons.remove(courseId, lessonId))
  },
}
