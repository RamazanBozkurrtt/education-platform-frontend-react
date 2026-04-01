import { mockRequest } from './api'
import {
  getCourseBySlug,
  getCourses,
  getDashboardOverview,
} from '../utils/mockData'
import type { AppLanguage } from '../utils/types'

export const courseService = {
  async getDashboardOverview(language: AppLanguage) {
    return mockRequest({ url: '/dashboard/overview', method: 'GET' }, getDashboardOverview(language))
  },

  async getCourses(language: AppLanguage) {
    return mockRequest({ url: '/courses', method: 'GET' }, getCourses(language))
  },

  async getCourseBySlug(slug: string, language: AppLanguage) {
    return mockRequest({ url: `/courses/${slug}`, method: 'GET' }, getCourseBySlug(slug, language))
  },
}
