import api from './api'
import { API_ENDPOINTS } from './endpoints'
import { isAppError } from '../shared/errors/types'
import type { ApiEnvelope, InstructorProfilePayload, InstructorProfileResponse } from '../utils/types'
import { normalizeRole } from '../utils/roles'

interface ApplyInstructorResult {
  raw: unknown
  profile: InstructorProfileResponse | null
  accessToken: string | null
  refreshToken: string | null
  roles: string[]
  userId: string | null
}

const APPLY_ENDPOINTS = [
  API_ENDPOINTS.instructor.apply,
  '/api/v1/instructors/me',
] as const

const PROFILE_ENDPOINTS = [
  API_ENDPOINTS.instructor.me,
  '/api/v1/instructor/me',
] as const

const UPDATE_ENDPOINTS = [
  API_ENDPOINTS.instructor.updateMe,
  '/api/v1/instructor/me',
] as const

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const trimToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

const toIdentifier = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }

  return trimToUndefined(value)
}

const normalizeOptionalUrl = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const mapPayload = (payload: InstructorProfilePayload): InstructorProfilePayload => ({
  displayName: payload.displayName.trim(),
  biography: payload.biography.trim(),
  expertise: payload.expertise
    .map((item) => item.trim())
    .filter(Boolean),
  websiteUrl: normalizeOptionalUrl(payload.websiteUrl),
  linkedinUrl: normalizeOptionalUrl(payload.linkedinUrl),
  githubUrl: normalizeOptionalUrl(payload.githubUrl),
  profileImageUrl: normalizeOptionalUrl(payload.profileImageUrl),
})

const unwrapEnvelopeData = (value: unknown) => {
  const envelope = toRecord(value) as Partial<ApiEnvelope<unknown>>

  if (typeof envelope.data !== 'undefined') {
    return envelope.data
  }

  return value
}

const readValueByPath = (source: Record<string, unknown>, path: string) => {
  const segments = path.split('.')
  let current: unknown = source

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return undefined
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

const readFirstString = (source: Record<string, unknown>, paths: string[]) => {
  for (const path of paths) {
    const value = readValueByPath(source, path)
    const normalized = trimToUndefined(value)

    if (normalized) {
      return normalized
    }
  }

  return null
}

const readRoles = (source: Record<string, unknown>) => {
  const candidates = [
    readValueByPath(source, 'roles'),
    readValueByPath(source, 'authorities'),
    readValueByPath(source, 'scope'),
    readValueByPath(source, 'user.roles'),
    readValueByPath(source, 'user.authorities'),
    readValueByPath(source, 'user.scope'),
  ]
  const values: string[] = []

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      values.push(...candidate.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())))
      continue
    }

    if (typeof candidate === 'string' && candidate.trim()) {
      values.push(...candidate.split(/\s+/))
    }
  }

  return Array.from(new Set(values.map((value) => normalizeRole(value))))
}

const toExpertiseArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return [] as string[]
}

const toInstructorProfile = (value: unknown): InstructorProfileResponse | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const source = toRecord(value)
  const profileSource = toRecord(source.profile).displayName
    ? toRecord(source.profile)
    : source

  const displayName = trimToUndefined(profileSource.displayName) ?? trimToUndefined(profileSource.name)
  const biography = trimToUndefined(profileSource.biography) ?? trimToUndefined(profileSource.bio)
  const expertise = toExpertiseArray(profileSource.expertise)

  if (!displayName && !biography && expertise.length === 0) {
    return null
  }

  return {
    id: toIdentifier(profileSource.id),
    userId: toIdentifier(profileSource.userId ?? profileSource.user_id),
    status: trimToUndefined(profileSource.status),
    displayName: displayName ?? '',
    biography: biography ?? '',
    expertise,
    websiteUrl: trimToUndefined(profileSource.websiteUrl ?? profileSource.website_url),
    linkedinUrl: trimToUndefined(profileSource.linkedinUrl ?? profileSource.linkedin_url),
    githubUrl: trimToUndefined(profileSource.githubUrl ?? profileSource.github_url),
    profileImageUrl: trimToUndefined(profileSource.profileImageUrl ?? profileSource.profile_image_url),
    roles: readRoles(source),
    access_token: trimToUndefined(profileSource.access_token ?? source.access_token),
    refresh_token: trimToUndefined(profileSource.refresh_token ?? source.refresh_token),
    createdAt: trimToUndefined(profileSource.createdAt ?? source.createdAt),
    updatedAt: trimToUndefined(profileSource.updatedAt ?? source.updatedAt),
  }
}

const shouldRetryWithNextEndpoint = (error: unknown) => {
  return isAppError(error) && (error.httpStatus === 404 || error.httpStatus === 405)
}

const isMissingApplyEndpointError = (error: unknown) =>
  isAppError(error) && (error.httpStatus === 404 || error.httpStatus === 405)

const withFallback = async <T>(requests: Array<() => Promise<T>>) => {
  let lastError: unknown

  for (let index = 0; index < requests.length; index += 1) {
    try {
      return await requests[index]()
    } catch (error) {
      lastError = error

      if (index < requests.length - 1 && shouldRetryWithNextEndpoint(error)) {
        continue
      }

      throw error
    }
  }

  throw lastError ?? new Error('Request could not be completed.')
}

const parseApplyResult = (rawResponse: unknown): ApplyInstructorResult => {
  const data = unwrapEnvelopeData(rawResponse)
  const source = toRecord(data)
  const accessToken = readFirstString(source, [
    'access_token',
    'accessToken',
    'token',
    'tokens.access_token',
    'tokens.accessToken',
    'auth.access_token',
    'auth.accessToken',
  ])
  const refreshToken = readFirstString(source, [
    'refresh_token',
    'refreshToken',
    'tokens.refresh_token',
    'tokens.refreshToken',
    'auth.refresh_token',
    'auth.refreshToken',
  ])

  return {
    raw: data,
    profile: toInstructorProfile(data),
    accessToken,
    refreshToken,
    roles: readRoles(source),
    userId: readFirstString(source, ['user_id', 'userId', 'user.id', 'profile.user_id', 'profile.userId']),
  }
}

export const instructorService = {
  async getMyInstructorProfile() {
    return withFallback(
      PROFILE_ENDPOINTS.map((endpoint) => async () => {
        const response = await api.get<ApiEnvelope<unknown>>(endpoint)
        const profile = toInstructorProfile(unwrapEnvelopeData(response.data))

        if (!profile) {
          throw new Error('Instructor profile response is missing profile data.')
        }

        return profile
      }),
    )
  },

  async applyAsInstructor(payload: InstructorProfilePayload) {
    const normalizedPayload = mapPayload(payload)

    try {
      const response = await withFallback(
        APPLY_ENDPOINTS.map((endpoint) => async () => {
          const result = await api.post<ApiEnvelope<unknown>>(endpoint, normalizedPayload)
          return result.data
        }),
      )

      return parseApplyResult(response)
    } catch (error) {
      if (isMissingApplyEndpointError(error)) {
        throw new Error(
          'Instructor apply endpoint bulunamadi. Backend tarafinda instructor basvuru endpoint yolunu kontrol et.',
        )
      }

      throw error
    }
  },

  async updateInstructorProfile(payload: InstructorProfilePayload) {
    const normalizedPayload = mapPayload(payload)

    return withFallback(
      UPDATE_ENDPOINTS.map((endpoint) => async () => {
        const response = await api.put<ApiEnvelope<unknown>>(endpoint, normalizedPayload)
        const profile = toInstructorProfile(unwrapEnvelopeData(response.data))

        if (!profile) {
          throw new Error('Instructor profile update response is missing profile data.')
        }

        return profile
      }),
    )
  },
}
