import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authService } from '../services/authService'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  parseTokenClaims,
  setSession,
} from '../services/authSession'
import { userService } from '../services/userService'
import { authFlowLog, authFlowTrace } from '../shared/authFlowDebug'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import type {
  AuthActionResult,
  AuthClaims,
  AuthPayload,
  AuthSessionSnapshot,
  ChangePasswordPayload,
  User,
  UserProfilePayload,
} from '../utils/types'

interface AuthContextValue {
  user: User | null
  claims: AuthClaims | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (payload: AuthPayload) => Promise<AuthActionResult>
  register: (payload: AuthPayload) => Promise<void>
  completeProfile: (payload: UserProfilePayload) => Promise<void>
  updateProfile: (payload: UserProfilePayload) => Promise<void>
  changePassword: (payload: ChangePasswordPayload) => Promise<string>
  logout: () => Promise<void>
  deactivateMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const applySnapshot = (
  snapshot: AuthSessionSnapshot | null,
  setUser: (user: User | null) => void,
  setClaims: (claims: AuthClaims | null) => void,
  setAccessToken: (token: string | null) => void,
  setRefreshToken: (token: string | null) => void,
) => {
  setUser(snapshot?.user ?? null)
  setClaims(snapshot?.claims ?? null)
  setAccessToken(snapshot?.accessToken ?? null)
  setRefreshToken(snapshot?.refreshToken ?? null)
}

const getSessionSubject = (accessToken: string | null, fallbackUser?: User | null) => {
  const claims = parseTokenClaims(accessToken)
  const candidate = claims?.sub ?? claims?.email ?? fallbackUser?.id ?? fallbackUser?.email

  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [claims, setClaims] = useState<AuthClaims | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    let isActive = true

    const bootstrapAuth = async () => {
      const snapshot = authService.restoreSession()
      authFlowLog('auth bootstrap snapshot:', snapshot)

      if (!isActive) {
        return
      }

      applySnapshot(snapshot, setUser, setClaims, setAccessToken, setRefreshTokenState)

      if (!snapshot?.accessToken) {
        authFlowLog('auth bootstrap: no access token, finishing bootstrap')
        setIsBootstrapping(false)
        return
      }

      const initialAccessToken = snapshot.accessToken
      const initialRefreshToken = snapshot.refreshToken
      const initialSubject = getSessionSubject(initialAccessToken, snapshot.user)
      const didSessionChangeSinceBootstrap = () =>
        getAccessToken() !== initialAccessToken || getRefreshToken() !== initialRefreshToken

      try {
        authFlowLog('profile request enabled:', {
          enabled: true,
          userId: snapshot.user.id,
          email: snapshot.user.email,
          tokenExists: Boolean(snapshot.accessToken),
        })
        const syncedUser = await userService.syncMyProfile(snapshot.user, {
          skipGlobalErrorHandling: true,
        })

        if (!isActive) {
          return
        }

        const currentAccessToken = getAccessToken()
        const currentRefreshToken = getRefreshToken()

        if (!currentAccessToken) {
          applySnapshot(null, setUser, setClaims, setAccessToken, setRefreshTokenState)
          return
        }

        const currentSubject = getSessionSubject(currentAccessToken, syncedUser)

        // Login may have happened while the bootstrap profile request was in flight.
        // In that case, skip applying stale bootstrap data from a different user.
        if (didSessionChangeSinceBootstrap() && initialSubject && currentSubject !== initialSubject) {
          return
        }

        const currentClaims = parseTokenClaims(currentAccessToken) ?? snapshot.claims
        const nextSnapshot = {
          ...snapshot,
          accessToken: currentAccessToken,
          refreshToken: currentRefreshToken ?? snapshot.refreshToken,
          claims: currentClaims,
          user: syncedUser,
        }

        setSession(nextSnapshot)
        applySnapshot(nextSnapshot, setUser, setClaims, setAccessToken, setRefreshTokenState)
        authFlowLog('auth bootstrap: synced profile and refreshed snapshot:', nextSnapshot)
      } catch (error) {
        const appError = normalizeApiError(error)
        const shouldClearSession = appError.kind === 'auth' || appError.kind === 'forbidden'
        authFlowLog('auth bootstrap profile sync error:', appError)

        if (shouldClearSession) {
          const currentAccessToken = getAccessToken()
          const currentSubject = getSessionSubject(currentAccessToken)

          // Never clear a newer session for a different user that replaced the bootstrapped one.
          if (
            didSessionChangeSinceBootstrap() &&
            currentAccessToken &&
            initialSubject &&
            currentSubject !== initialSubject
          ) {
            return
          }

          clearSession()
          queryClient.clear()
          authFlowTrace('logout called from bootstrap catch')

          if (isActive) {
            applySnapshot(null, setUser, setClaims, setAccessToken, setRefreshTokenState)
          }
        }
      } finally {
        if (isActive) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrapAuth()

    return () => {
      isActive = false
    }
  }, [])

  const login = async (payload: AuthPayload) => {
    const result = await authService.login(payload)
    authFlowLog('auth context login result:', result)

    if (result.session) {
      applySnapshot(result.session, setUser, setClaims, setAccessToken, setRefreshTokenState)
    } else {
      applySnapshot(null, setUser, setClaims, setAccessToken, setRefreshTokenState)
    }
    authFlowLog('auth state after login:', {
      isAuthenticated: Boolean(result.session?.accessToken),
      user: result.session?.user ?? null,
      accessToken: result.session?.accessToken ?? null,
      refreshToken: result.session?.refreshToken ?? null,
    })

    return result
  }

  const register = async (payload: AuthPayload) => {
    const snapshot = await authService.register(payload)
    applySnapshot(snapshot, setUser, setClaims, setAccessToken, setRefreshTokenState)
  }

  const persistUserProfile = async (payload: UserProfilePayload) => {
    if (!user || !accessToken) {
      throw new Error('Cannot update profile without an active session')
    }

    const nextUser = await userService.updateProfile(user, payload)
    const nextRefreshToken = refreshToken ?? getRefreshToken()

    setSession({
      accessToken,
      refreshToken: nextRefreshToken,
      user: nextUser,
      claims,
    })

    applySnapshot(
      {
        accessToken,
        refreshToken: nextRefreshToken ?? '',
        claims,
        user: nextUser,
      },
      setUser,
      setClaims,
      setAccessToken,
      setRefreshTokenState,
    )
  }

  const completeProfile = async (payload: UserProfilePayload) => {
    await persistUserProfile(payload)
  }

  const updateProfile = async (payload: UserProfilePayload) => {
    await persistUserProfile(payload)
  }

  const changePassword = async (payload: ChangePasswordPayload) => authService.changePassword(payload)

  const logout = async () => {
    authFlowTrace('logout called')
    await authService.logout()
    clearSession()
    queryClient.clear()
    applySnapshot(null, setUser, setClaims, setAccessToken, setRefreshTokenState)
  }

  const deactivateMe = async () => {
    authFlowTrace('deactivateMe called')
    await authService.deactivateMe()
    clearSession()
    queryClient.clear()
    applySnapshot(null, setUser, setClaims, setAccessToken, setRefreshTokenState)
  }

  useEffect(() => {
    authFlowLog('auth state:', {
      isBootstrapping,
      isAuthenticated: Boolean(accessToken),
      hasUser: Boolean(user),
      userId: user?.id,
    })
  }, [accessToken, isBootstrapping, user])

  return (
    <AuthContext.Provider
      value={{
        user,
        claims,
        accessToken,
        refreshToken,
        isAuthenticated: Boolean(accessToken),
        isBootstrapping,
        login,
        register,
        completeProfile,
        updateProfile,
        changePassword,
        logout,
        deactivateMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return context
}
