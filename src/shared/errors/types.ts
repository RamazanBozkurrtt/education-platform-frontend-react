export type AppErrorKind =
  | 'validation'
  | 'auth'
  | 'forbidden'
  | 'rate_limit'
  | 'not_found'
  | 'server'
  | 'network'
  | 'unknown'

export interface AppError {
  kind: AppErrorKind
  message: string
  httpStatus?: number
  code?: string
  fieldErrors?: Record<string, string[]>
  raw?: unknown
}

const APP_ERROR_KINDS: AppErrorKind[] = [
  'validation',
  'auth',
  'forbidden',
  'rate_limit',
  'not_found',
  'server',
  'network',
  'unknown',
]

export const isAppError = (error: unknown): error is AppError => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as Partial<AppError>

  return typeof candidate.message === 'string' &&
    APP_ERROR_KINDS.includes(candidate.kind as AppErrorKind)
}

export const getFirstFieldErrorMap = (fieldErrors?: Record<string, string[]>) => {
  if (!fieldErrors) {
    return {} as Record<string, string>
  }

  return Object.entries(fieldErrors).reduce<Record<string, string>>((result, [field, messages]) => {
    const firstMessage = messages.find((message) => Boolean(message?.trim()))?.trim()

    if (firstMessage) {
      result[field] = firstMessage
    }

    return result
  }, {})
}
