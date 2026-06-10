import type { AppError } from './types'

const CLIENT_ERROR_LOG_ENDPOINT = '/__client-error-log'
const LOCAL_BUFFER_KEY = 'app:error-log-buffer'
const LOCAL_BUFFER_LIMIT = 100

export type ClientErrorSource =
  | 'app_error'
  | 'error_boundary'
  | 'window_error'
  | 'unhandled_rejection'
  | (string & {})

interface ClientErrorLogPayload {
  source: ClientErrorSource
  message: string
  createdAt: string
  path: string
  details?: unknown
}

const resolveMessage = (value: unknown) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (value instanceof Error && value.message.trim()) {
    return value.message.trim()
  }

  if (value && typeof value === 'object' && 'message' in value) {
    const candidate = (value as { message?: unknown }).message
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return 'Unexpected error'
}

const toSerializable = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }

  if (value === undefined || value === null) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return String(value)
  }
}

const appendToLocalBuffer = (entry: ClientErrorLogPayload) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const stored = window.localStorage.getItem(LOCAL_BUFFER_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    const safeEntries = Array.isArray(parsed) ? parsed : []

    safeEntries.push(entry)

    if (safeEntries.length > LOCAL_BUFFER_LIMIT) {
      safeEntries.splice(0, safeEntries.length - LOCAL_BUFFER_LIMIT)
    }

    window.localStorage.setItem(LOCAL_BUFFER_KEY, JSON.stringify(safeEntries))
  } catch {
    // Avoid breaking UX if localStorage is unavailable.
  }
}

const postErrorLog = async (entry: ClientErrorLogPayload) => {
  try {
    const response = await fetch(CLIENT_ERROR_LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entry),
      keepalive: true,
    })

    if (!response.ok) {
      throw new Error(`Logging endpoint responded with ${response.status}.`)
    }
  } catch {
    appendToLocalBuffer(entry)
  }
}

export const logClientError = (source: ClientErrorSource, error: unknown, details?: unknown) => {
  if (typeof window === 'undefined') {
    return
  }

  const payload: ClientErrorLogPayload = {
    source,
    message: resolveMessage(error),
    createdAt: new Date().toISOString(),
    path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    details: toSerializable(details ?? error),
  }

  void postErrorLog(payload)
}

export const logAppError = (appError: AppError) => {
  logClientError('app_error', appError.message, appError)
}
