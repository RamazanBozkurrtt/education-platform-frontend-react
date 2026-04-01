import axios, { type AxiosRequestConfig } from 'axios'
import { AUTH_TOKEN_KEY } from '../utils/constants'
import { sleep } from '../utils/helpers'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://api.lumaacademy.local',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export const mockRequest = async <T>(config: AxiosRequestConfig, data: T) => {
  api.getUri(config)
  await sleep(520)
  return structuredClone(data)
}

export default api
