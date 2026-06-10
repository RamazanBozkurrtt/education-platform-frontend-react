import { useMutation, useQuery } from '@tanstack/react-query'
import {
  paymentService,
  type ConfirmPaymentRequest,
  type CreatePaymentRequest,
} from '../services/paymentService'

export const useCreatePaymentMutation = () =>
  useMutation({
    mutationFn: (payload: CreatePaymentRequest) =>
      paymentService.createPayment(payload, { skipGlobalErrorHandling: true }),
  })

export const useConfirmPaymentMutation = () =>
  useMutation({
    mutationFn: ({ paymentId, payload }: { paymentId: string; payload: ConfirmPaymentRequest }) =>
      paymentService.confirmPayment(paymentId, payload, { skipGlobalErrorHandling: true }),
  })

export const useMyPaymentsQuery = (pageNumber = 0, pageSize = 10) =>
  useQuery({
    queryKey: ['payments', 'me', pageNumber, pageSize],
    queryFn: () => paymentService.getMyPayments(
      { pageNumber, pageSize },
      { skipGlobalErrorHandling: true },
    ),
  })

export const usePaymentDetailQuery = (paymentId: string | null) =>
  useQuery({
    queryKey: ['payments', 'detail', paymentId],
    queryFn: () => paymentService.getPaymentById(paymentId ?? '', { skipGlobalErrorHandling: true }),
    enabled: Boolean(paymentId),
  })

export const usePaymentInvoiceQuery = (paymentId: string | null) =>
  useQuery({
    queryKey: ['payments', 'invoice', paymentId],
    queryFn: () => paymentService.getPaymentInvoice(paymentId ?? '', { skipGlobalErrorHandling: true }),
    enabled: Boolean(paymentId),
  })
