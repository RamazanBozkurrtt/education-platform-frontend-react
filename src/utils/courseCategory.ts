import type { Course } from './types'

const DEFAULT_CATEGORY_LABEL = 'General'

const toTrimmedOrUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const getCourseCategoryLabel = (
  course: Pick<Course, 'category' | 'categoryId'>,
  fallbackLabel = DEFAULT_CATEGORY_LABEL,
) =>
  toTrimmedOrUndefined(course.category)
  ?? toTrimmedOrUndefined(course.categoryId)
  ?? fallbackLabel

export const getCourseCategoryFilterKey = (course: Pick<Course, 'categoryId' | 'categoryKey'>) =>
  toTrimmedOrUndefined(course.categoryId) ?? course.categoryKey

