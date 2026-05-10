export type AppToastTone = 'success' | 'error' | 'info'

export interface AppToastEventDetail {
  id: string
  createdAt: number
  message: string
  tone: AppToastTone
  details?: string[]
  durationMs: number
}

export interface EmitAppToastOptions {
  message: string
  tone?: AppToastTone
  details?: string[]
  durationMs?: number
}

export const APP_TOAST_EVENT = 'app:toast'
export const DEFAULT_APP_TOAST_DURATION_MS = 5_000

export const emitAppToast = ({
  message,
  tone = 'info',
  details,
  durationMs = DEFAULT_APP_TOAST_DURATION_MS,
}: EmitAppToastOptions) => {
  if (typeof window === 'undefined') {
    return
  }

  const normalizedMessage = message.trim()

  if (!normalizedMessage) {
    return
  }

  const detail: AppToastEventDetail = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: Date.now(),
    message: normalizedMessage,
    tone,
    details: details?.map((item) => item.trim()).filter(Boolean),
    durationMs: Math.max(1000, durationMs),
  }

  window.dispatchEvent(new CustomEvent<AppToastEventDetail>(APP_TOAST_EVENT, { detail }))
}
