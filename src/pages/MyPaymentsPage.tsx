import { useMemo, useState } from 'react'
import { FileText, ReceiptText } from 'lucide-react'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import EmptyState from '../components/dashboard/EmptyState'
import StatusBadge from '../components/dashboard/StatusBadge'
import TableShell from '../components/dashboard/TableShell'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import Modal from '../components/ui/Modal'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useLanguage } from '../hooks/useLanguage'
import { useMyPaymentsQuery, usePaymentDetailQuery, usePaymentInvoiceQuery } from '../hooks/usePayments'
import type { Payment } from '../services/paymentService'
import { formatCoursePrice } from '../utils/helpers'

const PAGE_SIZE = 10

const formatDate = (value: string | undefined, locale: string) => {
  if (!value) {
    return '-'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate)
}

const getStatusTone = (status: Payment['status']) => {
  if (status === 'SUCCEEDED') {
    return 'success' as const
  }

  if (status === 'FAILED' || status === 'REFUNDED') {
    return 'warning' as const
  }

  return undefined
}

const MyPaymentsPage = () => {
  const { language } = useLanguage()
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const freeLabel = language === 'tr' ? 'Ucretsiz' : 'Free'
  const actionLabel = language === 'tr' ? 'Islem' : 'Action'
  const [pageNumber, setPageNumber] = useState(0)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)

  const paymentsQuery = useMyPaymentsQuery(pageNumber, PAGE_SIZE)
  const paymentDetailQuery = usePaymentDetailQuery(selectedPaymentId)
  const selectedPayment = paymentDetailQuery.data

  const canLoadInvoice = selectedPayment?.status === 'SUCCEEDED'
  const invoiceQuery = usePaymentInvoiceQuery(canLoadInvoice ? selectedPaymentId : null)
  const modalTitle = language === 'tr' ? 'Odeme Detayi' : 'Payment details'

  const emptyStateCopy = useMemo(() => (
    language === 'tr'
      ? {
        title: 'Odeme gecmisi bulunamadi',
        description: 'Hesabinizda listelenecek bir odeme kaydi yok.',
      }
      : {
        title: 'No payment history yet',
        description: 'There are no payments to list for your account.',
      }
  ), [language])

  if (paymentsQuery.error) {
    return <QueryErrorState error={paymentsQuery.error} />
  }

  if (paymentsQuery.isLoading) {
    return <Loader label={language === 'tr' ? 'Odemeler yukleniyor...' : 'Loading payments...'} />
  }

  const paymentPage = paymentsQuery.data
  const payments = paymentPage?.content ?? []
  const hasPreviousPage = (paymentPage?.pageNumber ?? 0) > 0
  const hasNextPage = paymentPage ? !paymentPage.last : false
  const totalPages = paymentPage?.totalPages ?? 0
  const showPaymentModal = Boolean(selectedPaymentId)

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        description={language === 'tr'
          ? 'Hesabiniza ait odeme gecmisini ve fatura detaylarini inceleyin.'
          : 'Review your payment history and invoice details.'}
        eyebrow={language === 'tr' ? 'Hesap' : 'Account'}
        title={language === 'tr' ? 'Odemelerim' : 'My Payments'}
      />

      {payments.length === 0 ? (
        <EmptyState
          description={emptyStateCopy.description}
          title={emptyStateCopy.title}
        />
      ) : (
        <div className="space-y-4">
          <TableShell>
            <table className="min-w-[920px] w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-soft)] text-left">
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">
                    {language === 'tr' ? 'Kurs' : 'Course'}
                  </th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">
                    {language === 'tr' ? 'Tutar' : 'Amount'}
                  </th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">
                    {language === 'tr' ? 'Durum' : 'Status'}
                  </th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">
                    {language === 'tr' ? 'Tarih' : 'Date'}
                  </th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{actionLabel}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr className="border-b border-[color:var(--border)] last:border-b-0" key={payment.id}>
                    <td className="px-4 py-3.5">
                      <p className="theme-heading font-medium">{payment.courseTitleSnapshot ?? payment.courseId}</p>
                      {!payment.courseTitleSnapshot ? <p className="theme-muted mt-1 text-xs">{payment.courseId}</p> : null}
                    </td>
                    <td className="theme-heading px-4 py-3.5 font-semibold">
                      {formatCoursePrice(payment.amount, payment.currency, { locale, freeLabel })}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge tone={getStatusTone(payment.status)}>
                        {payment.status ?? '-'}
                      </StatusBadge>
                    </td>
                    <td className="theme-muted px-4 py-3.5">{formatDate(payment.createdAt, locale)}</td>
                    <td className="px-4 py-3.5">
                      <Button
                        className="justify-center"
                        onClick={() => {
                          setSelectedPaymentId(payment.id)
                        }}
                        size="sm"
                        variant="secondary"
                      >
                        <ReceiptText className="h-4 w-4" />
                        {language === 'tr' ? 'Detay' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>

          <div className="flex items-center justify-between gap-3 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3">
            <p className="theme-muted text-sm">
              {language === 'tr'
                ? `Sayfa ${pageNumber + 1}${totalPages > 0 ? ` / ${totalPages}` : ''}`
                : `Page ${pageNumber + 1}${totalPages > 0 ? ` / ${totalPages}` : ''}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                disabled={!hasPreviousPage || paymentsQuery.isFetching}
                onClick={() => setPageNumber((currentPage) => Math.max(0, currentPage - 1))}
                size="sm"
                variant="secondary"
              >
                {language === 'tr' ? 'Onceki' : 'Previous'}
              </Button>
              <Button
                disabled={!hasNextPage || paymentsQuery.isFetching}
                onClick={() => setPageNumber((currentPage) => currentPage + 1)}
                size="sm"
                variant="secondary"
              >
                {language === 'tr' ? 'Sonraki' : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        description={language === 'tr'
          ? 'Bu odemeye ait durum, saglayici ve fatura bilgileri.'
          : 'Status, provider and invoice information for this payment.'}
        onClose={() => setSelectedPaymentId(null)}
        open={showPaymentModal}
        title={modalTitle}
      >
        {paymentDetailQuery.isLoading ? (
          <Loader label={language === 'tr' ? 'Odeme detayi yukleniyor...' : 'Loading payment detail...'} />
        ) : paymentDetailQuery.error ? (
          <p className="rounded-sm border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-3 py-2 text-sm text-[color:var(--danger)]">
            {language === 'tr'
              ? 'Odeme detayi alinamadi. Lutfen tekrar deneyin.'
              : 'Payment detail could not be fetched. Please try again.'}
          </p>
        ) : selectedPayment ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">Payment ID</dt>
                <dd className="theme-heading mt-1 font-medium">{selectedPayment.id || '-'}</dd>
              </div>
              <div>
                <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Durum' : 'Status'}</dt>
                <dd className="theme-heading mt-1 font-medium">{selectedPayment.status ?? '-'}</dd>
              </div>
              <div>
                <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">Provider</dt>
                <dd className="theme-heading mt-1 font-medium">{selectedPayment.provider ?? '-'}</dd>
              </div>
              <div>
                <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Odeme Yontemi' : 'Payment Method'}</dt>
                <dd className="theme-heading mt-1 font-medium">{selectedPayment.paymentMethod ?? '-'}</dd>
              </div>
              <div>
                <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Tutar' : 'Amount'}</dt>
                <dd className="theme-heading mt-1 font-medium">
                  {formatCoursePrice(selectedPayment.amount, selectedPayment.currency, { locale, freeLabel })}
                </dd>
              </div>
              <div>
                <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Olusturma' : 'Created at'}</dt>
                <dd className="theme-heading mt-1 font-medium">{formatDate(selectedPayment.createdAt, locale)}</dd>
              </div>
            </dl>

            {selectedPayment.failureReason ? (
              <p className="rounded-sm border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-3 py-2 text-sm text-[color:var(--danger)]">
                {selectedPayment.failureReason}
              </p>
            ) : null}

            <div className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
              <p className="theme-heading text-sm font-semibold">{language === 'tr' ? 'Fatura Paneli' : 'Invoice panel'}</p>
              {!canLoadInvoice ? (
                <p className="theme-muted mt-2 text-sm">
                  {language === 'tr'
                    ? 'Fatura sadece basarili (SUCCEEDED) odemeler icin olusur.'
                    : 'Invoice is available only for successful (SUCCEEDED) payments.'}
                </p>
              ) : invoiceQuery.isLoading ? (
                <Loader label={language === 'tr' ? 'Fatura yukleniyor...' : 'Loading invoice...'} />
              ) : invoiceQuery.error ? (
                <p className="mt-2 rounded-sm border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-3 py-2 text-sm text-[color:var(--danger)]">
                  {language === 'tr'
                    ? 'Fatura bilgileri alinamadi. Lutfen tekrar deneyin.'
                    : 'Invoice details could not be fetched. Please try again.'}
                </p>
              ) : invoiceQuery.data ? (
                <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">Invoice Number</dt>
                    <dd className="theme-heading mt-1 font-medium">{invoiceQuery.data.invoiceNumber ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">Invoice ID</dt>
                    <dd className="theme-heading mt-1 font-medium">{invoiceQuery.data.id || '-'}</dd>
                  </div>
                  <div>
                    <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Durum' : 'Status'}</dt>
                    <dd className="theme-heading mt-1 font-medium">{invoiceQuery.data.status ?? '-'}</dd>
                  </div>
                  <div>
                    <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Tarih' : 'Issued at'}</dt>
                    <dd className="theme-heading mt-1 font-medium">{formatDate(invoiceQuery.data.issuedAt, locale)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Tutar' : 'Amount'}</dt>
                    <dd className="theme-heading mt-1 font-medium">
                      {formatCoursePrice(invoiceQuery.data.amount, invoiceQuery.data.currency, { locale, freeLabel })}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="theme-muted mt-2 text-sm">{language === 'tr' ? 'Fatura bulunamadi.' : 'Invoice not found.'}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setSelectedPaymentId(null)} size="sm" variant="secondary">
                <FileText className="h-4 w-4" />
                {language === 'tr' ? 'Kapat' : 'Close'}
              </Button>
            </div>
          </div>
        ) : (
          <p className="theme-muted text-sm">{language === 'tr' ? 'Odeme bulunamadi.' : 'Payment not found.'}</p>
        )}
      </Modal>
    </div>
  )
}

export default MyPaymentsPage
