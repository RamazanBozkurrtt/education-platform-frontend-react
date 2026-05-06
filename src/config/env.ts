type EnvKey =
  | 'VITE_API_BASE_URL'
  | 'VITE_PROFILE_MEDIA_UPLOAD_URL'
  | 'VITE_PROFILE_MEDIA_UPLOAD_FIELD_NAME'

const trimToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '')

const readRequiredEnv = (key: EnvKey) => {
  const value = trimToUndefined(import.meta.env[key])

  if (!value) {
    throw new Error(`[env] Missing required variable: ${key}. Add it to the active .env file.`)
  }

  return value
}

const readOptionalEnv = (key: EnvKey) => trimToUndefined(import.meta.env[key])

export const apiBaseUrl = normalizeBaseUrl(readRequiredEnv('VITE_API_BASE_URL'))
export const profileMediaUploadUrl = readOptionalEnv('VITE_PROFILE_MEDIA_UPLOAD_URL')
export const profileMediaUploadFieldName = readOptionalEnv('VITE_PROFILE_MEDIA_UPLOAD_FIELD_NAME') ?? 'file'
