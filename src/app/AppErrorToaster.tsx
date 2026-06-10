import { useEffect, useState } from 'react'
import { APP_ERROR_EVENT, type AppErrorEventDetail } from '../shared/errors/handleAppError'
import { APP_TOAST_EVENT, type AppToastEventDetail, type AppToastTone, DEFAULT_APP_TOAST_DURATION_MS } from '../shared/notifications/appToast'

interface ToastItem {
  id: string
  message: string
  tone: AppToastTone
  details?: string[]
  createdAt: number
  durationMs: number
}

const MAX_TOAST_COUNT = 4
const ERROR_TOAST_TTL_MS = DEFAULT_APP_TOAST_DURATION_MS

const AppErrorToaster = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const appendToast = (toast: ToastItem) => {
      setToasts((current) => [...current.slice(-(MAX_TOAST_COUNT - 1)), toast])
    }

    const handleErrorEvent = (event: Event) => {
      const customEvent = event as CustomEvent<AppErrorEventDetail>
      const nextToast: ToastItem = {
        id: customEvent.detail.id,
        message: customEvent.detail.error.message,
        tone: 'error',
        createdAt: customEvent.detail.createdAt,
        durationMs: ERROR_TOAST_TTL_MS,
      }

      appendToast(nextToast)
    }

    const handleToastEvent = (event: Event) => {
      const customEvent = event as CustomEvent<AppToastEventDetail>
      const nextToast: ToastItem = {
        id: customEvent.detail.id,
        message: customEvent.detail.message,
        tone: customEvent.detail.tone,
        details: customEvent.detail.details,
        createdAt: customEvent.detail.createdAt,
        durationMs: customEvent.detail.durationMs,
      }

      appendToast(nextToast)
    }

    window.addEventListener(APP_ERROR_EVENT, handleErrorEvent)
    window.addEventListener(APP_TOAST_EVENT, handleToastEvent)

    return () => {
      window.removeEventListener(APP_ERROR_EVENT, handleErrorEvent)
      window.removeEventListener(APP_TOAST_EVENT, handleToastEvent)
    }
  }, [])

  useEffect(() => {
    if (toasts.length === 0) {
      return
    }

    const now = Date.now()
    const nextExpiry = Math.min(...toasts.map((toast) => toast.createdAt + toast.durationMs))
    const timeoutMs = Math.max(0, nextExpiry - now)

    const timer = window.setTimeout(() => {
      const currentTime = Date.now()
      setToasts((current) => current.filter((toast) => toast.createdAt + toast.durationMs > currentTime))
    }, timeoutMs + 5)

    return () => {
      window.clearTimeout(timer)
    }
  }, [toasts])

  const removeToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  if (toasts.length === 0) {
    return null
  }

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-[var(--radius-buttons)] px-4 py-3 text-sm shadow-[var(--shadow-sm)] ${toast.tone === 'error'
            ? 'border border-[color:var(--danger)] bg-[color:var(--surface-soft-peach)] text-[color:var(--danger)]'
            : 'border border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] theme-text'}`}
          role={toast.tone === 'error' ? 'alert' : 'status'}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p>{toast.message}</p>
              {toast.details && toast.details.length > 0 ? (
                <ul className={`mt-2 list-disc space-y-1 pl-5 text-xs ${toast.tone === 'error' ? 'text-[color:var(--danger)]' : 'theme-muted'}`}>
                  {toast.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button
              aria-label="Dismiss notification"
              className="theme-muted shrink-0 text-xs transition hover:opacity-70"
              onClick={() => removeToast(toast.id)}
              type="button"
            >
              x
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AppErrorToaster

