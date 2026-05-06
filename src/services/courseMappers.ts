import { resolveServiceUrl } from '../config/api'
import type { Course, CourseModule } from '../utils/types'

export interface BackendInstructorResponse {
  name?: string | null
  role?: string | null
  bio?: string | null
}

export interface BackendLessonResponse {
  id?: string | number | null
  title?: string | null
  description?: string | null
  duration?: string | number | null
  durationInMinutes?: number | null
  lessonType?: string | null
  type?: string | null
  completed?: boolean | null
  isCompleted?: boolean | null
  order?: number | null
  orderIndex?: number | null
  videoUrl?: string | null
}

export interface BackendCourseResponse {
  id?: string | number | null
  slug?: string | null
  title?: string | null
  imageUrl?: string | null
  category?: string | null
  categoryName?: string | null
  level?: string | null
  levelName?: string | null
  duration?: string | number | null
  lessons?: number | BackendLessonResponse[] | null
  lessonCount?: number | null
  students?: string | number | null
  studentsCount?: number | null
  rating?: number | null
  price?: number | null
  progress?: number | null
  summary?: string | null
  description?: string | null
  outcomes?: string[] | null
  tags?: string[] | null
  modules?: BackendLessonResponse[] | null
  lessonList?: BackendLessonResponse[] | null
  lessonsList?: BackendLessonResponse[] | null
  instructor?: BackendInstructorResponse | null
  instructorName?: string | null
  instructorTitle?: string | null
  instructorBio?: string | null
}

const ACCENT_PALETTE = [
  'from-cyan-500/30 via-sky-500/10 to-transparent',
  'from-emerald-500/30 via-teal-500/10 to-transparent',
  'from-amber-500/30 via-orange-500/10 to-transparent',
  'from-rose-500/30 via-pink-500/10 to-transparent',
  'from-indigo-500/30 via-blue-500/10 to-transparent',
] as const

const trimToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const toIdentifier = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }

  return trimToUndefined(value)
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

const toStringArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => trimToUndefined(item))
    .filter((item): item is string => Boolean(item))
}

const slugify = (value: string) => value
  .toLocaleLowerCase('en-US')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const formatLearnerCount = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '0'
  }

  if (value >= 1000) {
    const withSuffix = value / 1000
    const formatted = withSuffix >= 10 ? withSuffix.toFixed(0) : withSuffix.toFixed(1)
    return `${formatted}k`
  }

  return String(Math.round(value))
}

const toAbsoluteMediaUrl = (value: string | undefined) => {
  if (!value) {
    return ''
  }

  if (/^https?:\/\//i.test(value)) {
    return value
  }

  return resolveServiceUrl(value)
}

const getAccent = (courseId: string) => {
  const hash = courseId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length]
}

const normalizeDuration = (value: unknown) => {
  const asText = trimToUndefined(value)

  if (asText) {
    return asText
  }

  const asNumber = toNumber(value)
  return typeof asNumber === 'number' ? `${Math.round(asNumber)} min` : 'N/A'
}

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const extractLessonList = (course: BackendCourseResponse) => {
  const sources: unknown[] = [
    course.modules,
    course.lessonList,
    course.lessonsList,
    Array.isArray(course.lessons) ? course.lessons : undefined,
  ]

  for (const source of sources) {
    if (Array.isArray(source)) {
      return source
    }
  }

  return []
}

const mapLesson = (courseId: string, value: unknown, index: number): CourseModule => {
  const lesson = toRecord(value) as BackendLessonResponse
  const lessonId = toIdentifier(lesson.id) ?? `${courseId}-lesson-${index + 1}`
  const durationMinutes = toNumber(lesson.durationInMinutes)
  const durationValue = typeof durationMinutes === 'number'
    ? `${Math.round(durationMinutes)} min`
    : normalizeDuration(lesson.duration)

  return {
    id: lessonId,
    title: trimToUndefined(lesson.title) ?? `Lesson ${index + 1}`,
    duration: durationValue,
    type: trimToUndefined(lesson.type) ?? trimToUndefined(lesson.lessonType) ?? 'Lesson',
    completed: Boolean(lesson.completed ?? lesson.isCompleted ?? false),
    description: trimToUndefined(lesson.description),
    order: toNumber(lesson.order) ?? toNumber(lesson.orderIndex) ?? index + 1,
    videoUrl: trimToUndefined(lesson.videoUrl),
  }
}

const resolveLessonsCount = (course: BackendCourseResponse, modules: CourseModule[]) => {
  if (typeof course.lessons === 'number' && Number.isFinite(course.lessons)) {
    return Math.max(0, Math.round(course.lessons))
  }

  const lessonCount = toNumber(course.lessonCount)

  if (typeof lessonCount === 'number') {
    return Math.max(0, Math.round(lessonCount))
  }

  return modules.length
}

const resolveInstructor = (course: BackendCourseResponse) => {
  const instructor = course.instructor ?? {}
  const role = trimToUndefined(instructor.role) ?? trimToUndefined(course.instructorTitle) ?? 'Instructor'

  return {
    name: trimToUndefined(instructor.name) ?? trimToUndefined(course.instructorName) ?? 'Unknown Instructor',
    role,
    bio: trimToUndefined(instructor.bio) ?? trimToUndefined(course.instructorBio) ?? `${role} on this course.`,
  }
}

export const mapBackendCourseToCourse = (value: unknown): Course => {
  const course = toRecord(value) as BackendCourseResponse
  const id = toIdentifier(course.id) ?? crypto.randomUUID()
  const lessons = extractLessonList(course).map((lesson, index) => mapLesson(id, lesson, index))
  const category = trimToUndefined(course.category) ?? trimToUndefined(course.categoryName) ?? 'General'
  const level = trimToUndefined(course.level) ?? trimToUndefined(course.levelName) ?? 'All levels'
  const normalizedDescription = trimToUndefined(course.description)
  const normalizedSummary = trimToUndefined(course.summary)
  const title = trimToUndefined(course.title) ?? 'Untitled Course'
  const studentCount = toNumber(course.studentsCount) ?? toNumber(course.students)
  const tags = toStringArray(course.tags)

  return {
    id,
    slug: toIdentifier(course.slug) ?? id,
    title,
    imageUrl: toAbsoluteMediaUrl(trimToUndefined(course.imageUrl) ?? `/api/v1/courses/public/${id}/image`),
    category,
    categoryKey: slugify(category) || 'general',
    level,
    levelKey: slugify(level) || 'all-levels',
    duration: normalizeDuration(course.duration),
    lessons: resolveLessonsCount(course, lessons),
    progress: Math.max(0, Math.min(100, Math.round(toNumber(course.progress) ?? 0))),
    students: typeof studentCount === 'number'
      ? formatLearnerCount(studentCount)
      : trimToUndefined(course.students) ?? '0',
    rating: Math.max(0, Math.min(5, toNumber(course.rating) ?? 0)),
    price: Math.max(0, Math.round(toNumber(course.price) ?? 0)),
    accent: getAccent(id),
    summary: normalizedSummary ?? normalizedDescription ?? title,
    description: normalizedDescription ?? normalizedSummary ?? title,
    outcomes: toStringArray(course.outcomes),
    tags: tags.length > 0 ? tags : [category, level],
    modules: lessons.sort((left, right) => (left.order ?? 0) - (right.order ?? 0)),
    instructor: resolveInstructor(course),
  }
}

const mapCollectionItemToCourse = (value: unknown) => {
  const item = toRecord(value)
  const nestedCourse = toRecord(item.course)

  if (Object.keys(nestedCourse).length > 0) {
    return mapBackendCourseToCourse({
      ...nestedCourse,
      id: nestedCourse.id ?? item.courseId,
      progress: nestedCourse.progress ?? item.progress,
    })
  }

  return mapBackendCourseToCourse(value)
}

export const extractCourseCollection = (value: unknown): Course[] => {
  if (Array.isArray(value)) {
    return value.map((item) => mapCollectionItemToCourse(item))
  }

  const payload = toRecord(value)
  const candidates = ['items', 'content', 'courses', 'results', 'data']

  for (const candidate of candidates) {
    const source = payload[candidate]

    if (Array.isArray(source)) {
      return source.map((item) => mapCollectionItemToCourse(item))
    }
  }

  return []
}
