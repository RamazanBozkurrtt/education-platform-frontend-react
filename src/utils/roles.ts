import type { AuthClaims, User } from './types'

const ROLE_PREFIX = 'ROLE_'

const toRoleArray = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && Boolean(entry.trim()))
  }

  if (typeof value === 'string' && value.trim()) {
    return value.split(/\s+/).filter(Boolean)
  }

  return []
}

export const normalizeRole = (role: string) => {
  const normalized = role.trim().toUpperCase()
  return normalized.startsWith(ROLE_PREFIX) ? normalized : `${ROLE_PREFIX}${normalized}`
}

export const extractRolesFromClaims = (claims: AuthClaims | null | undefined) => {
  if (!claims) {
    return [] as string[]
  }

  const roles = [
    ...toRoleArray(claims.roles),
    ...toRoleArray(claims.authorities),
    ...toRoleArray(claims.scope),
  ]

  return Array.from(new Set(roles.map(normalizeRole)))
}

export const extractRolesFromUser = (user: User | null | undefined) => {
  if (!user) {
    return [] as string[]
  }

  return Array.from(new Set(toRoleArray(user.roles).map(normalizeRole)))
}

export const extractAuthRoles = (user: User | null | undefined, claims: AuthClaims | null | undefined) => {
  return Array.from(new Set([...extractRolesFromUser(user), ...extractRolesFromClaims(claims)]))
}

export const hasRole = (subject: User | AuthClaims | null | undefined, role: string) => {
  if (!subject) {
    return false
  }

  const requiredRole = normalizeRole(role)
  const values = [
    ...toRoleArray((subject as User).roles),
    ...toRoleArray((subject as AuthClaims).roles),
    ...toRoleArray((subject as AuthClaims).authorities),
    ...toRoleArray((subject as AuthClaims).scope),
  ]

  return values.map(normalizeRole).includes(requiredRole)
}

export const isInstructor = (user: User | null | undefined, claims?: AuthClaims | null) =>
  hasRole(user, 'ROLE_INSTRUCTOR') || hasRole(claims, 'ROLE_INSTRUCTOR')

export const isAdmin = (user: User | null | undefined, claims?: AuthClaims | null) =>
  hasRole(user, 'ROLE_ADMIN') || hasRole(claims, 'ROLE_ADMIN')

