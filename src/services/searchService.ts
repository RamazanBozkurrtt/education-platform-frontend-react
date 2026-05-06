import { courseService } from './courseService'
import { filterCatalogCourses, getCatalogCategories, getCatalogLevels } from '../utils/catalogFilters'
import type { AppLanguage, SearchFilters } from '../utils/types'

export const searchService = {
  async search(filters: SearchFilters, language: AppLanguage) {
    const courses = await courseService.getCourses(language)
    const categories = getCatalogCategories(courses)
    const levels = getCatalogLevels(courses)
    const normalizedQuery = filters.query.trim()
    const normalizedCategory = filters.category
      ? categories.find((item) => item.key === filters.category || item.label === filters.category)?.key ?? filters.category
      : ''
    const normalizedLevel = filters.level
      ? levels.find((item) => item.key === filters.level || item.label === filters.level)?.key ?? filters.level
      : ''
    const filteredCourses = filterCatalogCourses(
      courses,
      {
        query: normalizedQuery,
        category: normalizedCategory,
        level: normalizedLevel,
      },
      language,
    )

    return {
      filters: {
        categories: categories.map((item) => item.label),
        levels: levels.map((item) => item.label),
      },
      results: filteredCourses,
    }
  },
}
