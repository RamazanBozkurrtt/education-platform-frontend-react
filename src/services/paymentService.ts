import type { AxiosRequestConfig } from 'axios'
import api from './api'
import { API_ENDPOINTS } from './endpoints'
import type { ApiEnvelope } from '../utils/types'

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED'
export type PaymentProvider = 'MOCK_GATEWAY' | 'STRIPE' | 'IYZICO'
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'WALLET'

export interface CreatePaymentRequest {
  courseId: string
  provider: PaymentProvider
  paymentMethod: PaymentMethod
  idempotencyKey?: string
  autoConfirm: false
  buyerFullName?: string
  buyerEmail?: string
  buyerTaxNumber?: string
  buyerAddress?: string
}

export interface ConfirmPaymentRequest {
  approved?: boolean
  failureReason?: string
  gatewayTransactionId?: string
  gatewayTimestampEpochSeconds?: number
  gatewaySignature?: string
  buyerFullName?: string
  buyerEmail?: string
  buyerTaxNumber?: string
  buyerAddress?: string
}

export interface Payment {
  id: string
  userId?: string
  courseId: string
  courseTitleSnapshot?: string
  amount?: number
  amountRaw?: string
  currency?: string
  status?: PaymentStatus
  provider?: PaymentProvider
  paymentMethod?: PaymentMethod
  providerPaymentId?: string
  idempotencyKey?: string
  failureReason?: string
  invoiceNumber?: string
  paidAt?: string
  refundedAt?: string
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

export interface PaymentPage {
  content: Payment[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
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

const toDecimalString = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  return undefined
}

const mapPayment = (value: unknown): Payment => {
  const payload = toRecord(value)
  const courseRecord = toRecord(payload.course)
  const courseId = toIdentifier(payload.courseId ?? courseRecord.id) ?? ''
  const normalizedStatus = trimToUndefined(payload.status)
  const normalizedProvider = trimToUndefined(payload.provider)
  const normalizedPaymentMethod = trimToUndefined(payload.paymentMethod)

  return {
    id: toIdentifier(payload.id ?? payload.paymentId) ?? '',
    courseId,
    userId: toIdentifier(payload.userId),
    courseTitleSnapshot: trimToUndefined(payload.courseTitleSnapshot)
      ?? trimToUndefined(payload.courseTitle)
      ?? trimToUndefined(payload.courseName)
      ?? trimToUndefined(courseRecord.title),
    amount: toNumber(payload.amount),
    amountRaw: toDecimalString(payload.amount),
    currency: trimToUndefined(payload.currency)?.toUpperCase(),
    status: (normalizedStatus as PaymentStatus | undefined),
    provider: (normalizedProvider as PaymentProvider | undefined),
    paymentMethod: (normalizedPaymentMethod as PaymentMethod | undefined),
    providerPaymentId: trimToUndefined(payload.providerPaymentId),
    idempotencyKey: trimToUndefined(payload.idempotencyKey),
    failureReason: trimToUndefined(payload.failureReason),
    invoiceNumber: trimToUndefined(payload.invoiceNumber),
    paidAt: trimToUndefined(payload.paidAt),
    refundedAt: trimToUndefined(payload.refundedAt),
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

const toBooleanOrDefault = (value: unknown, fallback: boolean) => {
  if (typeof value === 'boolean') {
    return value
  }

  return fallback
}

const mapPaymentsPage = (value: unknown): PaymentPage => {
  if (Array.isArray(value)) {
    const content = value.map((item) => mapPayment(item))
    return {
      content,
      pageNumber: 0,
      pageSize: content.length,
      totalElements: content.length,
      totalPages: content.length > 0 ? 1 : 0,
      last: true,
    }
  }

  const payload = toRecord(value)
  const content = extractPaymentList(value).map((item) => mapPayment(item))
  const pageNumber = toNumber(payload.pageNumber)
  const pageSize = toNumber(payload.pageSize)
  const totalElements = toNumber(payload.totalElements)
  const totalPages = toNumber(payload.totalPages)

  return {
    content,
    pageNumber: Math.max(0, Math.trunc(pageNumber ?? 0)),
    pageSize: Math.max(0, Math.trunc(pageSize ?? content.length)),
    totalElements: Math.max(0, Math.trunc(totalElements ?? content.length)),
    totalPages: Math.max(0, Math.trunc(totalPages ?? (content.length > 0 ? 1 : 0))),
    last: toBooleanOrDefault(payload.last, true),
  }
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

  async confirmPayment(paymentId: string, payload: ConfirmPaymentRequest, options?: PaymentRequestOptions) {
    const response = await api.post<ApiEnvelope<unknown>>(
      API_ENDPOINTS.payments.confirm(paymentId),
      payload,
      toRequestConfig(options),
    )
    return mapPayment(requireEnvelopeData(response.data, 'Payment confirm response is missing data.'))
  },

  async getPaymentById(paymentId: string, options?: PaymentRequestOptions) {
    const response = await api.get<ApiEnvelope<unknown>>(
      API_ENDPOINTS.payments.byId(paymentId),
      toRequestConfig(options),
    )
    return mapPayment(requireEnvelopeData(response.data, 'Payment detail response is missing data.'))
  },

  async getMyPayments(
    { pageNumber = 0, pageSize = 10 }: { pageNumber?: number; pageSize?: number } = {},
    options?: PaymentRequestOptions,
  ) {
    const response = await api.get<ApiEnvelope<unknown>>(
      API_ENDPOINTS.payments.me,
      {
        ...toRequestConfig(options),
        params: { pageNumber, pageSize },
      },
    )
    const data = requireEnvelopeData(response.data, 'Payment list response is missing data.')
    return mapPaymentsPage(data)
  },

  async getPaymentInvoice(paymentId: string, options?: PaymentRequestOptions) {
    const response = await api.get<ApiEnvelope<unknown>>(
      API_ENDPOINTS.payments.invoice(paymentId),
      toRequestConfig(options),
    )
    return mapInvoice(requireEnvelopeData(response.data, 'Payment invoice response is missing data.'))
  },
}
