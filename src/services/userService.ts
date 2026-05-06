import api from './api'
import { API_ENDPOINTS } from './endpoints'
import { getInitials } from '../utils/helpers'
import { PROFILE_MEDIA_UPLOAD_URL, resolveServiceUrl } from '../config/api'
import { profileMediaUploadFieldName } from '../config/env'
import { getAccessToken } from './authSession'
import { authFlowLog } from '../shared/authFlowDebug'
import type { ApiEnvelope, User, UserProfilePayload, UserProfileResponse } from '../utils/types'

type ProfileResponseWithAliases = UserProfileResponse & {
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  social_links?: Record<string, string> | null
  profileCompleted?: boolean
  profile_completed?: boolean
}

const trimToUndefined = (value?: string) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

const isBlobUrl = (value?: string) => Boolean(value?.trim().toLocaleLowerCase('en-US').startsWith('blob:'))

const sanitizeAvatarUrl = (value?: string) => {
  const trimmed = trimToUndefined(value)

  if (!trimmed || isBlobUrl(trimmed)) {
    return undefined
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return resolveServiceUrl(trimmed)
}

const extractAvatarUrlFromResponse = (payload: unknown): string | undefined => {
  if (typeof payload === 'string') {
    return sanitizeAvatarUrl(payload)
  }

  if (!payload || typeof payload !== 'object') {
    return undefined
  }

  const response = payload as Record<string, unknown>

  if (typeof response.avatarUrl === 'string') {
    return sanitizeAvatarUrl(response.avatarUrl)
  }

  if (typeof response.url === 'string') {
    return sanitizeAvatarUrl(response.url)
  }

  if ('data' in response) {
    return extractAvatarUrlFromResponse(response.data)
  }

  return undefined
}

const normalizeSocialLinks = (socialLinks?: Record<string, string>) => {
  const entries = Object.entries(socialLinks ?? {})
    .map(([key, value]) => [key, value.trim()] as const)
    .filter(([, value]) => Boolean(value))

  return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

const resolveProfileField = (profileValue: string | null | undefined, currentValue: string | undefined) => {
  if (profileValue === null || typeof profileValue === 'undefined') {
    return currentValue
  }

  const normalizedValue = trimToUndefined(profileValue)

  return typeof normalizedValue === 'undefined'
    ? currentValue
    : normalizedValue
}

const isProfileCompleted = (profile: {
  firstName?: string
  lastName?: string
  headline?: string
  biography?: string
}) => Boolean(
  trimToUndefined(profile.firstName) &&
  trimToUndefined(profile.lastName) &&
  trimToUndefined(profile.headline) &&
  trimToUndefined(profile.biography),
)

const mergeUserWithProfile = (currentUser: User, profile: UserProfileResponse): User => {
  const profileWithAliases = profile as ProfileResponseWithAliases
  const firstName = resolveProfileField(profileWithAliases.firstName ?? profileWithAliases.first_name, currentUser.firstName)
  const lastName = resolveProfileField(profileWithAliases.lastName ?? profileWithAliases.last_name, currentUser.lastName)
  const headline = resolveProfileField(profileWithAliases.headline, currentUser.headline)
  const biography = resolveProfileField(profileWithAliases.biography, currentUser.biography)
  const avatarUrl = resolveProfileField(profileWithAliases.avatarUrl ?? profileWithAliases.avatar_url, currentUser.avatarUrl)
  const socialLinksSource = profileWithAliases.socialLinks ?? profileWithAliases.social_links ?? undefined
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || currentUser.name
  const normalizedSocialLinks = normalizeSocialLinks(socialLinksSource)
  const explicitProfileCompleted = typeof profileWithAliases.profileCompleted === 'boolean'
    ? profileWithAliases.profileCompleted
    : typeof profileWithAliases.profile_completed === 'boolean'
      ? profileWithAliases.profile_completed
      : undefined
  const email = trimToUndefined(profileWithAliases.email) ?? currentUser.email

  return {
    ...currentUser,
    email,
    firstName,
    lastName,
    name: fullName,
    initials: getInitials(fullName || email || 'User'),
    headline,
    biography,
    avatarUrl: sanitizeAvatarUrl(avatarUrl),
    socialLinks: typeof socialLinksSource === 'undefined' ? currentUser.socialLinks : normalizedSocialLinks,
    profileCompleted: typeof explicitProfileCompleted === 'boolean'
      ? explicitProfileCompleted
      : isProfileCompleted({
        firstName,
        lastName,
        headline,
        biography,
      }),
  }
}

const requireProfileData = (envelope: ApiEnvelope<UserProfileResponse>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined') {
    return envelope.data
  }

  throw new Error(envelope.message || fallbackMessage)
}

export const userService = {
  async uploadAvatar(file: File): Promise<string> {
    const uploadUrl = PROFILE_MEDIA_UPLOAD_URL.trim()
    if (!uploadUrl) {
      throw new Error('Profile image upload endpoint is not configured.')
    }

    const formData = new FormData()
    formData.append(profileMediaUploadFieldName, file)

    const response = await api.put<unknown>(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60_000,
      skipGlobalErrorHandling: true,
    })

    const avatarUrl = extractAvatarUrlFromResponse(response.data)

    if (avatarUrl) {
      return avatarUrl
    }

    const profile = await userService.getMyProfile()
    const profileAvatarUrl = sanitizeAvatarUrl(profile.avatarUrl)

    if (profileAvatarUrl) {
      return profileAvatarUrl
    }

    throw new Error('Avatar upload response is missing a persistent URL.')
  },

  async getMyProfile(options?: { skipAuthRefresh?: boolean; skipGlobalErrorHandling?: boolean }) {
    try {
      const response = await api.get<ApiEnvelope<UserProfileResponse>>(API_ENDPOINTS.users.me, options)
      const data = requireProfileData(response.data, 'Failed to fetch user profile.')
      authFlowLog('profile response/error:', data)
      return data
    } catch (error) {
      authFlowLog('profile response/error:', error)
      throw error
    }
  },

  async syncMyProfile(
    currentUser: User,
    options?: { skipAuthRefresh?: boolean; skipGlobalErrorHandling?: boolean },
  ): Promise<User> {
    authFlowLog('profile request enabled:', {
      enabled: true,
      userId: currentUser.id,
      email: currentUser.email,
      tokenExists: Boolean(getAccessToken()),
    })
    const profile = await userService.getMyProfile(options)
    return mergeUserWithProfile(currentUser, profile)
  },

  async updateProfile(currentUser: User, payload: UserProfilePayload): Promise<User> {
    const normalizedPayload: UserProfilePayload = { ...payload }

    if (typeof payload.avatarUrl !== 'undefined') {
      normalizedPayload.avatarUrl = sanitizeAvatarUrl(payload.avatarUrl)
    }

    const response = await api.put<ApiEnvelope<UserProfileResponse>>(API_ENDPOINTS.users.me, normalizedPayload)
    const profile = requireProfileData(response.data, 'Failed to update user profile.')

    return mergeUserWithProfile(currentUser, profile)
  },
}
