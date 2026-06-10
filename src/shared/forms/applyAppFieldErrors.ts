import type { AppError } from '../errors/types'

export type SetFormError = (
  fieldName: string,
  error: {
    type?: string
    message?: string
  },
) => void

export const applyAppFieldErrors = (appError: AppError, setError: SetFormError) => {
  if (appError.kind !== 'validation' || !appError.fieldErrors) {
    return false
  }

  let applied = false

  Object.entries(appError.fieldErrors).forEach(([fieldName, messages]) => {
    const firstMessage = messages.find((message) => Boolean(message?.trim()))?.trim()

    if (!firstMessage) {
      return
    }

    setError(fieldName, {
      type: 'server',
      message: firstMessage,
    })
    applied = true
  })

  return applied
}

