import type { Course, CourseModule } from './types'

export type DurationLanguage = 'en' | 'tr'

const DURATION_PENDING_LABELS: Record<DurationLanguage, string> = {
  en: 'Duration is being prepared',
  tr: 'Süre bilgisi hazırlanıyor',
}

export const normalizeDurationSeconds = (value: unknown) => {
  const numericValue = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim().length > 0
      ? Number(value.trim())
      : null

  if (typeof numericValue !== 'number' || !Number.isFinite(numericValue)) {
    return null
  }

  const normalized = Math.floor(numericValue)

  if (normalized <= 0) {
    return null
  }

  return normalized
}

export const hasDurationSeconds = (value: unknown) => normalizeDurationSeconds(value) !== null

export const getDurationPendingLabel = (language: DurationLanguage = 'tr') =>
  DURATION_PENDING_LABELS[language]

export const formatDuration = (
  seconds: unknown,
  language: DurationLanguage = 'tr',
) => {
  const safeSeconds = normalizeDurationSeconds(seconds)

  if (safeSeconds === null) {
    return getDurationPendingLabel(language)
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

export const formatDurationOrNull = (
  seconds: unknown,
  language: DurationLanguage = 'tr',
) => {
  const safeSeconds = normalizeDurationSeconds(seconds)
  return safeSeconds === null ? null : formatDuration(safeSeconds, language)
}

const sumModuleDurationSeconds = (modules: CourseModule[]) => {
  const validDurations = modules
    .map((module) => normalizeDurationSeconds(module.durationSeconds))
    .filter((duration): duration is number => duration !== null)

  if (validDurations.length === 0 || validDurations.length !== modules.length) {
    return null
  }

  return validDurations.reduce((total, duration) => total + duration, 0)
}

export const resolveCourseTotalDurationSeconds = (course: Course) => {
  const totalDuration = normalizeDurationSeconds(course.totalDurationSeconds)

  if (totalDuration !== null) {
    return totalDuration
  }

  const courseDuration = normalizeDurationSeconds(course.durationSeconds)

  if (courseDuration !== null) {
    return courseDuration
  }

  return sumModuleDurationSeconds(course.modules)
}

export const resolveCourseDurationLabel = (course: Course, language: DurationLanguage = 'tr') =>
  formatDuration(resolveCourseTotalDurationSeconds(course), language)

export const resolveCourseDurationLabelOrNull = (course: Course, language: DurationLanguage = 'tr') =>
  formatDurationOrNull(resolveCourseTotalDurationSeconds(course), language)

export const resolveLessonDurationLabel = (lesson: CourseModule, language: DurationLanguage = 'tr') =>
  formatDuration(lesson.durationSeconds, language)

export const resolveLessonDurationLabelOrNull = (lesson: CourseModule, language: DurationLanguage = 'tr') =>
  formatDurationOrNull(lesson.durationSeconds, language)
