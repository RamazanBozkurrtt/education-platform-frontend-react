import { clearSession } from '../../services/authSession'
import { authFlowLog, authFlowTrace } from '../authFlowDebug'
import { ROUTES } from '../../utils/constants'
import { logAppError } from './logClientError'
import type { AppError } from './types'

export const APP_ERROR_EVENT = 'app:error'

export interface AppErrorEventDetail {
  id: string
  createdAt: number
  error: AppError
}

interface HandleAppErrorOptions {
  notify?: boolean
  logout?: () => void | Promise<void>
  redirect?: (path: string) => void
}

const emitAppErrorEvent = (error: AppError) => {
  if (typeof window === 'undefined') {
    return
  }

  const detail: AppErrorEventDetail = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: Date.now(),
    error,
  }

  window.dispatchEvent(new CustomEvent<AppErrorEventDetail>(APP_ERROR_EVENT, { detail }))
}

const defaultRedirect = (path: string) => {
  if (typeof window === 'undefined') {
    return
  }

  if (window.location.pathname !== path) {
    window.location.replace(path)
  }
}

export const handleAppError = async (
  appError: AppError,
  options: HandleAppErrorOptions = {},
) => {
  logAppError(appError)

  const shouldNotify = options.notify ?? true
  const redirect = options.redirect ?? defaultRedirect
  const logout = options.logout ?? clearSession

  if (appError.kind === 'auth') {
    authFlowLog('handleAppError(auth): redirecting to login', appError)
    authFlowTrace('logout called from handleAppError')
    await logout()
    redirect(ROUTES.login)
    return
  }

  if (!shouldNotify) {
    return
  }

  if (appError.kind !== 'validation') {
    emitAppErrorEvent(appError)
  }
}
