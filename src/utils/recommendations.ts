import { resolveServiceUrl } from '../config/api'

export const formatRecommendationScore = (score: number | null | undefined, language: 'en' | 'tr') => {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return null
  }

  const percentage = Math.max(0, Math.min(100, Math.round(score * 100)))
  return language === 'tr' ? `%${percentage} uyumlu` : `${percentage}% match`
}

export const truncateRecommendationText = (value: string | null | undefined, maxLength: number) => {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value.trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`
}

export const resolveRecommendationThumbnailUrl = (thumbnailUrl: string | null | undefined) => {
  if (!thumbnailUrl || !thumbnailUrl.trim()) {
    return ''
  }

  return resolveServiceUrl(thumbnailUrl)
}
