import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { authService } from '../services/authService'
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../utils/constants'
import type { AuthPayload, User } from '../utils/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (payload: AuthPayload) => Promise<void>
  register: (payload: AuthPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = localStorage.getItem(AUTH_USER_KEY)

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser) as User)
    }

    setIsBootstrapping(false)
  }, [])

  const persistSession = (nextToken: string, nextUser: User) => {
    setToken(nextToken)
    setUser(nextUser)
    localStorage.setItem(AUTH_TOKEN_KEY, nextToken)
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser))
  }

  const clearSession = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_USER_KEY)
  }

  const login = async (payload: AuthPayload) => {
    const response = await authService.login(payload)
    persistSession(response.token, response.user)
  }

  const register = async (payload: AuthPayload) => {
    const response = await authService.register(payload)
    persistSession(response.token, response.user)
  }

  const logout = async () => {
    await authService.logout()
    clearSession()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isBootstrapping,
        login,
        register,
        logout,
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
