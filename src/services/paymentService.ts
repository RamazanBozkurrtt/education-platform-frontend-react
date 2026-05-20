import type { AxiosRequestConfig } from 'axios'
import api from './api'
import { API_ENDPOINTS } from './endpoints'
import type { ApiEnvelope } from '../utils/types'

export type PaymentProvider = 'MOCK_GATEWAY'
export type PaymentMethod = 'CARD'

export interface CreatePaymentRequest {
  courseId: string
  provider: PaymentProvider
  paymentMethod: PaymentMethod
  idempotencyKey: string
}

export interface Payment {
  id: string
  courseId: string
  courseName?: string
  userId?: string
  amount?: number
  currency?: string
  status?: string
  provider?: string
  paymentMethod?: string
  createdAt?: string
  updatedAt?: string
}

export interface Invoice {
  id: string
  paymentId: string
  invoiceNumber?: string
  amount?: number
  currency?: string
  issuedAt?: string
  status?: string
}

const requireEnvelopeData = <T>(envelope: ApiEnvelope<T>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined' && envelope.data !== null) {
    return envelope.data
  }

  throw new Error(envelope.message || fallbackMessage)
}

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const trimToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const toIdentifier = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }

  return trimToUndefined(value)
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)

    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return undefined
}

const mapPayment = (value: unknown): Payment => {
  const payload = toRecord(value)
  const courseRecord = toRecord(payload.course)
  const courseId = toIdentifier(payload.courseId ?? courseRecord.id) ?? ''

  return {
    id: toIdentifier(payload.id) ?? '',
    courseId,
    courseName: trimToUndefined(payload.courseName)
      ?? trimToUndefined(payload.courseTitle)
      ?? trimToUndefined(courseRecord.title),
    userId: toIdentifier(payload.userId),
    amount: toNumber(payload.amount),
    currency: trimToUndefined(payload.currency)?.toUpperCase(),
    status: trimToUndefined(payload.status),
    provider: trimToUndefined(payload.provider),
    paymentMethod: trimToUndefined(payload.paymentMethod),
    createdAt: trimToUndefined(payload.createdAt),
    updatedAt: trimToUndefined(payload.updatedAt),
  }
}

const mapInvoice = (value: unknown): Invoice => {
  const payload = toRecord(value)

  return {
    id: toIdentifier(payload.id) ?? '',
    paymentId: toIdentifier(payload.paymentId) ?? '',
    invoiceNumber: trimToUndefined(payload.invoiceNumber),
    amount: toNumber(payload.amount),
    currency: trimToUndefined(payload.currency)?.toUpperCase(),
    issuedAt: trimToUndefined(payload.issuedAt),
    status: trimToUndefined(payload.status),
  }
}

const extractPaymentList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
  }

  const payload = toRecord(value)

  if (Array.isArray(payload.content)) {
    return payload.content
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.results)) {
    return payload.results
  }

  return []
}

interface PaymentRequestOptions {
  skipGlobalErrorHandling?: boolean
}

const toRequestConfig = (options?: PaymentRequestOptions): AxiosRequestConfig => ({
  skipGlobalErrorHandling: options?.skipGlobalErrorHandling,
})

export const paymentService = {
  async createPayment(payload: CreatePaymentRequest, options?: PaymentRequestOptions) {
    const response = await api.post<ApiEnvelope<unknown>>(
      API_ENDPOINTS.payments.create,
      payload,
      toRequestConfig(options),
    )
    return mapPayment(requireEnvelopeData(response.data, 'Payment response is missing data.'))
  },

  async getMyPayments(options?: PaymentRequestOptions) {
    const response = await api.get<ApiEnvelope<unknown>>(
      API_ENDPOINTS.payments.me,
      toRequestConfig(options),
    )
    const data = requireEnvelopeData(response.data, 'Payment list response is missing data.')
    return extractPaymentList(data).map((item) => mapPayment(item))
  },

  async getPaymentInvoice(paymentId: string, options?: PaymentRequestOptions) {
    const response = await api.get<ApiEnvelope<unknown>>(
      API_ENDPOINTS.payments.invoice(paymentId),
      toRequestConfig(options),
    )
    return mapInvoice(requireEnvelopeData(response.data, 'Payment invoice response is missing data.'))
  },
}
