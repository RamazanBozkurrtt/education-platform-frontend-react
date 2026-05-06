import {
  apiBaseUrl,
  profileMediaUploadFieldName,
  profileMediaUploadUrl,
} from './env'

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i

const normalizePath = (value: string) => value.trim().replace(/^\/+/, '')

const joinUrl = (baseUrl: string, path: string) => {
  const trimmedPath = path.trim()

  if (!trimmedPath) {
    return baseUrl
  }

  if (ABSOLUTE_URL_PATTERN.test(trimmedPath)) {
    return trimmedPath
  }

  return `${baseUrl}/${normalizePath(trimmedPath)}`
}

export const runtimeConfig = {
  environment: import.meta.env.MODE,
  apiBaseUrl,
  profileMediaUploadFieldName,
} as const

export const API_BASE_URL = runtimeConfig.apiBaseUrl

export const PROFILE_MEDIA_UPLOAD_URL = joinUrl(
  API_BASE_URL,
  profileMediaUploadUrl ?? '/api/v1/users/me/avatar',
)

export const resolveServiceUrl = (path: string) => joinUrl(API_BASE_URL, path)
