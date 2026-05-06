import api, { authClient, createNoAuthHeaders } from './api'
import { API_ENDPOINTS } from './endpoints'
import { authFlowLog } from '../shared/authFlowDebug'
import type {
  ApiEnvelope,
  AuthPayload,
  ChangePasswordPayload,
  LoginSuccessData,
  RegisteredUserData,
} from '../utils/types'

const requireEnvelopeData = <T>(envelope: ApiEnvelope<T>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined') {
    return envelope.data
  }

  throw new Error(envelope.message || fallbackMessage)
}

export const authApi = {
  async login(payload: AuthPayload) {
    const response = await authClient.post<ApiEnvelope<LoginSuccessData>>(API_ENDPOINTS.auth.login, {
      email: payload.email,
      password: payload.password,
    })
    authFlowLog('login response:', response.data)
    const envelope = response.data

    return {
      message: envelope.message,
      data: requireEnvelopeData(envelope, 'Login response is missing authentication data.'),
    }
  },

  async register(payload: AuthPayload) {
    const response = await authClient.post<ApiEnvelope<RegisteredUserData>>(API_ENDPOINTS.auth.register, {
      email: payload.email,
      password: payload.password,
    })
    authFlowLog('register response:', response.data)
    const envelope = response.data

    return {
      message: envelope.message,
      data: requireEnvelopeData(envelope, 'Register response is missing user data.'),
    }
  },

  async refreshToken(refreshToken: string) {
    const response = await authClient.post<ApiEnvelope<LoginSuccessData>>(
      API_ENDPOINTS.auth.refreshToken,
      { refresh_token: refreshToken },
      { headers: createNoAuthHeaders() },
    )

    return requireEnvelopeData(response.data, 'Refresh token response is missing authentication data.')
  },

  async logout(accessToken: string) {
    const headers = createNoAuthHeaders()
    headers.set('Authorization', `Bearer ${accessToken}`)

    const response = await authClient.post<ApiEnvelope<string>>(
      API_ENDPOINTS.auth.logout,
      undefined,
      { headers },
    )

    return response.data.data
  },

  async changePassword(payload: ChangePasswordPayload) {
    const response = await api.put<ApiEnvelope<unknown>>(API_ENDPOINTS.auth.changePassword, payload)
    return response.data.message
  },

  async deactivateMe() {
    await api.delete(API_ENDPOINTS.auth.me, { skipAuthRefresh: true })
  },

  async reactivateAccount(token: string) {
    const response = await authClient.get<ApiEnvelope<unknown>>(API_ENDPOINTS.auth.reactivateAccount, {
      params: { token },
    })

    return response.data.data
  },
}
