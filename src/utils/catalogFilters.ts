import { ROUTES } from './constants'
import { getCourseCategoryEntries, getCourseCategoryFilterKeys } from './courseCategory'
import type { AppLanguage, Course } from './types'

export interface CatalogFilterState {
  query?: string
  category?: string
  level?: string
}

export interface CatalogCategorySummary {
  key: string
  label: string
  count: number
  highlight: string
}

export interface CatalogLevelOption {
  key: string
  label: string
}

export const buildCatalogPath = ({ category, level, query }: CatalogFilterState = {}) => {
  const searchParams = new URLSearchParams()

  if (query?.trim()) searchParams.set('q', query.trim())
  if (category) searchParams.set('category', category)
  if (level) searchParams.set('level', level)

  const serialized = searchParams.toString()
  return serialized ? `${ROUTES.catalog}?${serialized}` : ROUTES.catalog
}

export const filterCatalogCourses = (
  courses: Course[],
  { category, level, query }: CatalogFilterState,
  language: AppLanguage,
) => {
  const normalizedQuery = query?.trim().toLocaleLowerCase(language) ?? ''

  return courses.filter((course) => {
    const matchesQuery =
      !normalizedQuery ||
      course.title.toLocaleLowerCase(language).includes(normalizedQuery) ||
      course.summary.toLocaleLowerCase(language).includes(normalizedQuery) ||
      course.tags.some((tag) => tag.toLocaleLowerCase(language).includes(normalizedQuery))

    const matchesCategory = !category || getCourseCategoryFilterKeys(course).includes(category)
    const matchesLevel = !level || course.levelKey === level

    return matchesQuery && matchesCategory && matchesLevel
  })
}

export const getCatalogCategories = (courses: Course[]): CatalogCategorySummary[] =>
  Array.from(
    courses.reduce<Map<string, CatalogCategorySummary>>((map, course) => {
      getCourseCategoryEntries(course).forEach(({ key, label }) => {
        const current = map.get(key)

        map.set(key, {
          key,
          label,
          count: (current?.count ?? 0) + 1,
          highlight: current?.highlight ?? course.tags.slice(0, 2).join(' / '),
        })
      })

      return map
    }, new Map()).values(),
  ).sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))

export const getCatalogLevels = (courses: Course[]): CatalogLevelOption[] =>
  Array.from(
    courses.reduce<Map<string, CatalogLevelOption>>((map, course) => {
      if (!map.has(course.levelKey)) {
        map.set(course.levelKey, { key: course.levelKey, label: course.level.levelName })
      }

      return map
    }, new Map()).values(),
  )
