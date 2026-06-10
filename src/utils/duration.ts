import type { Course, CourseModule } from './types'

export type DurationLanguage = 'en' | 'tr'

const DURATION_PENDING_LABELS: Record<DurationLanguage, string> = {
  en: 'Duration is being prepared',
  tr: 'Süre bilgisi hazırlanıyor',
}

const DURATION_UNIT_SECONDS: Array<[RegExp, number]> = [
  [/^(?:weeks?|w|hafta)$/iu, 7 * 24 * 60 * 60],
  [/^(?:days?|d|gün|gun)$/iu, 24 * 60 * 60],
  [/^(?:hours?|hrs?|h|saat|sa)$/iu, 60 * 60],
  [/^(?:minutes?|mins?|m|dakika|dk)$/iu, 60],
  [/^(?:seconds?|secs?|saniye|sn|sec|s)$/iu, 1],
]

const parseClockDuration = (value: string) => {
  const parts = value.split(':').map((part) => Number(part.trim()))

  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return null
  }

  const [hours, minutes, seconds] = parts.length === 3 ? parts : [0, parts[0], parts[1]]

  return Math.floor((hours * 3600) + (minutes * 60) + seconds)
}

const parseIsoDuration = (value: string) => {
  const match = value.match(/^P(?:(\d+(?:[.,]\d+)?)W)?(?:(\d+(?:[.,]\d+)?)D)?(?:T(?:(\d+(?:[.,]\d+)?)H)?(?:(\d+(?:[.,]\d+)?)M)?(?:(\d+(?:[.,]\d+)?)S)?)?$/iu)

  if (!match) {
    return null
  }

  const [, weeks, days, hours, minutes, seconds] = match
  const values = [weeks, days, hours, minutes, seconds].map((part) => part ? Number(part.replace(',', '.')) : 0)

  if (values.some((part) => !Number.isFinite(part))) {
    return null
  }

  return Math.floor(
    (values[0] * 7 * 24 * 60 * 60) +
    (values[1] * 24 * 60 * 60) +
    (values[2] * 60 * 60) +
    (values[3] * 60) +
    values[4],
  )
}

const parseUnitDuration = (value: string) => {
  const matches = [...value.matchAll(/(\d+(?:[.,]\d+)?)\s*([^\d\s]+)/giu)]

  if (matches.length === 0) {
    return null
  }

  let totalSeconds = 0

  for (const match of matches) {
    const amount = Number(match[1].replace(',', '.'))
    const unit = match[2].replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ]/g, '')
    const unitMatch = DURATION_UNIT_SECONDS.find(([pattern]) => pattern.test(unit))

    if (!Number.isFinite(amount) || !unitMatch) {
      continue
    }

    totalSeconds += amount * unitMatch[1]
  }

  return totalSeconds > 0 ? Math.floor(totalSeconds) : null
}

const parseDurationString = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const numericValue = Number(trimmed)

  if (Number.isFinite(numericValue)) {
    return numericValue
  }

  return parseIsoDuration(trimmed)
    ?? parseClockDuration(trimmed)
    ?? parseUnitDuration(trimmed)
}

export const normalizeDurationSeconds = (value: unknown) => {
  const numericValue = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? parseDurationString(value)
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

  const weeks = Math.floor(safeSeconds / (7 * 24 * 3600))
  const days = Math.floor((safeSeconds % (7 * 24 * 3600)) / (24 * 3600))

  if (weeks > 0) {
    if (days > 0) {
      return language === 'tr' ? `${weeks} hafta ${days} gün` : `${weeks} wk ${days} day`
    }

    return language === 'tr' ? `${weeks} hafta` : `${weeks} wk`
  }

  const remainingDays = Math.floor(safeSeconds / (24 * 3600))
  const remainingHours = Math.floor((safeSeconds % (24 * 3600)) / 3600)

  if (remainingDays > 0) {
    if (remainingHours > 0) {
      return language === 'tr' ? `${remainingDays} gün ${remainingHours} sa` : `${remainingDays} day ${remainingHours} hr`
    }

    return language === 'tr' ? `${remainingDays} gün` : `${remainingDays} day`
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

  if (validDurations.length === 0) {
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

  const durationFromLabel = normalizeDurationSeconds(course.duration)

  if (durationFromLabel !== null) {
    return durationFromLabel
  }

  return sumModuleDurationSeconds(course.modules)
}

export const resolveCourseDurationLabel = (course: Course, language: DurationLanguage = 'tr') =>
  formatDuration(resolveCourseTotalDurationSeconds(course), language)

export const resolveCourseDurationLabelOrNull = (course: Course, language: DurationLanguage = 'tr') =>
  formatDurationOrNull(resolveCourseTotalDurationSeconds(course), language)

export const resolveLessonDurationLabel = (lesson: CourseModule, language: DurationLanguage = 'tr') =>
  formatDuration(lesson.durationSeconds ?? lesson.duration, language)

export const resolveLessonDurationLabelOrNull = (lesson: CourseModule, language: DurationLanguage = 'tr') =>
  formatDurationOrNull(lesson.durationSeconds ?? lesson.duration, language)
