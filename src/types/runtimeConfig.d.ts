export {}

declare global {
  interface Window {
    __EDUBASE_CONFIG__?: {
      API_BASE_URL?: string
    }
  }
}
