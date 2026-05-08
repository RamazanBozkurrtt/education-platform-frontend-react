import { useState } from 'react'
import { CreditCard, Landmark, ShieldCheck, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
import { useAuth } from '../hooks/useAuth'
import { enrollmentService } from '../services/enrollmentService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import { ROUTES } from '../utils/constants'
import { formatCurrency } from '../utils/helpers'
import type { CartItem } from '../utils/types'

type PaymentMethod = 'card' | 'invoice'

type CardForm = {
  cardHolder: string
  cardNumber: string
  expiryDate: string
  cvc: string
}

type InvoiceForm = {
  companyName: string
  taxId: string
  billingEmail: string
  billingAddress: string
}

const initialCardForm: CardForm = {
  cardHolder: '',
  cardNumber: '',
  expiryDate: '',
  cvc: '',
}

const initialInvoiceForm: InvoiceForm = {
  companyName: '',
  taxId: '',
  billingEmail: '',
  billingAddress: '',
}

const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim()

const formatExpiryDate = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4)

  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)} / ${digits.slice(2)}`
}

const formatCvc = (value: string) => value.replace(/\D/g, '').slice(0, 4)

const formatTaxId = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 14)

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const isValidExpiryDate = (value: string) => {
  const digits = value.replace(/\D/g, '')

  if (digits.length !== 4) {
    return false
  }

  const month = Number(digits.slice(0, 2))
  const year = Number(`20${digits.slice(2)}`)

  if (month < 1 || month > 12) {
    return false
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  return year > currentYear || (year === currentYear && month >= currentMonth)
}

const PaymentPage = () => {
  const { t } = useTranslation()
  const { clearCart, courseIds, itemCount, items, subtotal, tax, total } = useCart()
  const { purchaseCourses } = useLibrary()
  const { isAuthenticated } = useAuth()
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [cardForm, setCardForm] = useState<CardForm>(initialCardForm)
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(initialInvoiceForm)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [recentlyPurchasedItems, setRecentlyPurchasedItems] = useState<CartItem[]>([])

  const hasItems = itemCount > 0

  const cardErrors: Partial<Record<keyof CardForm, string>> = {
    ...(cardForm.cardHolder.trim().length >= 3 ? {} : { cardHolder: t('payment.validation.cardHolder') }),
    ...(cardForm.cardNumber.replace(/\D/g, '').length === 16 ? {} : { cardNumber: t('payment.validation.cardNumber') }),
    ...(isValidExpiryDate(cardForm.expiryDate) ? {} : { expiryDate: t('payment.validation.expiryDate') }),
    ...(/^\d{3,4}$/.test(cardForm.cvc) ? {} : { cvc: t('payment.validation.cvc') }),
  }

  const invoiceErrors: Partial<Record<keyof InvoiceForm, string>> = {
    ...(invoiceForm.companyName.trim().length >= 2 ? {} : { companyName: t('payment.validation.companyName') }),
    ...(/^[A-Z0-9]{8,14}$/.test(invoiceForm.taxId) ? {} : { taxId: t('payment.validation.taxId') }),
    ...(isValidEmail(invoiceForm.billingEmail) ? {} : { billingEmail: t('payment.validation.billingEmail') }),
    ...(invoiceForm.billingAddress.trim().length >= 10
      ? {}
      : { billingAddress: t('payment.validation.billingAddress') }),
  }

  const activeErrors = method === 'card' ? cardErrors : invoiceErrors
  const hasErrors = Object.keys(activeErrors).length > 0

  const showError = (field: string) =>
    submitted || touched[field] ? activeErrors[field as keyof typeof activeErrors] : undefined

  const handleBlur = (field: string) => {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  const handleMethodChange = (nextMethod: PaymentMethod) => {
    setMethod(nextMethod)
    setSubmitted(false)
  }

  const handleConfirm = async () => {
    setSubmitted(true)
    setPaymentError(null)

    if (hasErrors) {
      return
    }

    try {
      setIsSubmitting(true)

      if (isAuthenticated) {
        // Backend en guvenilir user bilgisini token claim'inden aliyor.
        await enrollmentService.createEnrollments(courseIds)
      }

      setRecentlyPurchasedItems(items)
      purchaseCourses(courseIds)
      clearCart()
      setIsModalOpen(true)
    } catch (error) {
      const appError = normalizeApiError(error)
      setPaymentError(appError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          {hasItems ? (
            <>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'card', label: t('payment.creditCard'), icon: CreditCard },
                  { id: 'invoice', label: t('payment.invoice'), icon: Landmark },
                ].map((option) => (
                  <button
                    key={option.id}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                      method === option.id
                        ? 'border-cyan-300/28 bg-cyan-400/12 text-cyan-100'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                    }`}
                    onClick={() => handleMethodChange(option.id as PaymentMethod)}
                    type="button"
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>

              {method === 'card' ? (
                <>
                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <Input
                      autoComplete="cc-name"
                      error={showError('cardHolder')}
                      id="card-holder"
                      label={t('payment.cardHolder')}
                      onBlur={() => handleBlur('cardHolder')}
                      onChange={(event) =>
                        setCardForm((current) => ({ ...current, cardHolder: event.target.value }))
                      }
                      placeholder="Avery Coleman"
                      value={cardForm.cardHolder}
                    />
                    <Input
                      autoComplete="cc-number"
                      error={showError('cardNumber')}
                      id="card-number"
                      inputMode="numeric"
                      label={t('payment.cardNumber')}
                      onBlur={() => handleBlur('cardNumber')}
                      onChange={(event) =>
                        setCardForm((current) => ({
                          ...current,
                          cardNumber: formatCardNumber(event.target.value),
                        }))
                      }
                      placeholder="4242 4242 4242 4242"
                      value={cardForm.cardNumber}
                    />
                    <Input
                      autoComplete="cc-exp"
                      error={showError('expiryDate')}
                      id="card-expiry"
                      inputMode="numeric"
                      label={t('payment.expiryDate')}
                      onBlur={() => handleBlur('expiryDate')}
                      onChange={(event) =>
                        setCardForm((current) => ({
                          ...current,
                          expiryDate: formatExpiryDate(event.target.value),
                        }))
                      }
                      placeholder="12 / 28"
                      value={cardForm.expiryDate}
                    />
                    <Input
                      autoComplete="cc-csc"
                      error={showError('cvc')}
                      id="card-cvc"
                      inputMode="numeric"
                      label={t('payment.cvc')}
                      onBlur={() => handleBlur('cvc')}
                      onChange={(event) =>
                        setCardForm((current) => ({
                          ...current,
                          cvc: formatCvc(event.target.value),
                        }))
                      }
                      placeholder="123"
                      value={cardForm.cvc}
                    />
                  </div>

                  <div className="mt-8 rounded-[28px] border border-emerald-300/16 bg-emerald-400/8 p-5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-emerald-200" />
                      <p className="text-sm font-semibold text-white">{t('payment.securityTitle')}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {t('payment.securityDescription')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-8 grid gap-5 md:grid-cols-2">
                    <Input
                      error={showError('companyName')}
                      id="company-name"
                      label={t('payment.companyName')}
                      onBlur={() => handleBlur('companyName')}
                      onChange={(event) =>
                        setInvoiceForm((current) => ({ ...current, companyName: event.target.value }))
                      }
                      placeholder="Northstar Labs"
                      value={invoiceForm.companyName}
                    />
                    <Input
                      error={showError('taxId')}
                      id="tax-id"
                      label={t('payment.taxId')}
                      onBlur={() => handleBlur('taxId')}
                      onChange={(event) =>
                        setInvoiceForm((current) => ({
                          ...current,
                          taxId: formatTaxId(event.target.value),
                        }))
                      }
                      placeholder="1234567890"
                      value={invoiceForm.taxId}
                    />
                    <Input
                      error={showError('billingEmail')}
                      id="billing-email"
                      label={t('payment.billingEmail')}
                      onBlur={() => handleBlur('billingEmail')}
                      onChange={(event) =>
                        setInvoiceForm((current) => ({ ...current, billingEmail: event.target.value }))
                      }
                      placeholder="finance@company.com"
                      type="email"
                      value={invoiceForm.billingEmail}
                    />
                    <div className="md:col-span-2">
                      <Input
                        error={showError('billingAddress')}
                        id="billing-address"
                        label={t('payment.billingAddress')}
                        onBlur={() => handleBlur('billingAddress')}
                        onChange={(event) =>
                          setInvoiceForm((current) => ({ ...current, billingAddress: event.target.value }))
                        }
                        placeholder={t('payment.billingAddressPlaceholder')}
                        value={invoiceForm.billingAddress}
                      />
                    </div>
                  </div>

                  <div className="mt-8 rounded-[28px] border border-amber-300/16 bg-amber-400/8 p-5">
                    <div className="flex items-center gap-3">
                      <Landmark className="h-5 w-5 text-amber-200" />
                      <p className="text-sm font-semibold text-white">{t('payment.invoiceNoticeTitle')}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {t('payment.invoiceNoticeDescription')}
                    </p>
                  </div>
                </>
              )}

              {paymentError ? (
                <p className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {paymentError}
                </p>
              ) : null}

              <Button className="mt-8 w-full" disabled={isSubmitting} onClick={handleConfirm} size="lg">
                {method === 'card' ? t('payment.confirmPayment') : t('payment.confirmInvoiceRequest')}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-300">
                <ShoppingCart className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold text-white">{t('payment.emptyTitle')}</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">{t('payment.emptyDescription')}</p>
              <Link className="mt-6 inline-flex" to={ROUTES.courses}>
                <Button asChild>{t('payment.browseCourses')}</Button>
              </Link>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="border-cyan-300/16 bg-cyan-400/8">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-100">{t('payment.orderSummary')}</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{t('cart.courseCount', { count: itemCount })}</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span>{t('cart.itemsLabel')}</span>
                <span>{itemCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('payment.subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('payment.estimatedTax')}</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-base font-semibold text-white">
                <span>{t('payment.total')}</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-6 rounded-[22px] border border-white/8 bg-white/4 p-4 text-sm leading-7 text-slate-300">
              {t('payment.orderNote')}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-white">{t('payment.selectedCourses')}</p>
              {hasItems ? (
                <Link className="text-sm font-medium text-cyan-200 transition hover:text-cyan-100" to={ROUTES.cart}>
                  {t('payment.backToCart')}
                </Link>
              ) : null}
            </div>

            {hasItems ? (
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item.courseId} className="rounded-2xl border border-white/8 bg-white/4 p-4">
                    <div className={`mb-4 h-1.5 w-20 rounded-full bg-gradient-to-r ${item.course.accent}`} />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                            {item.course.category}
                          </span>
                          <span className="text-xs text-slate-500">{item.course.level}</span>
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-white">{item.course.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{item.course.summary}</p>
                      </div>
                      <p className="shrink-0 text-lg font-semibold text-white">{formatCurrency(item.course.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/3 px-4 py-6 text-sm text-slate-400">
                {t('payment.emptyDescription')}
              </div>
            )}
          </Card>
        </div>
      </section>

      <Modal
        description={
          method === 'card' ? t('payment.successDescription') : t('payment.invoiceSuccessDescription')
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
        title={method === 'card' ? t('payment.successTitle') : t('payment.invoiceSuccessTitle')}
      >
        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/8 bg-white/4 p-5 text-sm leading-7 text-slate-300">
            {method === 'card' ? t('payment.successBody') : t('payment.invoiceSuccessBody')}
          </div>
          {recentlyPurchasedItems.length > 0 ? (
            <div className="rounded-[24px] border border-emerald-300/16 bg-emerald-400/8 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">
                {t('payment.unlockedCourses', { count: recentlyPurchasedItems.length })}
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                {recentlyPurchasedItems.map((item) => item.course.title).join(', ')}
              </p>
            </div>
          ) : null}
          {recentlyPurchasedItems[0] ? (
            <Link className="block" to={ROUTES.coursePlayer(recentlyPurchasedItems[0].course.slug)}>
              <Button asChild className="w-full justify-center">
                {t('payment.startWatching')}
              </Button>
            </Link>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}

export default PaymentPage
