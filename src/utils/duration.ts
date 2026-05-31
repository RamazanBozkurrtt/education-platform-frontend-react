import type { Course, CourseModule } from './types'

type DurationLanguage = 'en' | 'tr'

const toWholeSeconds = (value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  const normalized = Math.floor(value)

  if (normalized <= 0) {
    return null
  }

  return normalized
}

export const formatDuration = (
  seconds: number | null | undefined,
  language: DurationLanguage = 'tr',
) => {
  const safeSeconds = toWholeSeconds(seconds)

  if (safeSeconds === null) {
    return language === 'tr' ? 'Süre bilgisi yok' : 'Duration unavailable'
  }

  if (safeSeconds < 60) {
    return language === 'tr' ? `${safeSeconds} sn` : `${safeSeconds} sec`
  }

  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)

  if (hours > 0) {
    if (minutes > 0) {
      return language === 'tr' ? `${hours} sa ${minutes} dk` : `${hours} hr ${minutes} min`
    }

    return language === 'tr' ? `${hours} sa` : `${hours} hr`
  }

  return language === 'tr' ? `${minutes} dk` : `${minutes} min`
}

const sumModuleDurationSeconds = (modules: CourseModule[]) => {
  const validDurations = modules
    .map((module) => toWholeSeconds(module.durationSeconds))
    .filter((duration): duration is number => duration !== null)

  if (validDurations.length === 0) {
    return null
  }

  return validDurations.reduce((total, duration) => total + duration, 0)
}

export const resolveCourseTotalDurationSeconds = (course: Course) => {
  const totalDuration = toWholeSeconds(course.totalDurationSeconds)

  if (totalDuration !== null) {
    return totalDuration
  }

  const courseDuration = toWholeSeconds(course.durationSeconds)

  if (courseDuration !== null) {
    return courseDuration
  }

  return sumModuleDurationSeconds(course.modules)
}

export const resolveCourseDurationLabel = (course: Course, language: DurationLanguage = 'tr') =>
  formatDuration(resolveCourseTotalDurationSeconds(course), language)

export const resolveLessonDurationLabel = (lesson: CourseModule, language: DurationLanguage = 'tr') =>
  formatDuration(lesson.durationSeconds, language)
