import { useState } from 'react'
import { CreditCard, ShieldCheck } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import EmptyState from '../components/dashboard/EmptyState'
import StatusBadge from '../components/dashboard/StatusBadge'
import TableShell from '../components/dashboard/TableShell'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useLanguage } from '../hooks/useLanguage'
import { useLibrary } from '../hooks/useLibrary'
import { useCreatePaymentMutation } from '../hooks/usePayments'
import { enrollmentService } from '../services/enrollmentService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { createIdempotencyKey, formatCoursePrice, formatCurrency } from '../utils/helpers'

const isPaymentRequiredForEnrollmentError = (error: unknown) => {
  const appError = normalizeApiError(error)

  if (appError.httpStatus === 402) {
    return true
  }

  if (appError.code?.trim().toUpperCase() === 'PAYMENT_REQUIRED_FOR_ENROLLMENT') {
    return true
  }

  const rawPayload = appError.raw && typeof appError.raw === 'object'
    ? appError.raw as Record<string, unknown>
    : undefined

  const codeFromPayload = typeof rawPayload?.code === 'string'
    ? rawPayload.code.trim().toUpperCase()
    : typeof rawPayload?.error === 'string'
      ? rawPayload.error.trim().toUpperCase()
      : undefined

  return codeFromPayload === 'PAYMENT_REQUIRED_FOR_ENROLLMENT'
}

const PaymentPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const { clearCart, itemCount, items, removeCourse, subtotal, tax, total } = useCart()
  const { purchaseCourses } = useLibrary()
  const createPaymentMutation = useCreatePaymentMutation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [progressMessage, setProgressMessage] = useState<string | null>(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [recentlyPurchasedCourseTitles, setRecentlyPurchasedCourseTitles] = useState<string[]>([])

  const hasItems = itemCount > 0
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const freeLabel = language === 'tr' ? 'Ücretsiz' : 'Free'
  const summaryCurrency = items[0]?.course.currency ?? 'TRY'
  const paymentRequiredMessage = language === 'tr'
    ? 'Bu kursa kayıt olmak için önce ödeme işlemini tamamlamalısınız.'
    : 'You need to complete payment before enrolling in this course.'
  const paymentFailedMessage = language === 'tr'
    ? 'Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin.'
    : 'Payment could not be completed. Please try again.'
  const enrollmentFailedMessage = language === 'tr'
    ? 'Kurs kaydı oluşturulamadı. Lütfen tekrar deneyin.'
    : 'Enrollment could not be created. Please try again.'
  const enrollmentAfterPaymentFailedMessage = language === 'tr'
    ? 'Ödeme alındı ancak kayıt işlemi tamamlanamadı. Lütfen tekrar deneyin veya destek ile iletişime geçin.'
    : 'Payment was captured but enrollment could not be completed. Please try again or contact support.'
  const paymentPreparingMessage = language === 'tr' ? 'Ödeme hazırlanıyor...' : 'Preparing payment...'
  const enrollmentCreatingMessage = language === 'tr' ? 'Kayıt oluşturuluyor...' : 'Creating enrollment...'
  const successMessage = language === 'tr'
    ? 'Ödeme başarılı. Kurs kaydınız oluşturuldu.'
    : 'Payment succeeded. Your enrollment has been created.'
  const actionLabel = language === 'tr' ? 'İşlem' : 'Action'

  const handleCheckout = async () => {
    if (!isAuthenticated || !hasItems || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setCheckoutMessage(null)
    setProgressMessage(null)

    const successfulCourseIds: string[] = []
    const successfulCourseTitles: string[] = []

    try {
      for (const item of items) {
        const isPaidCourse = item.course.price > 0

        if (isPaidCourse) {
          setProgressMessage(paymentPreparingMessage)

          try {
            await createPaymentMutation.mutateAsync({
              courseId: item.course.id,
              provider: 'MOCK_GATEWAY',
              paymentMethod: 'CARD',
              idempotencyKey: createIdempotencyKey(),
            })
          } catch {
            throw new Error(paymentFailedMessage)
          }
        }

        setProgressMessage(enrollmentCreatingMessage)

        try {
          await enrollmentService.createEnrollment(
            { courseId: item.course.id },
            { skipGlobalErrorHandling: true },
          )
        } catch (enrollmentError) {
          if (isPaymentRequiredForEnrollmentError(enrollmentError)) {
            throw new Error(paymentRequiredMessage)
          }

          if (isPaidCourse) {
            throw new Error(enrollmentAfterPaymentFailedMessage)
          }

          throw new Error(enrollmentFailedMessage)
        }

        successfulCourseIds.push(item.course.id)
        successfulCourseTitles.push(item.course.title)
      }

      if (successfulCourseIds.length > 0) {
        purchaseCourses(successfulCourseIds)
        clearCart()
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['my-courses'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] }),
        ])
      }

      setRecentlyPurchasedCourseTitles(successfulCourseTitles)
      setCheckoutMessage(successMessage)
      setIsSuccessModalOpen(true)
    } catch (error) {
      if (successfulCourseIds.length > 0) {
        purchaseCourses(successfulCourseIds)
        for (const courseId of successfulCourseIds) {
          removeCourse(courseId)
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['my-courses'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] }),
        ])
      }

      const message = error instanceof Error && error.message.trim()
        ? error.message.trim()
        : paymentFailedMessage

      setCheckoutMessage(message)
    } finally {
      setProgressMessage(null)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        actions={
          <Link to={hasItems ? ROUTES.cart : ROUTES.courses}>
            <Button asChild variant="secondary">
              {hasItems ? t('payment.backToCart') : t('payment.browseCourses')}
            </Button>
          </Link>
        }
        description={t('payment.description')}
        eyebrow={t('payment.eyebrow')}
        title={t('payment.title')}
      />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-5">
          {hasItems ? (
            <div className="space-y-5">
              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-2">
                    <CreditCard className="h-4 w-4 text-[color:var(--primary)]" />
                  </span>
                  <div>
                    <p className="theme-heading text-sm font-semibold">{language === 'tr' ? 'Ödeme Özeti' : 'Payment summary'}</p>
                    <p className="theme-muted mt-1 text-sm leading-6">
                      {language === 'tr'
                        ? 'Ödeme sağlayıcı: MOCK_GATEWAY, ödeme yöntemi: CARD.'
                        : 'Provider: MOCK_GATEWAY, payment method: CARD.'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm theme-muted">
                  <ShieldCheck className="mr-2 inline h-4 w-4 text-[color:var(--primary)]" />
                  {language === 'tr'
                    ? 'Bu ekran demo ödeme akışıdır, kart bilgisi istenmez.'
                    : 'This is a demo payment flow and does not require card details.'}
                </div>
              </div>

              <TableShell>
                <table className="min-w-[760px] w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-soft)] text-left">
                      <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">
                        {language === 'tr' ? 'Kurs' : 'Course'}
                      </th>
                      <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{t('common.price')}</th>
                      <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{actionLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr className="border-b border-[color:var(--border)] last:border-b-0" key={item.courseId}>
                        <td className="px-4 py-3.5">
                          <div className="min-w-0">
                            <p className="theme-heading font-medium">{item.course.title}</p>
                            <p className="theme-muted mt-1 text-xs">{getCourseCategoryLabel(item.course)} · {item.course.level.levelName}</p>
                          </div>
                        </td>
                        <td className="theme-heading px-4 py-3.5 font-semibold">
                          {formatCoursePrice(item.course.price, item.course.currency, { locale, freeLabel })}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge tone={item.course.price > 0 ? 'warning' : 'success'}>
                            {item.course.price > 0
                              ? (language === 'tr' ? 'Ücretli kurs' : 'Paid course')
                              : (language === 'tr' ? 'Ücretsiz kurs' : 'Free course')}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>

              {checkoutMessage ? (
                <p
                  className={`rounded-sm border px-4 py-3 text-sm ${
                    checkoutMessage === successMessage
                      ? 'border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] theme-heading'
                      : 'border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] text-[color:var(--danger)]'
                  }`}
                >
                  {checkoutMessage}
                </p>
              ) : null}

              <Button className="w-full justify-center" disabled={isSubmitting} onClick={() => void handleCheckout()} size="lg">
                {progressMessage ?? (language === 'tr' ? 'Ödemeyi Tamamla ve Kursa Katıl' : 'Complete Payment and Join Course')}
              </Button>
            </div>
          ) : (
            <EmptyState
              action={(
                <Link className="inline-flex" to={ROUTES.courses}>
                  <Button asChild>{t('payment.browseCourses')}</Button>
                </Link>
              )}
              description={t('payment.emptyDescription')}
              title={t('payment.emptyTitle')}
            />
          )}
        </section>

        <aside className="h-fit rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-5 xl:sticky xl:top-24">
          <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{t('payment.orderSummary')}</p>
          <div className="theme-muted mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span>{t('cart.itemsLabel')}</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('payment.subtotal')}</span>
              <span>{formatCurrency(subtotal, { currency: summaryCurrency, locale })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('payment.estimatedTax')}</span>
              <span>{formatCurrency(tax, { currency: summaryCurrency, locale })}</span>
            </div>
            <div className="theme-heading flex items-center justify-between border-t border-[color:var(--border)] pt-4 text-base font-semibold">
              <span>{t('payment.total')}</span>
              <span>{formatCurrency(total, { currency: summaryCurrency, locale })}</span>
            </div>
          </div>

          <div className="theme-muted mt-5 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4 text-sm leading-7">
            {t('payment.orderNote')}
          </div>
        </aside>
      </section>

      <Modal
        description={language === 'tr' ? 'Seçilen kurslarınız aktif hale getirildi.' : 'Your selected courses are now active.'}
        onClose={() => setIsSuccessModalOpen(false)}
        open={isSuccessModalOpen}
        title={language === 'tr' ? 'Ödeme Başarılı' : 'Payment successful'}
      >
        <div className="space-y-4">
          <p className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm theme-heading">
            {successMessage}
          </p>
          {recentlyPurchasedCourseTitles.length > 0 ? (
            <div className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
              <p className="theme-subtle text-xs uppercase tracking-[0.22em]">
                {language === 'tr' ? 'Aktif edilen kurslar' : 'Activated courses'}
              </p>
              <p className="theme-text mt-2 text-sm leading-6">{recentlyPurchasedCourseTitles.join(', ')}</p>
            </div>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}

export default PaymentPage
