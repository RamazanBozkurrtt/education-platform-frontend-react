import { mockRequest } from './api'
import { getCurrentUser } from '../utils/mockData'
import { getInitials } from '../utils/helpers'
import type { AuthPayload, AuthResponse } from '../utils/types'

export const authService = {
  async login(payload: AuthPayload): Promise<AuthResponse> {
    const currentUser = getCurrentUser()
    const name = payload.email.split('@')[0].replace(/[._-]/g, ' ')
    const formattedName = name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')

    return mockRequest(
      { url: '/auth/login', method: 'POST', data: payload },
      {
        token: `mock-jwt-token-${Date.now()}`,
        user: {
          ...currentUser,
          name: formattedName || currentUser.name,
          email: payload.email,
          initials: getInitials(formattedName || currentUser.name),
        },
      },
    )
  },

  async register(payload: AuthPayload): Promise<AuthResponse> {
    const currentUser = getCurrentUser()

    return mockRequest(
      { url: '/auth/register', method: 'POST', data: payload },
      {
        token: `mock-jwt-token-${Date.now()}`,
        user: {
          ...currentUser,
          name: payload.name || currentUser.name,
          email: payload.email,
          initials: getInitials(payload.name || currentUser.name),
        },
      },
    )
  },

  async logout() {
    return mockRequest({ url: '/auth/logout', method: 'POST' }, { success: true })
  },
}
