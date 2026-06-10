import { resolveServiceUrl } from '../config/api'
import { formatDuration, normalizeDurationSeconds } from '../utils/duration'
import { formatStudentCount, parseStudentCount } from '../utils/helpers'
import type { Course, CourseLevelOption, CourseModule } from '../utils/types'

export interface BackendInstructorResponse {
  fullName?: string | null
  name?: string | null
  role?: string | null
  bio?: string | null
  profileImageUrl?: string | null
  profile_image_url?: string | null
  avatarUrl?: string | null
  avatar_url?: string | null
  imageUrl?: string | null
  image_url?: string | null
}

export interface BackendLessonResponse {
  id?: string | number | null
  title?: string | null
  description?: string | null
  duration?: string | number | null
  durationInMinutes?: string | number | null
  duration_in_minutes?: string | number | null
  durationMinutes?: string | number | null
  durationInSeconds?: string | number | null
  duration_seconds?: string | number | null
  durationSeconds?: string | number | null
  duration_in_seconds?: string | number | null
  videoDuration?: string | number | null
  videoDurationSeconds?: string | number | null
  video_duration_seconds?: string | number | null
  lessonType?: string | null
  type?: string | null
  completed?: boolean | null
  isCompleted?: boolean | null
  order?: number | null
  orderIndex?: number | null
  videoUrl?: string | null
}

export interface BackendCourseCategoryResponse {
  id?: string | number | null
  categoryName?: string | null
  name?: string | null
}

export interface BackendCourseLevelResponse {
  id?: string | number | null
  levelName?: string | null
  name?: string | null
}

export interface BackendCourseResponse {
  id?: string | number | null
  slug?: string | null
  title?: string | null
  imageUrl?: string | null
  image?: string | null
  imagePath?: string | null
  image_url?: string | null
  coverImageUrl?: string | null
  thumbnailUrl?: string | null
  categoryId?: string | number | null
  categoryIds?: Array<string | number | null> | null
  category?: string | BackendCourseCategoryResponse | null
  categories?: Array<BackendCourseCategoryResponse | string | null> | null
  categoryName?: string | null
  levelId?: string | number | null
  level?: string | BackendCourseLevelResponse | null
  levelName?: string | null
  duration?: string | number | null
  durationInMinutes?: string | number | null
  duration_in_minutes?: string | number | null
  durationMinutes?: string | number | null
  durationInSeconds?: string | number | null
  duration_seconds?: string | number | null
  durationSeconds?: string | number | null
  duration_in_seconds?: string | number | null
  totalDuration?: string | number | null
  totalDurationInSeconds?: string | number | null
  total_duration_seconds?: string | number | null
  totalDurationSeconds?: string | number | null
  lessons?: number | BackendLessonResponse[] | null
  lessonCount?: number | null
  students?: string | number | null
  studentsCount?: number | null
  enrollmentCount?: number | null
  enrolledStudentCount?: number | null
  totalStudents?: number | null
  rating?: number | null
  averageRating?: string | number | null
  avgRating?: string | number | null
  reviewAverageRating?: string | number | null
  reviewsAverageRating?: string | number | null
  ratingAverage?: string | number | null
  ratingCount?: number | null
  reviewCount?: number | null
  reviewsCount?: number | null
  totalReviews?: number | null
  price?: number | null
  currency?: string | null
  currencyCode?: string | null
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
  instructorProfileImageUrl?: string | null
  instructor_profile_image_url?: string | null
  instructorAvatarUrl?: string | null
  instructor_avatar_url?: string | null
  instructorImageUrl?: string | null
  instructor_image_url?: string | null
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

const toAbsoluteMediaUrl = (value: string | undefined) => {
  if (!value) {
    return ''
  }

  return resolveServiceUrl(value)
}

const getAccent = (courseId: string) => {
  const hash = courseId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length]
}

const toDurationMinutesFromCandidates = (candidates: unknown[]) => {
  for (const candidate of candidates) {
    const parsed = toNumber(candidate)

    if (typeof parsed === 'number' && parsed >= 0) {
      return parsed
    }
  }

  return undefined
}

const toDurationSecondsFromCandidates = (candidates: unknown[]) => {
  for (const candidate of candidates) {
    const parsed = normalizeDurationSeconds(candidate)

    if (typeof parsed === 'number') {
      return parsed
    }
  }

  return undefined
}

const toDurationMinutes = (lesson: BackendLessonResponse & Record<string, unknown>) =>
  toDurationMinutesFromCandidates([
    lesson.durationInMinutes,
    lesson.duration_in_minutes,
    lesson.durationMinutes,
    lesson.duration_inMinutes,
  ])

const toDurationSecondsFromLesson = (
  lesson: BackendLessonResponse & Record<string, unknown>,
) => {
  const explicitSeconds = toDurationSecondsFromCandidates([
    lesson.durationSeconds,
    lesson.durationInSeconds,
    lesson.duration_seconds,
    lesson.duration_in_seconds,
    lesson.videoDurationSeconds,
    lesson.video_duration_seconds,
    lesson.videoDuration,
    lesson.duration,
  ])

  return typeof explicitSeconds === 'number' ? explicitSeconds : undefined
}

const toCourseDurationSeconds = (
  course: BackendCourseResponse & Record<string, unknown>,
) => {
  const explicitTotalSeconds = toDurationSecondsFromCandidates([
    course.totalDurationSeconds,
    course.totalDurationInSeconds,
    course.total_duration_seconds,
    course.totalDuration,
  ])

  if (typeof explicitTotalSeconds === 'number') {
    return explicitTotalSeconds
  }

  const explicitSeconds = toDurationSecondsFromCandidates([
    course.durationSeconds,
    course.durationInSeconds,
    course.duration_seconds,
    course.duration_in_seconds,
    course.duration,
  ])

  if (typeof explicitSeconds === 'number') {
    return explicitSeconds
  }
  return undefined
}

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const toCourseCategory = (value: unknown): BackendCourseCategoryResponse | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as BackendCourseCategoryResponse
}

const toCourseLevel = (value: unknown): BackendCourseLevelResponse | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as BackendCourseLevelResponse
}

const toCourseCategories = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }

  const result: Array<{ id: string; categoryName: string }> = []
  const seenIds = new Set<string>()

  for (const item of value) {
    if (typeof item === 'string') {
      const name = trimToUndefined(item)

      if (!name || seenIds.has(name)) {
        continue
      }

      seenIds.add(name)
      result.push({
        id: name,
        categoryName: name,
      })
      continue
    }

    const category = toCourseCategory(item)
    const id = toIdentifier(category?.id)
    const categoryName = trimToUndefined(category?.categoryName) ?? trimToUndefined(category?.name)

    if (!id || !categoryName || seenIds.has(id)) {
      continue
    }

    seenIds.add(id)
    result.push({
      id,
      categoryName,
    })
  }

  return result
}

const toIdentifierArray = (value: unknown) => {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(
    value
      .map((item) => toIdentifier(item))
      .filter((item): item is string => Boolean(item)),
  )]
}

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

const mapLesson = (
  courseId: string,
  value: unknown,
  index: number,
): CourseModule => {
  const lesson = toRecord(value) as BackendLessonResponse & Record<string, unknown>
  const lessonId = toIdentifier(lesson.id) ?? `${courseId}-lesson-${index + 1}`
  const durationMinutes = toDurationMinutes(lesson)
  const durationInSeconds = toDurationSecondsFromLesson(lesson)
  const normalizedDurationSeconds = typeof durationInSeconds === 'number'
    ? durationInSeconds
    : typeof durationMinutes === 'number'
      ? Math.round(durationMinutes * 60)
      : null
  const durationValue = formatDuration(normalizedDurationSeconds, 'en')

  return {
    id: lessonId,
    title: trimToUndefined(lesson.title) ?? `Lesson ${index + 1}`,
    duration: durationValue,
    durationSeconds: normalizedDurationSeconds,
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
  const fullName = trimToUndefined(instructor.fullName)
  const avatarUrl = toAbsoluteMediaUrl(
    trimToUndefined(instructor.profileImageUrl)
    ?? trimToUndefined(instructor.profile_image_url)
    ?? trimToUndefined(instructor.avatarUrl)
    ?? trimToUndefined(instructor.avatar_url)
    ?? trimToUndefined(instructor.imageUrl)
    ?? trimToUndefined(instructor.image_url)
    ?? trimToUndefined(course.instructorProfileImageUrl)
    ?? trimToUndefined(course.instructor_profile_image_url)
    ?? trimToUndefined(course.instructorAvatarUrl)
    ?? trimToUndefined(course.instructor_avatar_url)
    ?? trimToUndefined(course.instructorImageUrl)
    ?? trimToUndefined(course.instructor_image_url),
  )

  return {
    name: fullName ?? trimToUndefined(instructor.name) ?? trimToUndefined(course.instructorName) ?? 'Unknown Instructor',
    role,
    bio: trimToUndefined(instructor.bio) ?? trimToUndefined(course.instructorBio) ?? `${role} on this course.`,
    avatarUrl: avatarUrl || undefined,
  }
}

const resolveLessonDurationTotalSeconds = (modules: CourseModule[]) => {
  if (modules.length === 0) {
    return undefined
  }

  const parsedModuleSeconds = modules
    .map((module) => normalizeDurationSeconds(module.durationSeconds))
    .filter((value): value is number => typeof value === 'number')

  if (parsedModuleSeconds.length === 0) {
    return undefined
  }

  return parsedModuleSeconds.reduce((sum, value) => sum + value, 0)
}

const resolveCourseTotalDurationSeconds = (
  course: BackendCourseResponse,
  modules: CourseModule[],
) => {
  const durationFromCourseSeconds = toCourseDurationSeconds(
    course as BackendCourseResponse & Record<string, unknown>,
  )

  if (typeof durationFromCourseSeconds === 'number') {
    return durationFromCourseSeconds
  }

  return resolveLessonDurationTotalSeconds(modules)
}

const resolveCourseDurationLabel = (
  course: BackendCourseResponse,
  modules: CourseModule[],
) => {
  const totalDurationSeconds = resolveCourseTotalDurationSeconds(course, modules)

  return formatDuration(totalDurationSeconds, 'en')
}

const resolveCourseRating = (course: BackendCourseResponse & Record<string, unknown>) => {
  const ratings = [
    course.averageRating,
    course.avgRating,
    course.reviewAverageRating,
    course.reviewsAverageRating,
    course.ratingAverage,
    course.rating,
  ]
    .map((value) => toNumber(value))
    .filter((value): value is number => typeof value === 'number' && value > 0)

  return Math.max(0, Math.min(5, ratings[0] ?? toNumber(course.rating) ?? 0))
}

const resolveCourseRatingCount = (course: BackendCourseResponse & Record<string, unknown>) => {
  const ratingCount = toNumber(course.ratingCount)
    ?? toNumber(course.reviewCount)
    ?? toNumber(course.reviewsCount)
    ?? toNumber(course.totalReviews)

  return typeof ratingCount === 'number' ? Math.max(0, Math.round(ratingCount)) : undefined
}

const resolveStudentCount = (course: BackendCourseResponse & Record<string, unknown>) => {
  const explicitCount = toNumber(course.studentsCount)
    ?? toNumber(course.enrollmentCount)
    ?? toNumber(course.enrolledStudentCount)
    ?? toNumber(course.totalStudents)

  if (typeof explicitCount === 'number') {
    return Math.max(0, Math.round(explicitCount))
  }

  if (typeof course.students === 'number' && Number.isFinite(course.students)) {
    return Math.max(0, Math.round(course.students))
  }

  return undefined
}

export const mapBackendCourseToCourse = (value: unknown): Course => {
  const course = toRecord(value) as BackendCourseResponse
  const id = toIdentifier(course.id) ?? crypto.randomUUID()
  const rawLessons = extractLessonList(course)
  const lessons = rawLessons.map((lesson, index) => mapLesson(id, lesson, index))
  const totalDurationSeconds = resolveCourseTotalDurationSeconds(course, lessons)
  const categoryObject = toCourseCategory(course.category)
  const legacyCategoryId = toIdentifier(course.categoryId) ?? toIdentifier(categoryObject?.id)
  const categoryIdsFromResponse = toIdentifierArray(course.categoryIds)
  const categoriesFromResponse = toCourseCategories(course.categories)
  const categoryIds = [...new Set([
    ...categoryIdsFromResponse,
    ...categoriesFromResponse.map((item) => item.id),
    ...(legacyCategoryId ? [legacyCategoryId] : []),
  ])]
  const categoryId = categoryIds[0] ?? legacyCategoryId
  const category = trimToUndefined(categoriesFromResponse[0]?.categoryName)
    ?? trimToUndefined(categoryObject?.categoryName)
    ?? trimToUndefined(categoryObject?.name)
    ?? trimToUndefined(typeof course.category === 'string' ? course.category : undefined)
    ?? trimToUndefined(course.categoryName)
    ?? categoryId
    ?? 'General'
  const categories = categoryIds
    .map((itemId, index) => {
      const matchedCategory = categoriesFromResponse.find((item) => item.id === itemId)
      const resolvedName = matchedCategory?.categoryName ?? (index === 0 ? category : itemId)
      return resolvedName
        ? {
          id: itemId,
          categoryName: resolvedName,
        }
        : null
    })
    .filter((item): item is { id: string; categoryName: string } => item !== null)
  const levelObject = toCourseLevel(course.level)
  const levelId = toIdentifier(course.levelId) ?? toIdentifier(levelObject?.id)
  const levelName = trimToUndefined(levelObject?.levelName)
    ?? trimToUndefined(levelObject?.name)
    ?? trimToUndefined(typeof course.level === 'string' ? course.level : undefined)
    ?? trimToUndefined(course.levelName)
    ?? 'All levels'
  const resolvedLevel: CourseLevelOption = {
    id: levelId ?? (slugify(levelName) || 'all-levels'),
    levelName,
  }
  const normalizedDescription = trimToUndefined(course.description)
  const normalizedSummary = trimToUndefined(course.summary)
  const title = trimToUndefined(course.title) ?? 'Untitled Course'
  const studentCount = resolveStudentCount(course as BackendCourseResponse & Record<string, unknown>)
  const legacyStudentLabel = trimToUndefined(course.students)
  const fallbackStudentCount = parseStudentCount(legacyStudentLabel)
  const displayStudentCount = studentCount ?? fallbackStudentCount
  const rating = resolveCourseRating(course as BackendCourseResponse & Record<string, unknown>)
  const ratingCount = resolveCourseRatingCount(course as BackendCourseResponse & Record<string, unknown>)
  const tags = toStringArray(course.tags)
  const normalizedImageUrl = trimToUndefined(course.imageUrl)
    ?? trimToUndefined(course.image)
    ?? trimToUndefined(course.imagePath)
    ?? trimToUndefined(course.image_url)
    ?? trimToUndefined(course.coverImageUrl)
    ?? trimToUndefined(course.thumbnailUrl)

  return {
    id,
    slug: toIdentifier(course.slug) ?? id,
    title,
    imageUrl: toAbsoluteMediaUrl(normalizedImageUrl ?? `/api/v1/courses/public/${id}/image`),
    categoryIds,
    categories,
    categoryId,
    category,
    categoryKey: slugify(category) || 'general',
    levelId: levelId ?? resolvedLevel.id,
    level: resolvedLevel,
    levelKey: slugify(levelName) || 'all-levels',
    duration: resolveCourseDurationLabel(course, lessons),
    durationSeconds: totalDurationSeconds,
    totalDurationSeconds,
    lessons: resolveLessonsCount(course, lessons),
    progress: Math.max(0, Math.min(100, Math.round(toNumber(course.progress) ?? 0))),
    studentsCount: studentCount,
    students: typeof displayStudentCount === 'number'
      ? formatStudentCount(displayStudentCount)
      : legacyStudentLabel ?? '0',
    rating,
    ratingCount,
    price: Math.max(0, toNumber(course.price) ?? 0),
    currency: trimToUndefined(course.currency)?.toUpperCase()
      ?? trimToUndefined(course.currencyCode)?.toUpperCase()
      ?? 'TRY',
    accent: getAccent(id),
    summary: normalizedSummary ?? normalizedDescription ?? title,
    description: normalizedDescription ?? normalizedSummary ?? title,
    outcomes: toStringArray(course.outcomes),
    tags: tags.length > 0 ? tags : [category, levelName],
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
