import { authApi } from './authApi'
import { userService } from './userService'
import {
  buildSessionSnapshot,
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredClaims,
  getStoredUser,
  parseTokenClaims,
  setSession,
} from './authSession'
import { sleep } from '../utils/helpers'
import { authFlowLog } from '../shared/authFlowDebug'
import type {
  AuthActionResult,
  AuthPayload,
  AuthSessionSnapshot,
  ChangePasswordPayload,
  LoginSuccessData,
} from '../utils/types'
import { isAppError } from '../shared/errors/types'

const requireTokens = (accessToken: string, refreshToken: string, message?: string) => {
  if (!accessToken || !refreshToken) {
    throw new Error(message || 'Authentication response is missing tokens.')
  }
}

const persistSnapshot = (snapshot: AuthSessionSnapshot) => {
  setSession(snapshot)
  return snapshot
}

const withLatestPersistedTokens = (
  session: AuthSessionSnapshot,
  user = session.user,
): AuthSessionSnapshot => {
  const accessToken = getAccessToken() ?? session.accessToken
  const refreshToken = getRefreshToken() ?? session.refreshToken
  const claims = parseTokenClaims(accessToken) ?? session.claims

  return {
    ...session,
    accessToken,
    refreshToken,
    claims,
    user,
  }
}

const PROFILE_SYNC_RETRY_DELAYS = [250, 500, 900] as const
const shouldCallServerLogout = import.meta.env.VITE_ENABLE_SERVER_LOGOUT === 'true'

const normalizeAuthResponse = ({
  data,
  payload,
  profileCompleted,
}: {
  data: LoginSuccessData
  payload: AuthPayload
  profileCompleted?: boolean
}): AuthActionResult => {
  authFlowLog('login response:', data)

  if (data.reactivation_link) {
    clearSession()

    return {
      status: 'deactivated',
      reactivationLink: data.reactivation_link,
    }
  }

  const accessToken = data.access_token?.trim() ?? ''
  const refreshToken = data.refresh_token?.trim() ?? ''
  authFlowLog('parsed token:', {
    hasAccessToken: Boolean(accessToken),
    hasRefreshToken: Boolean(refreshToken),
    accessTokenLength: accessToken.length,
    refreshTokenLength: refreshToken.length,
  })

  requireTokens(accessToken, refreshToken)

  const session = persistSnapshot(
    buildSessionSnapshot({
      accessToken,
      refreshToken,
      existingUser: getStoredUser(),
      fallbackUserId: data.user_id ?? data.userId,
      fallbackEmail: payload.email,
      fallbackName: payload.name,
      profileCompleted,
    }),
  )
  authFlowLog('normalized user:', session.user)
  authFlowLog('stored access token:', localStorage.getItem('accessToken'))
  authFlowLog('stored refresh token:', localStorage.getItem('refreshToken'))

  return {
    status: 'authenticated',
    session,
  }
}

const syncSessionProfile = async ({
  session,
  fallbackProfileCompleted,
  retryDelays = [],
}: {
  session: AuthSessionSnapshot
  fallbackProfileCompleted?: boolean
  retryDelays?: number[]
}) => {
  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      const syncedUser = await userService.syncMyProfile(session.user, {
        skipGlobalErrorHandling: true,
      })
      authFlowLog('profile response/error:', syncedUser)

      return persistSnapshot(withLatestPersistedTokens(session, syncedUser))
    } catch (error) {
      authFlowLog('profile response/error:', error)
      const nextDelay = retryDelays[attempt]

      if (typeof nextDelay === 'number') {
        await sleep(nextDelay)
      }
    }
  }

  return persistSnapshot({
    ...withLatestPersistedTokens(session),
    user: {
      ...session.user,
      profileCompleted: fallbackProfileCompleted ?? session.user.profileCompleted ?? true,
    },
  })
}

export const authService = {
  restoreSession() {
    const accessToken = getAccessToken()
    const refreshToken = getRefreshToken()

    if (!accessToken) {
      clearSession()
      return null
    }

    const snapshot = buildSessionSnapshot({
      accessToken,
      refreshToken: refreshToken ?? '',
      existingUser: getStoredUser(),
      profileCompleted: getStoredUser()?.profileCompleted,
    })

    return persistSnapshot({
      ...snapshot,
      refreshToken: refreshToken ?? snapshot.refreshToken,
      claims: getStoredClaims() ?? snapshot.claims,
    })
  },

  async login(payload: AuthPayload): Promise<AuthActionResult> {
    const { data, message } = await authApi.login(payload)
    const result = normalizeAuthResponse({
      data,
      payload,
      profileCompleted: undefined,
    })

    if (result.status === 'authenticated' && result.session) {
      const session = await syncSessionProfile({
        session: result.session,
        fallbackProfileCompleted: undefined,
      })

      return {
        ...result,
        message,
        session,
      }
    }

    return {
      ...result,
      message,
    }
  },

  async register(payload: AuthPayload) {
    const { message } = await authApi.register(payload)

    const loginResult = await authApi.login(payload)
    authFlowLog('register/login response shape check:', {
      registerReturnsTokens: false,
      loginReturnsTokens: Boolean(loginResult.data?.access_token && loginResult.data?.refresh_token),
    })
    const authenticatedResult = normalizeAuthResponse({
      data: loginResult.data,
      payload,
      profileCompleted: false,
    })

    if (authenticatedResult.status !== 'authenticated' || !authenticatedResult.session) {
      throw new Error(
        loginResult.message || message || 'Registration succeeded but automatic sign-in could not be completed.',
      )
    }

    return syncSessionProfile({
      session: authenticatedResult.session,
      fallbackProfileCompleted: false,
      retryDelays: [...PROFILE_SYNC_RETRY_DELAYS],
    })
  },

  async logout() {
    const accessToken = getAccessToken()

    if (!accessToken) {
      clearSession()
      return
    }

    try {
      if (shouldCallServerLogout) {
        await authApi.logout(accessToken)
      } else {
        authFlowLog('server logout skipped. Set VITE_ENABLE_SERVER_LOGOUT=true to enable.')
      }
    } catch (error) {
      if (!isAppError(error) || ![401, 403].includes(error.httpStatus ?? 0)) {
        throw error
      }
    } finally {
      clearSession()
    }
  },

  async changePassword(payload: ChangePasswordPayload) {
    return authApi.changePassword(payload)
  },

  async deactivateMe() {
    try {
      await authApi.deactivateMe()
    } finally {
      clearSession()
    }
  },
}
