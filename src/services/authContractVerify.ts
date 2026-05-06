import { authApi } from './authApi'
import { buildSessionSnapshot, getRefreshToken, getStoredUser, setSession } from './authSession'
import type { AuthPayload } from '../utils/types'

export interface AuthContractVerifyResult {
  loginTokensReceived: true
  refreshTokenRotated: true
  storageUpdated: true
  staleRefreshTokenRejected: true
}

const requireToken = (value: string | undefined, fieldName: 'access_token' | 'refresh_token') => {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`Auth contract violation: missing ${fieldName}.`)
  }

  return normalizedValue
}

export const verifyAuthContract = async (payload: AuthPayload): Promise<AuthContractVerifyResult> => {
  const loginResponse = await authApi.login(payload)
  const loginAccessToken = requireToken(loginResponse.data.access_token, 'access_token')
  const loginRefreshToken = requireToken(loginResponse.data.refresh_token, 'refresh_token')

  setSession(
    buildSessionSnapshot({
      accessToken: loginAccessToken,
      refreshToken: loginRefreshToken,
      existingUser: getStoredUser(),
      fallbackEmail: payload.email,
      fallbackName: payload.name,
    }),
  )

  const refreshedTokens = await authApi.refreshToken(loginRefreshToken)
  const nextAccessToken = requireToken(refreshedTokens.access_token, 'access_token')
  const nextRefreshToken = requireToken(refreshedTokens.refresh_token, 'refresh_token')

  setSession(
    buildSessionSnapshot({
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      existingUser: getStoredUser(),
      fallbackEmail: payload.email,
      fallbackName: payload.name,
    }),
  )

  if (getRefreshToken() !== nextRefreshToken) {
    throw new Error('Auth contract violation: refreshed token was not persisted.')
  }

  let staleRefreshTokenRejected = false

  try {
    await authApi.refreshToken(loginRefreshToken)
  } catch {
    staleRefreshTokenRejected = true
  }

  if (!staleRefreshTokenRejected) {
    throw new Error('Auth contract violation: stale refresh token was accepted.')
  }

  return {
    loginTokensReceived: true,
    refreshTokenRotated: true,
    storageUpdated: true,
    staleRefreshTokenRejected: true,
  }
}
