import { useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import EmptyState from '../components/dashboard/EmptyState'
import TableShell from '../components/dashboard/TableShell'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import Modal from '../components/ui/Modal'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useLanguage } from '../hooks/useLanguage'
import { useMyPaymentsQuery, usePaymentInvoiceQuery } from '../hooks/usePayments'
import { formatCoursePrice } from '../utils/helpers'

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

const MyPaymentsPage = () => {
  const { language } = useLanguage()
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const freeLabel = language === 'tr' ? 'Ücretsiz' : 'Free'
  const actionLabel = language === 'tr' ? 'İşlem' : 'Action'
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [invoiceError, setInvoiceError] = useState<string | null>(null)

  const paymentsQuery = useMyPaymentsQuery()
  const invoiceQuery = usePaymentInvoiceQuery(selectedPaymentId)

  const modalTitle = language === 'tr' ? 'Fatura Detayi' : 'Invoice details'
  const showInvoiceModal = Boolean(selectedPaymentId)

  const emptyStateCopy = useMemo(() => (
    language === 'tr'
      ? {
        title: 'Ödeme geçmişi bulunamadı',
        description: 'Hesabınızda listelenecek bir ödeme kaydı yok.',
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
    return <Loader label={language === 'tr' ? 'Ödemeler yükleniyor...' : 'Loading payments...'} />
  }

  const payments = paymentsQuery.data ?? []

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        description={language === 'tr'
          ? 'Hesabınıza ait ödeme geçmişini ve fatura detaylarını inceleyin.'
          : 'Review your payment history and invoice details.'}
        eyebrow={language === 'tr' ? 'Hesap' : 'Account'}
        title={language === 'tr' ? 'Ödemelerim' : 'My Payments'}
      />

      {payments.length === 0 ? (
        <EmptyState
          description={emptyStateCopy.description}
          title={emptyStateCopy.title}
        />
      ) : (
        <TableShell>
          <table className="min-w-[860px] w-full border-collapse text-sm">
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
                    <p className="theme-heading font-medium">{payment.courseName ?? payment.courseId}</p>
                    {!payment.courseName ? <p className="theme-muted mt-1 text-xs">{payment.courseId}</p> : null}
                  </td>
                  <td className="theme-heading px-4 py-3.5 font-semibold">
                    {formatCoursePrice(payment.amount, payment.currency, { locale, freeLabel })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2.5 py-1 text-xs font-medium theme-muted">
                      {payment.status ?? '-'}
                    </span>
                  </td>
                  <td className="theme-muted px-4 py-3.5">{formatDate(payment.createdAt, locale)}</td>
                  <td className="px-4 py-3.5">
                    <Button
                      className="justify-center"
                      onClick={() => {
                        setInvoiceError(null)
                        setSelectedPaymentId(payment.id)
                      }}
                      size="sm"
                      variant="secondary"
                    >
                      <FileText className="h-4 w-4" />
                      {language === 'tr' ? 'Fatura Görüntüle' : 'View Invoice'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      )}

      <Modal
        description={language === 'tr'
          ? 'Bu ödemeye ait fatura bilgileri.'
          : 'Invoice information for this payment.'}
        onClose={() => setSelectedPaymentId(null)}
        open={showInvoiceModal}
        title={modalTitle}
      >
        {invoiceQuery.isLoading ? (
          <Loader label={language === 'tr' ? 'Fatura yükleniyor...' : 'Loading invoice...'} />
        ) : invoiceQuery.error ? (
          <div className="space-y-3">
            <p className="rounded-sm border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-3 py-2 text-sm text-[color:var(--danger)]">
              {language === 'tr'
                ? 'Fatura bilgileri alınamadı. Lütfen tekrar deneyin.'
                : 'Invoice details could not be fetched. Please try again.'}
            </p>
            {invoiceError ? (
              <p className="theme-muted text-xs">{invoiceError}</p>
            ) : null}
          </div>
        ) : invoiceQuery.data ? (
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">Invoice ID</dt>
              <dd className="theme-heading mt-1 font-medium">{invoiceQuery.data.id || '-'}</dd>
            </div>
            <div>
              <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">Payment ID</dt>
              <dd className="theme-heading mt-1 font-medium">{invoiceQuery.data.paymentId || '-'}</dd>
            </div>
            <div>
              <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">Invoice Number</dt>
              <dd className="theme-heading mt-1 font-medium">{invoiceQuery.data.invoiceNumber ?? '-'}</dd>
            </div>
            <div>
              <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Tutar' : 'Amount'}</dt>
              <dd className="theme-heading mt-1 font-medium">
                {formatCoursePrice(invoiceQuery.data.amount, invoiceQuery.data.currency, { locale, freeLabel })}
              </dd>
            </div>
            <div>
              <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Duzenlenme Tarihi' : 'Issued at'}</dt>
              <dd className="theme-heading mt-1 font-medium">{formatDate(invoiceQuery.data.issuedAt, locale)}</dd>
            </div>
            <div>
              <dt className="theme-subtle text-xs uppercase tracking-[0.08em]">{language === 'tr' ? 'Durum' : 'Status'}</dt>
              <dd className="theme-heading mt-1 font-medium">{invoiceQuery.data.status ?? '-'}</dd>
            </div>
          </dl>
        ) : (
          <p className="theme-muted text-sm">{language === 'tr' ? 'Fatura bulunamadı.' : 'Invoice not found.'}</p>
        )}
      </Modal>
    </div>
  )
}

export default MyPaymentsPage
