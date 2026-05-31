import { resolveServiceUrl } from '../config/api'
import { formatDuration } from '../utils/duration'
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
  durationInMinutes?: number | null
  duration_in_minutes?: number | null
  durationMinutes?: number | null
  durationInSeconds?: number | null
  duration_seconds?: number | null
  durationSeconds?: number | null
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
  durationInMinutes?: number | null
  duration_in_minutes?: number | null
  durationMinutes?: number | null
  durationInSeconds?: number | null
  duration_seconds?: number | null
  durationSeconds?: number | null
  totalDurationInSeconds?: number | null
  total_duration_seconds?: number | null
  totalDurationSeconds?: number | null
  lessons?: number | BackendLessonResponse[] | null
  lessonCount?: number | null
  students?: string | number | null
  studentsCount?: number | null
  rating?: number | null
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

type BareDurationUnit = 'seconds' | 'minutes'

const LESSON_BARE_DURATION_INFER_MAX_MINUTES = 180
const LESSON_BARE_DURATION_INFER_MIN_SECONDS = 240

const toSeconds = (
  value: unknown,
  options?: {
    bareNumberUnit?: 'seconds' | 'minutes'
  },
) => {
  const bareNumberUnit = options?.bareNumberUnit ?? 'seconds'
  const numeric = toNumber(value)

  if (typeof numeric === 'number' && numeric >= 0) {
    if (bareNumberUnit === 'minutes') {
      return Math.round(numeric * 60)
    }

    return Math.round(numeric)
  }

  const asText = trimToUndefined(value)

  if (!asText) {
    return undefined
  }

  const hhMmSsMatch = asText.match(/^(\d{1,3}):(\d{2})(?::(\d{2}))?$/)

  if (hhMmSsMatch) {
    const [, first, second, third] = hhMmSsMatch
    const firstPart = Number(first)
    const secondPart = Number(second)
    const thirdPart = typeof third === 'string' ? Number(third) : undefined

    if (Number.isFinite(firstPart) && Number.isFinite(secondPart)) {
      if (typeof thirdPart === 'number' && Number.isFinite(thirdPart)) {
        return (firstPart * 3600) + (secondPart * 60) + thirdPart
      }

      return (firstPart * 60) + secondPart
    }
  }

  const isoDurationMatch = asText.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i)

  if (isoDurationMatch) {
    const [, hoursPart, minutesPart, secondsPart] = isoDurationMatch
    const hours = Number(hoursPart ?? 0)
    const minutes = Number(minutesPart ?? 0)
    const seconds = Number(secondsPart ?? 0)

    if (Number.isFinite(hours) && Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return Math.round((hours * 3600) + (minutes * 60) + seconds)
    }
  }

  const durationUnitRegex = /(\d+(?:[.,]\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)\b/gi
  let unitMatch: RegExpExecArray | null
  let totalSecondsFromUnits = 0
  let hasUnitMatch = false

  while ((unitMatch = durationUnitRegex.exec(asText)) !== null) {
    const amount = Number(unitMatch[1].replace(',', '.'))
    const unit = unitMatch[2].toLocaleLowerCase('en-US')

    if (!Number.isFinite(amount)) {
      continue
    }

    hasUnitMatch = true

    if (unit.startsWith('h')) {
      totalSecondsFromUnits += amount * 3600
      continue
    }

    if (unit.startsWith('m')) {
      totalSecondsFromUnits += amount * 60
      continue
    }

    totalSecondsFromUnits += amount
  }

  if (hasUnitMatch && totalSecondsFromUnits >= 0) {
    return Math.round(totalSecondsFromUnits)
  }

  return undefined
}

const DURATION_UNIT_TOKEN_REGEX = /[a-z]/i

const hasDurationUnitToken = (value: unknown) => {
  const asText = trimToUndefined(value)
  return typeof asText === 'string' && DURATION_UNIT_TOKEN_REGEX.test(asText)
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
    const parsed = toNumber(candidate)

    if (typeof parsed === 'number' && parsed >= 0) {
      return Math.round(parsed)
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
  bareNumberUnit: BareDurationUnit = 'seconds',
) => {
  const explicitSeconds = toDurationSecondsFromCandidates([
    lesson.durationInSeconds,
    lesson.duration_seconds,
    lesson.durationSeconds,
    lesson.duration_in_seconds,
  ])

  if (typeof explicitSeconds === 'number') {
    return explicitSeconds
  }

  return toSeconds(lesson.duration, { bareNumberUnit })
}

const toCourseDurationSeconds = (
  course: BackendCourseResponse & Record<string, unknown>,
) => {
  const explicitTotalSeconds = toDurationSecondsFromCandidates([
    course.totalDurationInSeconds,
    course.total_duration_seconds,
    course.totalDurationSeconds,
  ])

  if (typeof explicitTotalSeconds === 'number') {
    return explicitTotalSeconds
  }

  const explicitSeconds = toDurationSecondsFromCandidates([
    course.durationInSeconds,
    course.duration_seconds,
    course.durationSeconds,
  ])

  if (typeof explicitSeconds === 'number') {
    return explicitSeconds
  }
  
  return undefined
}

const hasExplicitLessonDuration = (lesson: BackendLessonResponse & Record<string, unknown>) =>
  typeof toDurationMinutes(lesson) === 'number'
  || typeof toDurationSecondsFromCandidates([
    lesson.durationInSeconds,
    lesson.duration_seconds,
    lesson.durationSeconds,
    lesson.duration_in_seconds,
  ]) === 'number'

const toBareLessonDurationNumber = (lesson: BackendLessonResponse & Record<string, unknown>) => {
  if (hasExplicitLessonDuration(lesson) || hasDurationUnitToken(lesson.duration)) {
    return undefined
  }

  const numeric = toNumber(lesson.duration)
  return typeof numeric === 'number' && numeric >= 0 ? numeric : undefined
}

const inferBareLessonDurationUnit = (rawLessons: unknown[]): BareDurationUnit => {
  // Legacy payloads sometimes provide bare numeric durations as minutes.
  // Infer a unit once per course and apply it consistently to all lessons.
  const bareNumericValues = rawLessons
    .map((rawLesson) => toBareLessonDurationNumber(toRecord(rawLesson) as BackendLessonResponse & Record<string, unknown>))
    .filter((value): value is number => typeof value === 'number')

  if (bareNumericValues.length === 0) {
    return 'seconds'
  }

  const maxValue = Math.max(...bareNumericValues)
  const minValue = Math.min(...bareNumericValues)
  const averageValue = bareNumericValues.reduce((sum, value) => sum + value, 0) / bareNumericValues.length

  if (maxValue <= LESSON_BARE_DURATION_INFER_MAX_MINUTES) {
    return 'minutes'
  }

  if (minValue >= LESSON_BARE_DURATION_INFER_MIN_SECONDS) {
    return 'seconds'
  }

  return averageValue <= LESSON_BARE_DURATION_INFER_MAX_MINUTES ? 'minutes' : 'seconds'
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
  bareDurationUnit: BareDurationUnit,
): CourseModule => {
  const lesson = toRecord(value) as BackendLessonResponse & Record<string, unknown>
  const lessonId = toIdentifier(lesson.id) ?? `${courseId}-lesson-${index + 1}`
  const durationMinutes = toDurationMinutes(lesson)
  const durationInSeconds = toDurationSecondsFromLesson(lesson, bareDurationUnit)
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

const resolveLessonDurationTotalSeconds = (
  modules: CourseModule[],
  rawLessons: unknown[],
  inferredLessonDurationUnit: BareDurationUnit,
) => {
  let totalSeconds = 0
  let hasAnyDuration = false

  for (const rawLesson of rawLessons) {
    const lesson = toRecord(rawLesson) as BackendLessonResponse & Record<string, unknown>
    const durationInMinutes = toDurationMinutes(lesson)
    const durationInSeconds = toDurationSecondsFromLesson(lesson, inferredLessonDurationUnit)

    if (typeof durationInSeconds === 'number') {
      totalSeconds += durationInSeconds
      hasAnyDuration = true
      continue
    }

    if (typeof durationInMinutes === 'number') {
      totalSeconds += Math.round(durationInMinutes * 60)
      hasAnyDuration = true
    }
  }

  if (hasAnyDuration && totalSeconds > 0) {
    return totalSeconds
  }

  if (modules.length > 0) {
    const parsedModuleSeconds = modules
      .map((module) => toDurationSecondsFromCandidates([module.durationSeconds]))
      .filter((value): value is number => typeof value === 'number')

    if (parsedModuleSeconds.length > 0) {
      return parsedModuleSeconds.reduce((sum, value) => sum + value, 0)
    }
  }

  return undefined
}

const resolveCourseTotalDurationSeconds = (
  course: BackendCourseResponse,
  modules: CourseModule[],
  rawLessons: unknown[],
  inferredLessonDurationUnit: BareDurationUnit,
) => {
  const durationFromCourseSeconds = toCourseDurationSeconds(
    course as BackendCourseResponse & Record<string, unknown>,
  )

  if (typeof durationFromCourseSeconds === 'number') {
    return durationFromCourseSeconds
  }

  return resolveLessonDurationTotalSeconds(modules, rawLessons, inferredLessonDurationUnit)
}

const resolveCourseDurationLabel = (
  course: BackendCourseResponse,
  modules: CourseModule[],
  rawLessons: unknown[],
  inferredLessonDurationUnit: BareDurationUnit,
) => {
  const totalDurationSeconds = resolveCourseTotalDurationSeconds(course, modules, rawLessons, inferredLessonDurationUnit)

  return formatDuration(totalDurationSeconds, 'en')
}

export const mapBackendCourseToCourse = (value: unknown): Course => {
  const course = toRecord(value) as BackendCourseResponse
  const id = toIdentifier(course.id) ?? crypto.randomUUID()
  const rawLessons = extractLessonList(course)
  const inferredLessonDurationUnit = inferBareLessonDurationUnit(rawLessons)
  const lessons = rawLessons.map((lesson, index) => mapLesson(id, lesson, index, inferredLessonDurationUnit))
  const totalDurationSeconds = resolveCourseTotalDurationSeconds(course, lessons, rawLessons, inferredLessonDurationUnit)
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
  const studentCount = toNumber(course.studentsCount) ?? toNumber(course.students)
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
    duration: resolveCourseDurationLabel(course, lessons, rawLessons, inferredLessonDurationUnit),
    durationSeconds: totalDurationSeconds,
    totalDurationSeconds,
    lessons: resolveLessonsCount(course, lessons),
    progress: Math.max(0, Math.min(100, Math.round(toNumber(course.progress) ?? 0))),
    students: typeof studentCount === 'number'
      ? formatLearnerCount(studentCount)
      : trimToUndefined(course.students) ?? '0',
    rating: Math.max(0, Math.min(5, toNumber(course.rating) ?? 0)),
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
