import axios from 'axios'
import type { ApiErrorBag, ApiEnvelope } from '../../utils/types'
import type { AppError, AppErrorKind } from './types'
import { isAppError } from './types'

const DEFAULT_MESSAGES: Record<AppErrorKind, string> = {
  validation: 'Please check the highlighted fields.',
  auth: 'Your session has expired. Please sign in again.',
  forbidden: 'You do not have permission to perform this action.',
  rate_limit: 'Too many requests. Please wait and try again.',
  not_found: 'The requested resource could not be found.',
  server: 'Something went wrong on the server. Please try again.',
  network: 'Unable to reach the server. Please check your connection.',
  unknown: 'Something went wrong. Please try again.',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const normalizeErrorMessages = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString).map((message) => message.trim())
  }

  if (isNonEmptyString(value)) {
    return [value.trim()]
  }

  return []
}

const normalizeFieldErrors = (errors: ApiErrorBag | unknown): Record<string, string[]> | undefined => {
  if (!errors) {
    return undefined
  }

  if (Array.isArray(errors) || typeof errors === 'string') {
    const rootMessages = normalizeErrorMessages(errors)
    return rootMessages.length > 0 ? { _error: rootMessages } : undefined
  }

  if (!isRecord(errors)) {
    return undefined
  }

  const result = Object.entries(errors).reduce<Record<string, string[]>>((accumulator, [field, value]) => {
    const messages = normalizeErrorMessages(value)

    if (messages.length > 0) {
      accumulator[field] = messages
    }

    return accumulator
  }, {})

  return Object.keys(result).length > 0 ? result : undefined
}

const getFirstMessageFromFieldErrors = (fieldErrors?: Record<string, string[]>) => {
  if (!fieldErrors) {
    return undefined
  }

  for (const messages of Object.values(fieldErrors)) {
    const firstMessage = messages.find((message) => Boolean(message?.trim()))?.trim()

    if (firstMessage) {
      return firstMessage
    }
  }

  return undefined
}

const toNumberOrUndefined = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  return undefined
}

const resolveKindFromStatus = (status: number | undefined, fieldErrors?: Record<string, string[]>): AppErrorKind => {
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    return 'validation'
  }

  if (!status) {
    return 'unknown'
  }

  if (status === 400 || status === 422) {
    return 'validation'
  }

  if (status === 401) {
    return 'auth'
  }

  if (status === 403) {
    return 'forbidden'
  }

  if (status === 404) {
    return 'not_found'
  }

  if (status === 429) {
    return 'rate_limit'
  }

  if (status >= 500) {
    return 'server'
  }

  return 'unknown'
}

const normalizeApiPayload = (payload: unknown) => {
  if (!isRecord(payload)) {
    return {
      message: undefined as string | undefined,
      status: undefined as number | undefined,
      code: undefined as string | undefined,
      fieldErrors: undefined as Record<string, string[]> | undefined,
    }
  }

  const serviceEnvelope = payload as Partial<ApiEnvelope<unknown>> & Record<string, unknown>
  const message = isNonEmptyString(serviceEnvelope.message)
    ? serviceEnvelope.message.trim()
    : undefined
  const status = toNumberOrUndefined(serviceEnvelope.status)
  const code = isNonEmptyString(serviceEnvelope.error)
    ? serviceEnvelope.error.trim()
    : isNonEmptyString(serviceEnvelope.code)
      ? serviceEnvelope.code.trim()
      : undefined
  const fieldErrors = normalizeFieldErrors(serviceEnvelope.errors)

  return {
    message,
    status,
    code,
    fieldErrors,
  }
}

export const normalizeApiError = (error: unknown): AppError => {
  if (isAppError(error)) {
    return error
  }

  if (!axios.isAxiosError(error)) {
    if (error instanceof Error && error.message.trim()) {
      return {
        kind: 'unknown',
        message: error.message.trim(),
        raw: error,
      }
    }

    return {
      kind: 'unknown',
      message: DEFAULT_MESSAGES.unknown,
      raw: error,
    }
  }

  const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(error.message ?? '')

  if (!error.response) {
    return {
      kind: 'network',
      message: isTimeout ? 'Request timed out. Please try again.' : DEFAULT_MESSAGES.network,
      code: error.code,
      raw: error,
    }
  }

  const payload = normalizeApiPayload(error.response.data)
  const httpStatus = error.response.status ?? payload.status
  const kind = resolveKindFromStatus(httpStatus, payload.fieldErrors)
  const message =
    payload.message ||
    getFirstMessageFromFieldErrors(payload.fieldErrors) ||
    (isTimeout ? 'Request timed out. Please try again.' : DEFAULT_MESSAGES[kind]) ||
    DEFAULT_MESSAGES.unknown

  return {
    kind,
    message,
    httpStatus,
    code: payload.code ?? error.code,
    fieldErrors: payload.fieldErrors,
    raw: error.response.data ?? error,
  }
}

