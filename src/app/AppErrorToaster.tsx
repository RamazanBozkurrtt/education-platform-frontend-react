import { useEffect, useState } from 'react'
import { APP_ERROR_EVENT, type AppErrorEventDetail } from '../shared/errors/handleAppError'

interface ToastItem {
  id: string
  message: string
}

const TOAST_TTL_MS = 5_000

const AppErrorToaster = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handleErrorEvent = (event: Event) => {
      const customEvent = event as CustomEvent<AppErrorEventDetail>
      const nextToast: ToastItem = {
        id: customEvent.detail.id,
        message: customEvent.detail.error.message,
      }

      setToasts((current) => [...current.slice(-2), nextToast])
    }

    window.addEventListener(APP_ERROR_EVENT, handleErrorEvent)

    return () => {
      window.removeEventListener(APP_ERROR_EVENT, handleErrorEvent)
    }
  }, [])

  useEffect(() => {
    if (toasts.length === 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1))
    }, TOAST_TTL_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [toasts])

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-2xl border border-rose-400/35 bg-slate-950/95 px-4 py-3 text-sm text-rose-100 shadow-[0_20px_40px_rgba(2,6,23,0.45)]"
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}

export default AppErrorToaster

