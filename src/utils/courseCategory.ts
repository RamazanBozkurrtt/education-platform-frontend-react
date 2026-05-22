import type { Course } from './types'

const DEFAULT_CATEGORY_LABEL = 'General'

const toTrimmedOrUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const getCategoryIdList = (course: Pick<Course, 'categoryIds' | 'categoryId'>) => {
  const resolved = Array.isArray(course.categoryIds)
    ? course.categoryIds
      .map((item) => toTrimmedOrUndefined(item))
      .filter((item): item is string => Boolean(item))
    : []

  if (resolved.length > 0) {
    return [...new Set(resolved)]
  }

  const legacyCategoryId = toTrimmedOrUndefined(course.categoryId)
  return legacyCategoryId ? [legacyCategoryId] : []
}

export const getCourseCategoryFilterKeys = (
  course: Pick<Course, 'categoryIds' | 'categoryId'> & { categoryKey?: string },
) => {
  const ids = getCategoryIdList(course)
  const fallbackKey = toTrimmedOrUndefined(course.categoryKey) ?? 'general'
  return ids.length > 0 ? ids : [fallbackKey]
}

export const getCourseCategoryEntries = (
  course: Pick<Course, 'category' | 'categories' | 'categoryIds' | 'categoryId'> & { categoryKey?: string },
  fallbackLabel = DEFAULT_CATEGORY_LABEL,
) => {
  const ids = getCourseCategoryFilterKeys(course)
  const namesById = new Map(
    (course.categories ?? [])
      .map((item) => {
        const id = toTrimmedOrUndefined(item?.id)
        const name = toTrimmedOrUndefined(item?.categoryName)
        return id && name ? [id, name] as const : null
      })
      .filter((item): item is readonly [string, string] => item !== null),
  )
  const defaultLabel = toTrimmedOrUndefined(course.category) ?? fallbackLabel

  return ids.map((id, index) => ({
    key: id,
    label: namesById.get(id) ?? (index === 0 ? defaultLabel : id),
  }))
}

export const getCourseCategoryLabels = (
  course: Pick<Course, 'category' | 'categories' | 'categoryIds' | 'categoryId'> & { categoryKey?: string },
  fallbackLabel = DEFAULT_CATEGORY_LABEL,
) =>
  getCourseCategoryEntries(course, fallbackLabel)
    .map((entry) => entry.label)
    .filter(Boolean)

export const getCourseCategoryLabel = (
  course: Pick<Course, 'category' | 'categories' | 'categoryIds' | 'categoryId'> & { categoryKey?: string },
  fallbackLabel = DEFAULT_CATEGORY_LABEL,
) =>
  getCourseCategoryLabels(course, fallbackLabel).join(' / ') || fallbackLabel

export const getCourseCategoryFilterKey = (
  course: Pick<Course, 'categoryIds' | 'categoryId'> & { categoryKey?: string },
) => getCourseCategoryFilterKeys(course)[0] ?? toTrimmedOrUndefined(course.categoryKey) ?? 'general'
