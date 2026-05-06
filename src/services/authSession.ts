import {
  AUTH_CLAIMS_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  LEGACY_AUTH_REFRESH_TOKEN_KEY,
  LEGACY_AUTH_TOKEN_KEY,
} from '../utils/constants'
import { getInitials } from '../utils/helpers'
import { authFlowTrace } from '../shared/authFlowDebug'
import type { AuthClaims, AuthSessionSnapshot, User } from '../utils/types'

const DEFAULT_ROLE_LABEL_KEY = 'user.roles.learningLead'
const DEFAULT_AVATAR_COLOR = 'from-cyan-400 to-blue-500'
const BEARER_PREFIX_REGEX = /^Bearer\s+/i

const pickFirstText = (...values: Array<string | null | undefined>) =>
  values.find((value) => typeof value === 'string' && Boolean(value.trim()))?.trim()

const normalizeToken = (value?: string | null) => {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  return trimmed.replace(BEARER_PREFIX_REGEX, '').trim()
}

const safeParse = <T>(value: string | null): T | null => {
  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalized.length % 4 || 4)) % 4)
  const decoded = window.atob(normalized + padding)
  const bytes = Uint8Array.from(decoded, (character) => character.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

const toDisplayName = (value: string) =>
  value
    .split(/[._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const splitNameByFirstSpace = (value?: string) => {
  const normalized = value?.trim().replace(/\s+/g, ' ')

  if (!normalized) {
    return { firstName: undefined as string | undefined, lastName: undefined as string | undefined }
  }

  const separatorIndex = normalized.indexOf(' ')

  if (separatorIndex < 0) {
    return {
      firstName: normalized,
      lastName: undefined,
    }
  }

  return {
    firstName: normalized.slice(0, separatorIndex),
    lastName: normalized.slice(separatorIndex + 1).trim() || undefined,
  }
}

const getClaimString = (claims: AuthClaims | null, keys: string[]) => {
  for (const key of keys) {
    const value = claims?.[key]

    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return undefined
}

const getClaimArray = (claims: AuthClaims | null, keys: string[]) => {
  for (const key of keys) {
    const value = claims?.[key]

    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    }

    if (typeof value === 'string' && value.trim()) {
      return value.split(/\s+/).filter(Boolean)
    }
  }

  return []
}

const normalizeStoredUser = (storedUser: User | null, email?: string) => {
  if (!storedUser || !email) {
    return storedUser
  }

  return storedUser.email.toLowerCase() === email.toLowerCase() ? storedUser : null
}

const readTokenWithLegacyFallback = (key: string, legacyKey: string) => {
  const preferred = localStorage.getItem(key)

  if (preferred?.trim()) {
    return preferred
  }

  const legacy = localStorage.getItem(legacyKey)

  if (legacy?.trim()) {
    localStorage.setItem(key, legacy)
    localStorage.removeItem(legacyKey)
    return legacy
  }

  return null
}

export const getAccessToken = () => readTokenWithLegacyFallback(AUTH_TOKEN_KEY, LEGACY_AUTH_TOKEN_KEY)

export const getRefreshToken = () => readTokenWithLegacyFallback(AUTH_REFRESH_TOKEN_KEY, LEGACY_AUTH_REFRESH_TOKEN_KEY)

export const getStoredClaims = () => safeParse<AuthClaims>(localStorage.getItem(AUTH_CLAIMS_KEY))

export const getStoredUser = () => safeParse<User>(localStorage.getItem(AUTH_USER_KEY))

export const parseTokenClaims = (token?: string | null): AuthClaims | null => {
  if (!token) {
    return null
  }

  const [, payload] = token.split('.')

  if (!payload) {
    return null
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as AuthClaims
  } catch {
    return null
  }
}

export const buildUserFromSession = ({
  accessToken,
  existingUser,
  fallbackEmail,
  fallbackName,
  profileCompleted,
}: {
  accessToken?: string | null
  existingUser?: User | null
  fallbackEmail?: string
  fallbackName?: string
  profileCompleted?: boolean
}): User => {
  const claims = parseTokenClaims(accessToken)
  const claimEmail =
    getClaimString(claims, ['email', 'preferred_username', 'username']) ??
    getClaimString(claims, ['sub'])
  const storedUser = normalizeStoredUser(existingUser ?? null, claimEmail ?? fallbackEmail)
  const email = pickFirstText(claimEmail, fallbackEmail, storedUser?.email) ?? ''
  const preferredDisplayName = pickFirstText(
    getClaimString(claims, ['name']),
    fallbackName,
    storedUser?.name,
    toDisplayName(email.split('@')[0] ?? 'User'),
  ) ?? 'User'
  const splitName = splitNameByFirstSpace(preferredDisplayName)
  const firstName =
    getClaimString(claims, ['given_name', 'firstName', 'first_name']) ??
    storedUser?.firstName ??
    splitName.firstName
  const lastName =
    getClaimString(claims, ['family_name', 'lastName', 'last_name']) ??
    storedUser?.lastName ??
    splitName.lastName
  const fullName = pickFirstText(
    [firstName, lastName].filter(Boolean).join(' '),
    preferredDisplayName,
    storedUser?.name,
  ) ?? 'User'
  const roles = getClaimArray(claims, ['roles', 'authorities', 'scope'])
  const derivedLastName = pickFirstText(lastName, storedUser?.lastName, splitNameByFirstSpace(fullName).lastName)

  return {
    id:
      getClaimString(claims, ['user_id', 'userId', 'uid', 'sub']) ??
      storedUser?.id ??
      email,
    name: fullName,
    email,
    roleLabelKey: storedUser?.roleLabelKey ?? (roles.length > 0 ? DEFAULT_ROLE_LABEL_KEY : DEFAULT_ROLE_LABEL_KEY),
    avatarColor: storedUser?.avatarColor ?? DEFAULT_AVATAR_COLOR,
    initials: getInitials(fullName || email || 'User'),
    profileCompleted: profileCompleted ?? storedUser?.profileCompleted ?? true,
    firstName: firstName ?? storedUser?.firstName ?? splitNameByFirstSpace(fullName).firstName,
    lastName: derivedLastName,
    headline: storedUser?.headline,
    biography: storedUser?.biography,
    avatarUrl: storedUser?.avatarUrl,
    socialLinks: storedUser?.socialLinks,
  }
}

export const buildSessionSnapshot = ({
  accessToken,
  refreshToken,
  existingUser,
  fallbackEmail,
  fallbackName,
  profileCompleted,
}: {
  accessToken: string
  refreshToken: string
  existingUser?: User | null
  fallbackEmail?: string
  fallbackName?: string
  profileCompleted?: boolean
}): AuthSessionSnapshot => {
  const normalizedAccessToken = normalizeToken(accessToken)
  const normalizedRefreshToken = normalizeToken(refreshToken)
  const claims = parseTokenClaims(normalizedAccessToken)

  return {
    accessToken: normalizedAccessToken,
    refreshToken: normalizedRefreshToken,
    claims,
    user: buildUserFromSession({
      accessToken: normalizedAccessToken,
      existingUser,
      fallbackEmail,
      fallbackName,
      profileCompleted,
    }),
  }
}

export const setSession = ({
  accessToken,
  refreshToken,
  user,
  claims,
}: {
  accessToken: string | null
  refreshToken: string | null
  user?: User | null
  claims?: AuthClaims | null
}) => {
  const normalizedAccessToken = normalizeToken(accessToken)
  const normalizedRefreshToken = normalizeToken(refreshToken)

  if (normalizedAccessToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, normalizedAccessToken)
    localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY)
  }

  if (normalizedRefreshToken) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, normalizedRefreshToken)
    localStorage.removeItem(LEGACY_AUTH_REFRESH_TOKEN_KEY)
  } else {
    localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
    localStorage.removeItem(LEGACY_AUTH_REFRESH_TOKEN_KEY)
  }

  if (user) {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(AUTH_USER_KEY)
  }

  const nextClaims = claims ?? parseTokenClaims(normalizedAccessToken)

  if (nextClaims) {
    localStorage.setItem(AUTH_CLAIMS_KEY, JSON.stringify(nextClaims))
  } else {
    localStorage.removeItem(AUTH_CLAIMS_KEY)
  }
}

export const clearSession = () => {
  authFlowTrace('logout/clearAuth called')
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY)
  localStorage.removeItem(LEGACY_AUTH_REFRESH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_CLAIMS_KEY)
}
