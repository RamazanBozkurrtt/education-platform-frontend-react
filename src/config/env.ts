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
const readRuntimeApiBaseUrl = () => trimToUndefined(window.__EDUBASE_CONFIG__?.API_BASE_URL)

const readRequiredEnv = (key: EnvKey, fallbackValue?: string) => {
  const value = trimToUndefined(import.meta.env[key])

  if (!value) {
    if (fallbackValue) {
      return fallbackValue
    }

    throw new Error(`[env] Missing required variable: ${key}. Add it to the active .env file.`)
  }

  return value
}

const readOptionalEnv = (key: EnvKey) => trimToUndefined(import.meta.env[key])

export const apiBaseUrl = normalizeBaseUrl(
  readRuntimeApiBaseUrl() ?? readRequiredEnv('VITE_API_BASE_URL', 'http://localhost:30090'),
)
export const profileMediaUploadUrl = readOptionalEnv('VITE_PROFILE_MEDIA_UPLOAD_URL')
export const profileMediaUploadFieldName = readOptionalEnv('VITE_PROFILE_MEDIA_UPLOAD_FIELD_NAME') ?? 'file'
