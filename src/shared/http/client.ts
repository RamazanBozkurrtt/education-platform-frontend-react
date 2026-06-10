import axios, {
  AxiosHeaders,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { API_BASE_URL } from '../../config/api'
import { sleep } from '../../utils/helpers'
import { authFlowLog, authFlowTrace } from '../authFlowDebug'
import {
  buildSessionSnapshot,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setSession,
} from '../../services/authSession'
import { API_ENDPOINTS } from '../../services/endpoints'
import type { ApiEnvelope, LoginSuccessData } from '../../utils/types'
import type { AppError } from '../errors/types'
import { normalizeApiError } from '../errors/normalizeApiError'
import { handleAppError } from '../errors/handleAppError'

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRefresh?: boolean
    skipGlobalErrorHandling?: boolean
  }
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const defaultConfig = {
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
}

export const authClient = axios.create(defaultConfig)
const apiClient = axios.create(defaultConfig)

let refreshPromise: Promise<string> | null = null
let refreshPromiseToken: string | null = null

const persistRefreshedSession = (accessToken: string, refreshToken: string, fallbackUserId?: unknown) => {
  const nextSession = buildSessionSnapshot({
    accessToken,
    refreshToken,
    existingUser: getStoredUser(),
    fallbackUserId,
  })

  setSession(nextSession)

  if (getAccessToken() !== accessToken || getRefreshToken() !== refreshToken) {
    throw createSessionExpiredError('Failed to persist refreshed session.')
  }

  return nextSession.accessToken
}

export const createNoAuthHeaders = () => {
  const headers = new AxiosHeaders({
    'Content-Type': 'application/json',
  })
  headers.delete('Authorization')

  return headers
}

const applyAuthorizationHeader = (config: InternalAxiosRequestConfig, token: string) => {
  const headers = AxiosHeaders.from(config.headers)
  headers.set('Authorization', `Bearer ${token}`)
  config.headers = headers
}

const toAuthHeader = (config: InternalAxiosRequestConfig | RetryableRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers)
  return headers.get('Authorization')
}

const shouldRefreshRequest = (config?: RetryableRequestConfig) => {
  if (!config || config._retry || config.skipAuthRefresh) {
    return false
  }

  const url = config.url ?? ''

  return !url.includes(API_ENDPOINTS.auth.login) &&
    !url.includes(API_ENDPOINTS.auth.register) &&
    !url.includes(API_ENDPOINTS.auth.refreshToken) &&
    !url.includes(API_ENDPOINTS.auth.reactivateAccount)
}

const shouldAttachAuthorizationHeader = (config: InternalAxiosRequestConfig) => {
  const url = config.url ?? ''

  // Public catalog endpoints should stay anonymous even if a stale token exists.
  if (url.includes('/api/v1/courses/public')) {
    return false
  }

  return true
}

const isFormDataPayload = (value: unknown): value is FormData =>
  typeof FormData !== 'undefined' && value instanceof FormData

const requestHasAuthorizationHeader = (config: RetryableRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers)
  const authorization = headers.get('Authorization')
  return typeof authorization === 'string' && authorization.trim().length > 0
}

const getRequestBearerToken = (config: RetryableRequestConfig) => {
  const headers = AxiosHeaders.from(config.headers)
  const authorization = headers.get('Authorization')

  if (typeof authorization !== 'string') {
    return null
  }

  const match = authorization.trim().match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

const getBasePathname = (baseUrl?: string) => {
  if (!baseUrl) {
    return ''
  }

  const trimmed = baseUrl.trim()
  if (!trimmed) {
    return ''
  }

  if (/^https?:\/\//i.test(trimmed)) {
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

const normalizeRequestPathForBasePath = (config: InternalAxiosRequestConfig | RetryableRequestConfig) => {
  const url = config.url?.trim()
  if (!url || /^https?:\/\//i.test(url)) {
    return
  }

  const basePathname = getBasePathname(config.baseURL)
  if (!basePathname || basePathname === '/') {
    return
  }

  if (!url.startsWith('/')) {
    return
  }

  const lowerBasePath = basePathname.toLocaleLowerCase('en-US')
  const lowerUrl = url.toLocaleLowerCase('en-US')

  if (lowerUrl === lowerBasePath) {
    config.url = '/'
    return
  }

  if (lowerUrl.startsWith(`${lowerBasePath}/`)) {
    config.url = url.slice(basePathname.length)
  }
}

// Refresh should only run for unauthenticated requests.
// 403 usually means the token is valid but the user lacks permission.
const isAuthFailureStatus = (status?: number) => status === 401

const createSessionExpiredError = (message?: string): AppError => ({
  kind: 'auth',
  message: message?.trim() || 'Your session has expired. Please sign in again.',
  httpStatus: 401,
})

const refreshSession = async () => {
  const refreshToken = getRefreshToken()
  authFlowLog('refresh session start:', { hasRefreshToken: Boolean(refreshToken) })

  if (!refreshToken) {
    throw createSessionExpiredError('Missing refresh token.')
  }

  if (!refreshPromise || refreshPromiseToken !== refreshToken) {
    refreshPromiseToken = refreshToken
    refreshPromise = authClient
      .post<ApiEnvelope<LoginSuccessData>>(
        API_ENDPOINTS.auth.refreshToken,
        { refresh_token: refreshToken },
        { headers: createNoAuthHeaders(), skipGlobalErrorHandling: true },
      )
      .then((response) => {
        const data = response.data.data

        const nextAccessToken = data?.access_token?.trim()
        const nextRefreshToken = data?.refresh_token?.trim()

        if (!nextAccessToken || !nextRefreshToken) {
          throw createSessionExpiredError(response.data.message || 'Refresh token response is missing tokens.')
        }

        const persistedAccessToken = persistRefreshedSession(
          nextAccessToken,
          nextRefreshToken,
          data?.user_id ?? data?.userId,
        )
        authFlowLog('refresh session success:', {
          accessTokenLength: persistedAccessToken.length,
          refreshTokenLength: nextRefreshToken.length,
        })
        return persistedAccessToken
      })
      .catch(async (error: unknown) => {
        const currentRefreshToken = getRefreshToken()
        const currentAccessToken = getAccessToken()
        const sessionWasRotated =
          Boolean(currentRefreshToken) &&
          currentRefreshToken !== refreshToken &&
          Boolean(currentAccessToken)

        if (sessionWasRotated && currentAccessToken) {
          return currentAccessToken
        }

        const normalizedError = normalizeApiError(error)
        const authError = normalizedError.kind === 'auth'
          ? normalizedError
          : createSessionExpiredError(normalizedError.message)
        authFlowLog('refresh session error:', authError)
        authFlowTrace('logout called from refresh catch')

        throw authError
      })
      .finally(() => {
        refreshPromise = null
        refreshPromiseToken = null
      })
  }

  return refreshPromise
}

authClient.interceptors.request.use((config) => {
  normalizeRequestPathForBasePath(config)

  if (isFormDataPayload(config.data)) {
    const headers = AxiosHeaders.from(config.headers)
    headers.delete('Content-Type')
    config.headers = headers
  }

  return config
})

apiClient.interceptors.request.use((config) => {
  normalizeRequestPathForBasePath(config)

  const token = getAccessToken()

  if (token && shouldAttachAuthorizationHeader(config)) {
    applyAuthorizationHeader(config, token)
  } else if (!shouldAttachAuthorizationHeader(config)) {
    const headers = AxiosHeaders.from(config.headers)
    headers.delete('Authorization')
    config.headers = headers
  }

  // Let the browser set multipart boundary automatically for FormData payloads.
  if (isFormDataPayload(config.data)) {
    const headers = AxiosHeaders.from(config.headers)
    headers.delete('Content-Type')
    config.headers = headers
  }

  authFlowLog('axios request:', config.method, config.url, toAuthHeader(config))

  return config
})

authClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    throw normalizeApiError(error)
  },
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const axiosError = error as { config?: RetryableRequestConfig, response?: { status?: number } }
    const originalRequest = axiosError.config
    authFlowLog('response error:', axiosError.response?.status, originalRequest?.url)

    if (
      isAuthFailureStatus(axiosError.response?.status) &&
      originalRequest &&
      shouldRefreshRequest(originalRequest) &&
      requestHasAuthorizationHeader(originalRequest)
    ) {
      originalRequest._retry = true
      const currentAccessToken = getAccessToken()
      const requestAccessToken = getRequestBearerToken(originalRequest)

      if (currentAccessToken && requestAccessToken && currentAccessToken !== requestAccessToken) {
        applyAuthorizationHeader(originalRequest, currentAccessToken)
        return apiClient(originalRequest)
      }

      try {
        const nextAccessToken = await refreshSession()
        applyAuthorizationHeader(originalRequest, nextAccessToken)
        return apiClient(originalRequest)
      } catch (refreshError) {
        const appError = normalizeApiError(refreshError)

        if (!originalRequest.skipGlobalErrorHandling) {
          await handleAppError(appError, { notify: false })
        }

        throw appError
      }
    }

    const appError = normalizeApiError(error)
    const isRetriedAuthFailure = isAuthFailureStatus(axiosError.response?.status) && Boolean(originalRequest?._retry)

    if (isRetriedAuthFailure) {
      authFlowLog('response error after refresh retry, skipping forced logout:', {
        url: originalRequest?.url,
        status: axiosError.response?.status,
      })
      throw appError
    }

    if (!originalRequest?.skipGlobalErrorHandling && appError.kind !== 'validation') {
      await handleAppError(appError)
    }

    throw appError
  },
)

export const unwrapEnvelope = <T>(response: AxiosResponse<ApiEnvelope<T>>) => response.data.data

export const readEnvelope = <T>(response: AxiosResponse<ApiEnvelope<T>>) => response.data

export const mockRequest = async <T>(config: AxiosRequestConfig, data: T) => {
  apiClient.getUri(config)
  await sleep(520)
  return structuredClone(data)
}

export default apiClient
