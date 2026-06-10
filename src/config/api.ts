import {
  apiBaseUrl,
  profileMediaUploadFieldName,
  profileMediaUploadUrl,
} from './env'

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i
const INTERNAL_BACKEND_HOSTS = new Set([
  'auth-service',
  'user-service',
  'course-service',
  'enrollment-service',
  'payment-service',
  'review-service',
  'search-service',
  'ai-service',
  'recommendation-service',
  'minio',
  'api-gateway',
])
const INTERNAL_BACKEND_PORTS = new Set([
  '8000',
  '8080',
  '8081',
  '8082',
  '8083',
  '8084',
  '8085',
  '8086',
  '8090',
  '9000',
  '9001',
])

const normalizePath = (value: string) => value.trim().replace(/^\/+/, '')
const normalizeAbsolutePath = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return '/'
  }

  if (trimmed.startsWith('/')) {
    return trimmed
  }

  return `/${trimmed}`
}

const getBasePathname = (baseUrl: string) => {
  const trimmed = baseUrl.trim()

  if (!trimmed) {
    return ''
  }

  if (ABSOLUTE_URL_PATTERN.test(trimmed)) {
    try {
      const pathname = new URL(trimmed).pathname
      return pathname === '/' ? '' : pathname.replace(/\/+$/, '')
    } catch {
      return ''
    }
  }

  if (trimmed.startsWith('/')) {
    return trimmed.replace(/\/+$/, '')
  }

  return ''
}

const stripDuplicateBasePath = (baseUrl: string, path: string) => {
  const basePathname = getBasePathname(baseUrl)
  if (!basePathname || basePathname === '/') {
    return path
  }

  const normalizedPath = normalizeAbsolutePath(path)
  const lowerBase = basePathname.toLocaleLowerCase('en-US')
  const lowerPath = normalizedPath.toLocaleLowerCase('en-US')

  if (lowerPath === lowerBase) {
    return '/'
  }

  if (lowerPath.startsWith(`${lowerBase}/`)) {
    return normalizedPath.slice(basePathname.length)
  }

  return path
}

const resolveAbsoluteUrlForBrowser = (baseUrl: string, absoluteUrl: string) => {
  try {
    const parsedUrl = new URL(absoluteUrl)
    const normalizedHostname = parsedUrl.hostname.trim().toLocaleLowerCase('en-US')
    const isInternalHostname = INTERNAL_BACKEND_HOSTS.has(normalizedHostname) || normalizedHostname.endsWith('.svc.cluster.local')
    const isInternalLocalhostPort = normalizedHostname === 'localhost' && INTERNAL_BACKEND_PORTS.has(parsedUrl.port)

    if (!isInternalHostname && !isInternalLocalhostPort) {
      return absoluteUrl
    }

    const pathWithQuery = `${parsedUrl.pathname || '/'}${parsedUrl.search}${parsedUrl.hash}`
    const normalizedPath = stripDuplicateBasePath(baseUrl, pathWithQuery)

    return `${baseUrl}/${normalizePath(normalizedPath)}`
  } catch {
    return absoluteUrl
  }
}

const joinUrl = (baseUrl: string, path: string) => {
  const trimmedPath = path.trim()

  if (!trimmedPath) {
    return baseUrl
  }

  if (ABSOLUTE_URL_PATTERN.test(trimmedPath)) {
    return resolveAbsoluteUrlForBrowser(baseUrl, trimmedPath)
  }

  const normalizedPath = stripDuplicateBasePath(baseUrl, trimmedPath)

  return `${baseUrl}/${normalizePath(normalizedPath)}`
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
