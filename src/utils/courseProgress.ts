import type { CourseModule, CourseProgressSummary, LessonProgress } from './types'

export type LessonProgressStatus = 'completed' | 'in_progress' | 'not_started'

export const formatSecondsAsClock = (totalSeconds: number) => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '00:00'
  }

  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  const remainder = seconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export const buildCoursePlayerPath = (slug: string, lessonId?: string | null) => {
  const basePath = `/courses/${slug}/watch`

  if (!lessonId) {
    return basePath
  }

  return `${basePath}?lessonId=${encodeURIComponent(lessonId)}`
}

export const resolveLessonProgressStatus = (lessonProgress: LessonProgress | null | undefined): LessonProgressStatus => {
  if (lessonProgress?.completed) {
    return 'completed'
  }

  if ((lessonProgress?.lastWatchedSecond ?? 0) > 0 || (lessonProgress?.watchedPercentage ?? 0) > 0) {
    return 'in_progress'
  }

  return 'not_started'
}

export const findFirstLessonId = (modules: CourseModule[]) => modules[0]?.id ?? null

export const resolveContinueLessonId = (summary: CourseProgressSummary | null | undefined, modules: CourseModule[]) => {
  if (summary?.lastLessonId) {
    return summary.lastLessonId
  }

  return findFirstLessonId(modules)
}
