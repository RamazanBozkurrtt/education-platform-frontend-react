import api from './api'
import { API_ENDPOINTS } from './endpoints'
import type { ApiEnvelope } from '../utils/types'

const COURSE_IMAGE_ALLOWED_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/svg+xml']
const LESSON_VIDEO_ALLOWED_TYPES = ['video/mp4']

const assertAllowedFileType = (file: File, allowedTypes: string[], label: string) => {
  if (allowedTypes.includes(file.type)) {
    return
  }

  throw new Error(`${label} file type is not supported: ${file.type || 'unknown'}.`)
}

const createMultipartPayload = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const toNonEmptyText = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const toEpochMilliseconds = (value: unknown) => {
  if (typeof value === 'string' && value.trim().length > 0) {
    const numericCandidate = Number(value)

    if (Number.isFinite(numericCandidate) && numericCandidate > 0) {
      return numericCandidate > 1_000_000_000_000 ? numericCandidate : numericCandidate * 1_000
    }

    const parsedDate = Date.parse(value)
    if (Number.isFinite(parsedDate) && parsedDate > 0) {
      return parsedDate
    }

    return null
  }

  const numericValue = typeof value === 'number' ? value : NaN

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null
  }

  // Values greater than 1e12 are most likely already in milliseconds.
  return numericValue > 1_000_000_000_000 ? numericValue : numericValue * 1_000
}

const resolveDirectExpiryValue = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const numericCandidate = Number(trimmed)

  if (Number.isFinite(numericCandidate) && numericCandidate > 0) {
    if (numericCandidate > 1_000_000_000_000) {
      return numericCandidate
    }

    // Typical JWT-style epoch seconds.
    if (numericCandidate > 1_000_000_000) {
      return numericCandidate * 1_000
    }

    // Some providers return relative lifetime in seconds.
    if (numericCandidate <= 604_800) {
      return Date.now() + (numericCandidate * 1_000)
    }
  }

  const parsedDate = Date.parse(trimmed)
  return Number.isFinite(parsedDate) && parsedDate > 0 ? parsedDate : null
}

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  return window.atob(normalized + padding)
}

const extractJwtExp = (token: string) => {
  const parts = token.split('.')

  if (parts.length < 2) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: unknown }
    return toEpochMilliseconds(payload.exp)
  } catch {
    return null
  }
}

const parseAmzDate = (value: string) => {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/)

  if (!match) {
    return null
  }

  const [, year, month, day, hour, minute, second] = match
  const utcMilliseconds = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  )

  return Number.isFinite(utcMilliseconds) ? utcMilliseconds : null
}

const resolveExpiryFromPlaybackUrl = (playbackUrl: string) => {
  try {
    const url = new URL(playbackUrl, window.location.origin)

    const directExpiryCandidates = [
      url.searchParams.get('exp'),
      url.searchParams.get('expires'),
      url.searchParams.get('expiresAt'),
      url.searchParams.get('Expires'),
      url.searchParams.get('expiry'),
    ]

    for (const candidate of directExpiryCandidates) {
      if (!candidate) {
        continue
      }

      const value = resolveDirectExpiryValue(candidate)
      if (value) {
        return value
      }
    }

    const tokenCandidates = [
      url.searchParams.get('token'),
      url.searchParams.get('jwt'),
      url.searchParams.get('auth'),
      url.searchParams.get('signature'),
      url.searchParams.get('sig'),
    ]

    for (const candidate of tokenCandidates) {
      if (!candidate) {
        continue
      }

      const value = extractJwtExp(candidate)
      if (value) {
        return value
      }
    }

    const amzDate = url.searchParams.get('X-Amz-Date')
    const amzExpiresSeconds = Number(url.searchParams.get('X-Amz-Expires'))

    if (amzDate && Number.isFinite(amzExpiresSeconds) && amzExpiresSeconds > 0) {
      const startTimestamp = parseAmzDate(amzDate)

      if (startTimestamp) {
        return startTimestamp + (amzExpiresSeconds * 1_000)
      }
    }
  } catch {
    return null
  }

  return null
}

const extractPlaybackUrlPayload = (value: unknown) => {
  if (typeof value === 'string') {
    return value
  }

  const source = toRecord(value)
  return toNonEmptyText(source.url ?? source.playbackUrl ?? source.videoUrl)
}

const extractPlaybackUrl = (envelope: ApiEnvelope<unknown>) => {
  const fromEnvelopeData = extractPlaybackUrlPayload(envelope.data)

  if (fromEnvelopeData) {
    return fromEnvelopeData
  }

  const fromEnvelopeRoot = extractPlaybackUrlPayload(envelope)

  if (fromEnvelopeRoot) {
    return fromEnvelopeRoot
  }

  throw new Error(envelope.message || 'Playback URL response is missing a valid URL.')
}

export const courseMediaService = {
  async uploadCourseImage(courseId: string, file: File) {
    assertAllowedFileType(file, COURSE_IMAGE_ALLOWED_TYPES, 'Course image')

    await api.put(API_ENDPOINTS.courses.image.secured(courseId), createMultipartPayload(file), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60_000,
    })
  },

  async deleteCourseImage(courseId: string) {
    await api.delete(API_ENDPOINTS.courses.image.secured(courseId))
  },

  async uploadLessonVideo(courseId: string, lessonId: string, file: File) {
    assertAllowedFileType(file, LESSON_VIDEO_ALLOWED_TYPES, 'Lesson video')

    await api.put(API_ENDPOINTS.courses.lessons.video(courseId, lessonId), createMultipartPayload(file), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 5 * 60_000,
    })
  },

  async deleteLessonVideo(courseId: string, lessonId: string) {
    await api.delete(API_ENDPOINTS.courses.lessons.video(courseId, lessonId))
  },

  async getLessonPlaybackUrl(courseId: string, lessonId: string) {
    const response = await api.post<ApiEnvelope<unknown>>(
      API_ENDPOINTS.courses.lessons.playbackUrl(courseId, lessonId),
      undefined,
      { skipGlobalErrorHandling: true },
    )
    const url = extractPlaybackUrl(response.data)

    return {
      url,
      expiresAtMs: resolveExpiryFromPlaybackUrl(url),
    }
  },
}
