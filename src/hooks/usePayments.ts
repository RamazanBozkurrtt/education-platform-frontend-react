import { useMutation, useQuery } from '@tanstack/react-query'
import { paymentService, type CreatePaymentRequest } from '../services/paymentService'

export const useCreatePaymentMutation = () =>
  useMutation({
    mutationFn: (payload: CreatePaymentRequest) =>
      paymentService.createPayment(payload, { skipGlobalErrorHandling: true }),
  })

export const useMyPaymentsQuery = () =>
  useQuery({
    queryKey: ['payments', 'me'],
    queryFn: () => paymentService.getMyPayments({ skipGlobalErrorHandling: true }),
  })

export const usePaymentInvoiceQuery = (paymentId: string | null) =>
  useQuery({
    queryKey: ['payments', 'invoice', paymentId],
    queryFn: () => paymentService.getPaymentInvoice(paymentId ?? '', { skipGlobalErrorHandling: true }),
    enabled: Boolean(paymentId),
  })
