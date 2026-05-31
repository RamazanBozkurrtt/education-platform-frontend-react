import api from './api'
import { API_ENDPOINTS } from './endpoints'
import type { ApiEnvelope, RecommendationExplainPayload, RecommendationListPayload } from '../utils/types'

const requireEnvelopeData = <T>(envelope: ApiEnvelope<T>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined') {
    return envelope.data
  }

  throw new Error(envelope.message || fallbackMessage)
}

export const recommendationService = {
  async getDashboardRecommendations(limit = 10) {
    const response = await api.get<ApiEnvelope<RecommendationListPayload>>(API_ENDPOINTS.recommendations.dashboard, {
      params: { limit },
    })

    return requireEnvelopeData(response.data, 'Recommendation dashboard response is missing data.')
  },

  async getSearchRecommendations(query: string, limit = 10) {
    const response = await api.get<ApiEnvelope<RecommendationListPayload>>(API_ENDPOINTS.recommendations.search, {
      params: {
        query,
        limit,
      },
    })

    return requireEnvelopeData(response.data, 'Recommendation search response is missing data.')
  },

  async getRecommendationExplain() {
    const response = await api.get<ApiEnvelope<RecommendationExplainPayload>>(API_ENDPOINTS.recommendations.explainMe)
    return requireEnvelopeData(response.data, 'Recommendation explain response is missing data.')
  },
}

