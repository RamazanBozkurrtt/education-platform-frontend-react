import { mockRequest } from './api'
import { searchCatalog } from '../utils/mockData'
import type { AppLanguage, SearchFilters } from '../utils/types'

export const searchService = {
  async search(filters: SearchFilters, language: AppLanguage) {
    return mockRequest({ url: '/search', method: 'GET', params: filters }, searchCatalog(filters, language))
  },
}
