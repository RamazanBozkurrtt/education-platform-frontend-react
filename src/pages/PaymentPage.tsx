import { useRef, useState } from 'react'
import { CreditCard, ShieldCheck } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import EmptyState from '../components/dashboard/EmptyState'
import StatusBadge from '../components/dashboard/StatusBadge'
import TableShell from '../components/dashboard/TableShell'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../hooks/useCart'
import { useLanguage } from '../hooks/useLanguage'
import { useLibrary } from '../hooks/useLibrary'
import { useConfirmPaymentMutation, useCreatePaymentMutation } from '../hooks/usePayments'
import { enrollmentService } from '../services/enrollmentService'
import type { ConfirmPaymentRequest, Payment, PaymentProvider } from '../services/paymentService'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import type { AppError } from '../shared/errors/types'
import { getFirstFieldErrorMap } from '../shared/errors/types'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { createIdempotencyKey, formatCoursePrice, formatCurrency } from '../utils/helpers'

const MAX_LENGTHS = {
  buyerFullName: 120,
  buyerEmail: 160,
  buyerTaxNumber: 30,
  buyerAddress: 500,
  failureReason: 255,
  cardHolderName: 120,
} as const

type BuyerFormState = {
  provider: PaymentProvider
  buyerFullName: string
  buyerEmail: string
  buyerTaxNumber: string
  buyerAddress: string
}

type CardFormState = {
  cardHolderName: string
  cardNumber: string
  expiry: string
  cvv: string
}

const digitsOnly = (value: string) => value.replace(/\D/g, '')

const formatCardNumber = (value: string) =>
  digitsOnly(value)
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim()

const formatExpiry = (value: string) => {
  const digits = digitsOnly(value).slice(0, 4)
  if (digits.length <= 2) {
    return digits
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

const isValidCardByLuhn = (cardNumber: string) => {
  const digits = digitsOnly(cardNumber)

  if (digits.length < 13 || digits.length > 19) {
    return false
  }

  let checksum = 0
  let doubleDigit = false

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])

    if (doubleDigit) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    checksum += digit
    doubleDigit = !doubleDigit
  }

  return checksum % 10 === 0
}

const isValidExpiry = (expiry: string) => {
  const matchedValue = expiry.match(/^(0[1-9]|1[0-2])\/(\d{2})$/)

  if (!matchedValue) {
    return false
  }

  const month = Number(matchedValue[1])
  const year = 2000 + Number(matchedValue[2])
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (year < currentYear) {
    return false
  }

  if (year === currentYear && month < currentMonth) {
    return false
  }

  return true
}

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

const trimOrUndefined = (value: string) => {
  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : undefined
}

const DEFAULT_LOCAL_PAYMENT_WEBHOOK_SECRET = 'local-payment-webhook-secret-change-me'

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const toNonEmptyString = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const normalizeBackendErrors = (errors: unknown): string[] => {
  if (typeof errors === 'string') {
    const single = toNonEmptyString(errors)
    return single ? [single] : []
  }

  if (Array.isArray(errors)) {
    return errors
      .map((entry) => toNonEmptyString(entry))
      .filter((entry): entry is string => Boolean(entry))
  }

  const errorsRecord = toRecord(errors)
  const detailEntries: string[] = []

  for (const [field, value] of Object.entries(errorsRecord)) {
    if (typeof value === 'string') {
      const message = toNonEmptyString(value)
      if (message) {
        detailEntries.push(field === '_error' ? message : `${field}: ${message}`)
      }
      continue
    }

    if (Array.isArray(value)) {
      for (const candidate of value) {
        const message = toNonEmptyString(candidate)
        if (!message) {
          continue
        }

        detailEntries.push(field === '_error' ? message : `${field}: ${message}`)
      }
    }
  }

  return detailEntries
}

const toUniqueMessages = (messages: string[]) => {
  const seen = new Set<string>()
  const unique: string[] = []

  for (const message of messages) {
    const normalized = message.trim()
    if (!normalized || seen.has(normalized)) {
      continue
    }

    seen.add(normalized)
    unique.push(normalized)
  }

  return unique
}

const resolveConfirmPaymentId = (createdPayment: Payment) => {
  const paymentId = createdPayment.id?.trim()
  if (!paymentId) {
    throw new Error('Payment create response did not include paymentId.')
  }

  return paymentId
}

const toGatewayTransactionId = (provider: PaymentProvider) => {
  const suffix = `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`

  if (provider === 'STRIPE') {
    return `pi_${suffix}`
  }

  if (provider === 'IYZICO') {
    return `iyz_${suffix}`
  }

  return `mock_${suffix}`
}

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

const buildGatewaySignaturePayload = (
  payment: Payment,
  gatewayTransactionId: string,
  approved: boolean,
  timestamp: number,
  userIdFallback?: string,
) => {
  const userId = toNonEmptyString(payment.userId) ?? toNonEmptyString(userIdFallback)
  const amount = toNonEmptyString(payment.amountRaw) ?? (
    typeof payment.amount === 'number' && Number.isFinite(payment.amount)
      ? String(payment.amount)
      : undefined
  )
  const provider = toNonEmptyString(payment.provider)
  const providerPaymentId = toNonEmptyString(payment.providerPaymentId)
  const courseId = toNonEmptyString(payment.courseId)
  const currency = toNonEmptyString(payment.currency)
  const paymentId = toNonEmptyString(payment.id)

  if (!paymentId || !provider || !providerPaymentId || !userId || !courseId || !amount || !currency) {
    return null
  }

  return [
    paymentId,
    provider,
    providerPaymentId,
    userId,
    courseId,
    amount,
    currency,
    gatewayTransactionId,
    String(approved),
    String(timestamp),
  ].join('|')
}

const computeGatewaySignature = async (payload: string, secret: string) => {
  const encoder = new TextEncoder()
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(payload))
  return arrayBufferToBase64(signatureBuffer)
}

const PaymentPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const { clearCart, isResolvingItems, itemCount, items, removeCourse, subtotal, tax, total } = useCart()
  const { purchaseCourses } = useLibrary()
  const createPaymentMutation = useCreatePaymentMutation()
  const confirmPaymentMutation = useConfirmPaymentMutation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [checkoutErrorDetails, setCheckoutErrorDetails] = useState<string[]>([])
  const [progressMessage, setProgressMessage] = useState<string | null>(null)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [recentlyPurchasedCourseTitles, setRecentlyPurchasedCourseTitles] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({})
  const [pendingDecisionCourseTitle, setPendingDecisionCourseTitle] = useState<string | null>(null)
  const decisionResolverRef = useRef<((approved: boolean) => void) | null>(null)
  const [buyerForm, setBuyerForm] = useState<BuyerFormState>({
    provider: 'MOCK_GATEWAY',
    buyerFullName: user?.name ?? '',
    buyerEmail: user?.email ?? '',
    buyerTaxNumber: '',
    buyerAddress: '',
  })
  const [cardForm, setCardForm] = useState<CardFormState>({
    cardHolderName: user?.name ?? '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  })

  const hasCartIds = itemCount > 0
  const hasItems = hasCartIds && items.length > 0
  const canCheckout = hasItems && !isResolvingItems
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const freeLabel = language === 'tr' ? 'Ucretsiz' : 'Free'
  const summaryCurrency = items[0]?.course.currency ?? 'TRY'
  const paymentRequiredMessage = language === 'tr'
    ? 'Bu kurs icin once basarili odeme gerekli.'
    : 'You need to complete payment before enrolling in this course.'
  const paymentFailedMessage = language === 'tr'
    ? 'Odeme islemi tamamlanamadi. Lutfen tekrar deneyin.'
    : 'Payment could not be completed. Please try again.'
  const paymentDeclinedFallbackReason = language === 'tr'
    ? 'Odeme saglayici islemi onaylamadi.'
    : 'The payment provider declined the transaction.'
  const enrollmentFailedMessage = language === 'tr'
    ? 'Kurs kaydi olusturulamadi. Lutfen tekrar deneyin.'
    : 'Enrollment could not be created. Please try again.'
  const enrollmentAfterPaymentFailedMessage = language === 'tr'
    ? 'Odeme alindi ancak kayit islemi tamamlanamadi. Lutfen tekrar deneyin veya destek ile iletisime gecin.'
    : 'Payment was captured but enrollment could not be completed. Please try again or contact support.'
  const paymentPreparingMessage = language === 'tr' ? 'Odeme hazirlaniyor...' : 'Preparing payment...'
  const paymentConfirmingMessage = language === 'tr' ? 'Odeme dogrulaniyor...' : 'Confirming payment...'
  const enrollmentCreatingMessage = language === 'tr' ? 'Kayit olusturuluyor...' : 'Creating enrollment...'
  const cardSectionTitle = language === 'tr' ? 'Kart Bilgileri' : 'Card details'
  const cardSectionHint = language === 'tr'
    ? 'Bu alanlar gorsel ve dogrulama amaclidir, PSP tarafina gonderilmez.'
    : 'These fields are for UI and validation purposes only and are not sent to PSP.'
  const successMessage = language === 'tr'
    ? 'Odeme basarili. Kurs kaydiniz olusturuldu.'
    : 'Payment succeeded. Your enrollment has been created.'
  const actionLabel = language === 'tr' ? 'Islem' : 'Action'
  const webhookSecretFromEnv = toNonEmptyString(import.meta.env.VITE_PAYMENT_GATEWAY_WEBHOOK_SECRET)
  const gatewayWebhookSecret = webhookSecretFromEnv ?? DEFAULT_LOCAL_PAYMENT_WEBHOOK_SECRET

  const requestPaymentDecision = (courseTitle: string) =>
    new Promise<boolean>((resolve) => {
      decisionResolverRef.current = resolve
      setPendingDecisionCourseTitle(courseTitle)
    })

  const resolvePaymentDecision = (approved: boolean) => {
    const resolve = decisionResolverRef.current
    decisionResolverRef.current = null
    setPendingDecisionCourseTitle(null)
    resolve?.(approved)
  }

  const setBuyerFormValue = <T extends keyof BuyerFormState>(field: T, value: BuyerFormState[T]) => {
    setBuyerForm((previousState) => ({ ...previousState, [field]: value }))

    if (fieldErrors[field as string]) {
      setFieldErrors((previousState) => {
        const nextState = { ...previousState }
        delete nextState[field as string]
        return nextState
      })
    }
  }

  const setCardFormValue = <T extends keyof CardFormState>(field: T, value: CardFormState[T]) => {
    const normalizedValue = (() => {
      if (field === 'cardNumber') {
        return formatCardNumber(value)
      }

      if (field === 'expiry') {
        return formatExpiry(value)
      }

      if (field === 'cvv') {
        return digitsOnly(value).slice(0, 4)
      }

      return value
    })() as CardFormState[T]

    setCardForm((previousState) => ({ ...previousState, [field]: normalizedValue }))

    if (cardErrors[field as string]) {
      setCardErrors((previousState) => {
        const nextState = { ...previousState }
        delete nextState[field as string]
        return nextState
      })
    }
  }

  const validateBuyerForm = () => {
    const nextErrors: Record<string, string> = {}
    const checkLength = (field: keyof typeof MAX_LENGTHS, value: string) => {
      const maxLength = MAX_LENGTHS[field]
      if (value.trim().length > maxLength) {
        nextErrors[field] = language === 'tr'
          ? `Bu alan en fazla ${maxLength} karakter olabilir.`
          : `This field can be at most ${maxLength} characters.`
      }
    }

    checkLength('buyerFullName', buyerForm.buyerFullName)
    checkLength('buyerEmail', buyerForm.buyerEmail)
    checkLength('buyerTaxNumber', buyerForm.buyerTaxNumber)
    checkLength('buyerAddress', buyerForm.buyerAddress)

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateCardForm = () => {
    const hasPaidCourse = items.some((item) => item.course.price > 0)
    const shouldValidateCard = hasPaidCourse

    if (!shouldValidateCard) {
      setCardErrors({})
      return true
    }

    const nextErrors: Record<string, string> = {}
    const cardHolder = cardForm.cardHolderName.trim()
    const cardNumber = cardForm.cardNumber.trim()
    const expiry = cardForm.expiry.trim()
    const cvv = cardForm.cvv.trim()

    if (!cardHolder) {
      nextErrors.cardHolderName = language === 'tr' ? 'Kart sahibi adi zorunludur.' : 'Card holder name is required.'
    } else if (cardHolder.length > MAX_LENGTHS.cardHolderName) {
      nextErrors.cardHolderName = language === 'tr'
        ? `Bu alan en fazla ${MAX_LENGTHS.cardHolderName} karakter olabilir.`
        : `This field can be at most ${MAX_LENGTHS.cardHolderName} characters.`
    }

    if (!cardNumber) {
      nextErrors.cardNumber = language === 'tr' ? 'Kart numarasi zorunludur.' : 'Card number is required.'
    } else if (!isValidCardByLuhn(cardNumber)) {
      nextErrors.cardNumber = language === 'tr' ? 'Gecerli bir kart numarasi girin.' : 'Enter a valid card number.'
    }

    if (!expiry) {
      nextErrors.expiry = language === 'tr' ? 'Son kullanma tarihi zorunludur.' : 'Expiry date is required.'
    } else if (!isValidExpiry(expiry)) {
      nextErrors.expiry = language === 'tr' ? 'Gecerli bir son kullanma tarihi girin (MM/YY).' : 'Enter a valid expiry date (MM/YY).'
    }

    if (!cvv) {
      nextErrors.cvv = language === 'tr' ? 'CVV zorunludur.' : 'CVV is required.'
    } else if (!/^\d{3,4}$/.test(cvv)) {
      nextErrors.cvv = language === 'tr' ? 'CVV 3 veya 4 haneli olmalidir.' : 'CVV must be 3 or 4 digits.'
    }

    setCardErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const buildBuyerPayload = () => ({
    buyerFullName: trimOrUndefined(buyerForm.buyerFullName),
    buyerEmail: trimOrUndefined(buyerForm.buyerEmail),
    buyerTaxNumber: trimOrUndefined(buyerForm.buyerTaxNumber),
    buyerAddress: trimOrUndefined(buyerForm.buyerAddress),
  })

  const applyServerValidationErrors = (error: unknown) => {
    const appError = normalizeApiError(error)
    setFieldErrors(getFirstFieldErrorMap(appError.fieldErrors))
    return appError
  }

  const extractCheckoutErrorFeedback = (appError: AppError) => {
    const rawPayload = toRecord(appError.raw)
    const rawMessage = toNonEmptyString(rawPayload.message)
    const rawErrors = normalizeBackendErrors(rawPayload.errors)
    const fieldErrors = appError.fieldErrors
      ? Object.entries(appError.fieldErrors).flatMap(([field, messages]) =>
        messages
          .map((message) => toNonEmptyString(message))
          .filter((message): message is string => Boolean(message))
          .map((message) => (field === '_error' ? message : `${field}: ${message}`)))
      : []

    const combinedDetails = toUniqueMessages([...rawErrors, ...fieldErrors])
    const resolvedMessage = rawMessage ?? toNonEmptyString(appError.message)

    return {
      message: resolvedMessage,
      details: combinedDetails,
    }
  }

  const buildConfirmPayload = async (
    createdPayment: Payment,
    approved: boolean,
    buyerPayload: ReturnType<typeof buildBuyerPayload>,
  ): Promise<ConfirmPaymentRequest> => {
    const payload: ConfirmPaymentRequest = {
      approved,
      failureReason: approved ? undefined : paymentDeclinedFallbackReason,
      ...buyerPayload,
    }

    const provider = createdPayment.provider ?? buyerForm.provider
    if (provider === 'MOCK_GATEWAY') {
      return payload
    }

    const gatewayTransactionId = toGatewayTransactionId(provider)
    const gatewayTimestampEpochSeconds = Math.floor(Date.now() / 1000)
    const signaturePayload = buildGatewaySignaturePayload(
      createdPayment,
      gatewayTransactionId,
      approved,
      gatewayTimestampEpochSeconds,
      user?.id,
    )

    if (!signaturePayload || !globalThis.crypto?.subtle) {
      return payload
    }

    payload.gatewayTransactionId = gatewayTransactionId
    payload.gatewayTimestampEpochSeconds = gatewayTimestampEpochSeconds
    payload.gatewaySignature = await computeGatewaySignature(signaturePayload, gatewayWebhookSecret)
    return payload
  }

  const handleCheckout = async () => {
    if (!isAuthenticated || !canCheckout || isSubmitting) {
      return
    }

    if (!validateBuyerForm() || !validateCardForm()) {
      return
    }

    setIsSubmitting(true)
    setCheckoutMessage(null)
    setCheckoutErrorDetails([])
    setProgressMessage(null)
    setFieldErrors({})
    setCardErrors({})

    const successfulCourseIds: string[] = []
    const successfulCourseTitles: string[] = []
    const buyerPayload = buildBuyerPayload()

    try {
      for (const item of items) {
        const isPaidCourse = item.course.price > 0

        if (isPaidCourse) {
          setProgressMessage(paymentPreparingMessage)

          const createdPayment = await createPaymentMutation.mutateAsync({
            courseId: item.course.id,
            provider: buyerForm.provider,
            paymentMethod: 'CARD',
            idempotencyKey: createIdempotencyKey(),
            autoConfirm: false,
            ...buyerPayload,
          })

          const approved = await requestPaymentDecision(item.course.title)
          setProgressMessage(paymentConfirmingMessage)
          const paymentId = resolveConfirmPaymentId(createdPayment)
          const confirmPayload = await buildConfirmPayload(createdPayment, approved, buyerPayload)

          const confirmedPayment = await confirmPaymentMutation.mutateAsync({
            paymentId,
            payload: confirmPayload,
          })

          if (confirmedPayment.status !== 'SUCCEEDED') {
            const failureReason = confirmedPayment.failureReason?.trim()
            throw new Error(failureReason || paymentFailedMessage)
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
          queryClient.invalidateQueries({ queryKey: ['payments', 'me'] }),
        ])
      }

      setRecentlyPurchasedCourseTitles(successfulCourseTitles)
      setCheckoutMessage(successMessage)
      setCheckoutErrorDetails([])
      setIsSuccessModalOpen(true)
    } catch (error) {
      const appError = applyServerValidationErrors(error)
      const { message: backendMessage, details: backendDetails } = extractCheckoutErrorFeedback(appError)

      if (successfulCourseIds.length > 0) {
        purchaseCourses(successfulCourseIds)
        for (const courseId of successfulCourseIds) {
          removeCourse(courseId)
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['my-courses'] }),
          queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] }),
          queryClient.invalidateQueries({ queryKey: ['payments', 'me'] }),
        ])
      }

      if (appError.httpStatus === 400) {
        console.error('Payment checkout failed with 400 response body:', appError.raw)
      }

      const message = backendMessage
        ?? (error instanceof Error && error.message.trim()
          ? error.message.trim()
          : paymentFailedMessage)

      setCheckoutErrorDetails(backendDetails)
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
          <Link to={hasCartIds ? ROUTES.cart : ROUTES.courses}>
            <Button asChild variant="secondary">
              {hasCartIds ? t('payment.backToCart') : t('payment.browseCourses')}
            </Button>
          </Link>
        }
        description={t('payment.description')}
        eyebrow={t('payment.eyebrow')}
        title={t('payment.title')}
      />

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-5 py-5">
          {hasCartIds ? (
            isResolvingItems ? (
              <div className="theme-muted rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-4 text-sm">
                {t('loader.courseCatalog')}
              </div>
            ) : hasItems ? (
              <div className="space-y-5">
              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-2">
                    <CreditCard className="h-4 w-4 text-[color:var(--primary)]" />
                  </span>
                  <div>
                    <p className="theme-heading text-sm font-semibold">{language === 'tr' ? 'Odeme Ozeti' : 'Payment summary'}</p>
                    <p className="theme-muted mt-1 text-sm leading-6">
                      {language === 'tr'
                        ? 'Odeme olusturma ve dogrulama adimlari ayri olarak calisir.'
                        : 'Payment creation and confirmation are handled as separate steps.'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm theme-muted">
                  <ShieldCheck className="mr-2 inline h-4 w-4 text-[color:var(--primary)]" />
                  {language === 'tr'
                    ? 'Bu ekran demo odeme akisidir, girilen kart bilgileri kaydedilmez.'
                    : 'This is a demo payment flow; card fields are validated but not stored.'}
                </div>
              </div>

              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                <p className="theme-heading text-sm font-semibold">{language === 'tr' ? 'Odeme Bilgileri' : 'Payment details'}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-2">
                    <span className="theme-heading text-sm font-semibold">Provider</span>
                    <select
                      className="h-12 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 text-sm theme-text outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                      onChange={(event) => setBuyerFormValue('provider', event.target.value as PaymentProvider)}
                      value={buyerForm.provider}
                    >
                      <option value="MOCK_GATEWAY">MOCK_GATEWAY</option>
                      <option value="STRIPE">STRIPE</option>
                      <option value="IYZICO">IYZICO</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="theme-heading text-sm font-semibold">{language === 'tr' ? 'Odeme Yontemi' : 'Payment method'}</span>
                    <input
                      className="h-12 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 text-sm theme-text"
                      readOnly
                      value="CARD"
                    />
                  </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    error={fieldErrors.buyerFullName}
                    label={language === 'tr' ? 'Alici Ad Soyad' : 'Buyer full name'}
                    maxLength={MAX_LENGTHS.buyerFullName}
                    onChange={(event) => setBuyerFormValue('buyerFullName', event.target.value)}
                    value={buyerForm.buyerFullName}
                  />
                  <Input
                    error={fieldErrors.buyerEmail}
                    label={language === 'tr' ? 'Alici E-posta' : 'Buyer email'}
                    maxLength={MAX_LENGTHS.buyerEmail}
                    onChange={(event) => setBuyerFormValue('buyerEmail', event.target.value)}
                    type="email"
                    value={buyerForm.buyerEmail}
                  />
                  <Input
                    error={fieldErrors.buyerTaxNumber}
                    label={language === 'tr' ? 'Vergi Numarasi' : 'Buyer tax number'}
                    maxLength={MAX_LENGTHS.buyerTaxNumber}
                    onChange={(event) => setBuyerFormValue('buyerTaxNumber', event.target.value)}
                    value={buyerForm.buyerTaxNumber}
                  />
                  <label className="flex flex-col gap-2 sm:col-span-2">
                    <span className="theme-heading text-sm font-semibold">{language === 'tr' ? 'Alici Adres' : 'Buyer address'}</span>
                    <textarea
                      className="min-h-24 rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-2 text-sm theme-text outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)]"
                      maxLength={MAX_LENGTHS.buyerAddress}
                      onChange={(event) => setBuyerFormValue('buyerAddress', event.target.value)}
                      value={buyerForm.buyerAddress}
                    />
                    {fieldErrors.buyerAddress ? (
                      <span className="text-xs text-[color:var(--danger)]">{fieldErrors.buyerAddress}</span>
                    ) : null}
                  </label>
                </div>
              </div>

              <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
                <p className="theme-heading text-sm font-semibold">{cardSectionTitle}</p>
                <p className="theme-muted mt-1 text-xs">{cardSectionHint}</p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input
                    error={cardErrors.cardHolderName}
                    label={language === 'tr' ? 'Kart Uzerindeki Isim' : 'Name on card'}
                    maxLength={MAX_LENGTHS.cardHolderName}
                    onChange={(event) => setCardFormValue('cardHolderName', event.target.value)}
                    placeholder={language === 'tr' ? 'Ad Soyad' : 'Full name'}
                    value={cardForm.cardHolderName}
                  />
                  <Input
                    error={cardErrors.cardNumber}
                    inputMode="numeric"
                    label={language === 'tr' ? 'Kart Numarasi' : 'Card number'}
                    maxLength={23}
                    onChange={(event) => setCardFormValue('cardNumber', event.target.value)}
                    placeholder="0000 0000 0000 0000"
                    value={cardForm.cardNumber}
                  />
                  <Input
                    error={cardErrors.expiry}
                    inputMode="numeric"
                    label={language === 'tr' ? 'Son Kullanma (MM/YY)' : 'Expiry (MM/YY)'}
                    maxLength={5}
                    onChange={(event) => setCardFormValue('expiry', event.target.value)}
                    placeholder="MM/YY"
                    value={cardForm.expiry}
                  />
                  <Input
                    error={cardErrors.cvv}
                    inputMode="numeric"
                    label="CVV"
                    maxLength={4}
                    onChange={(event) => setCardFormValue('cvv', event.target.value)}
                    placeholder="123"
                    value={cardForm.cvv}
                  />
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
                            <p className="theme-muted mt-1 text-xs">{getCourseCategoryLabel(item.course)} - {item.course.level.levelName}</p>
                          </div>
                        </td>
                        <td className="theme-heading px-4 py-3.5 font-semibold">
                          {formatCoursePrice(item.course.price, item.course.currency, { locale, freeLabel })}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge tone={item.course.price > 0 ? 'warning' : 'success'}>
                            {item.course.price > 0
                              ? (language === 'tr' ? 'Ucretli kurs' : 'Paid course')
                              : (language === 'tr' ? 'Ucretsiz kurs' : 'Free course')}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>

              {checkoutMessage ? (
                <div
                  className={`rounded-sm border px-4 py-3 text-sm ${
                    checkoutMessage === successMessage
                      ? 'border-[color:var(--border)] bg-[color:var(--surface-sky-haze)] theme-heading'
                      : 'border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] text-[color:var(--danger)]'
                  }`}
                >
                  <p>{checkoutMessage}</p>
                  {checkoutMessage !== successMessage && checkoutErrorDetails.length > 0 ? (
                    <ul className="mt-2 list-disc pl-5 text-xs leading-6">
                      {checkoutErrorDetails.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              <Button className="w-full justify-center" disabled={isSubmitting || !canCheckout} onClick={() => void handleCheckout()} size="lg">
                {progressMessage ?? (language === 'tr' ? 'Odemeyi Tamamla ve Kursa Katil' : 'Complete Payment and Join Course')}
              </Button>
              </div>
            ) : (
              <EmptyState
                action={(
                  <Link className="inline-flex" to={ROUTES.cart}>
                    <Button asChild>{t('payment.backToCart')}</Button>
                  </Link>
                )}
                description={language === 'tr'
                  ? 'Sepetindeki kurslarin detaylari yuklenemedi. Lutfen sepete donup tekrar dene.'
                  : 'Cart course details could not be loaded. Please go back to the cart and try again.'}
                title={language === 'tr' ? 'Odeme detaylari yuklenemedi' : 'Checkout details unavailable'}
              />
            )
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
        description={language === 'tr'
          ? 'Demo sonucunu secin. Onay verirseniz odeme SUCCEEDED olur, reddederseniz FAILED olur.'
          : 'Choose the demo result. Approve maps to SUCCEEDED, decline maps to FAILED.'}
        onClose={() => resolvePaymentDecision(false)}
        open={Boolean(pendingDecisionCourseTitle)}
        title={language === 'tr' ? 'Odeme Sonucu Simulasyonu' : 'Payment Result Simulation'}
      >
        <div className="space-y-4">
          <p className="rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 text-sm theme-heading">
            {language === 'tr'
              ? `"${pendingDecisionCourseTitle ?? ''}" icin odeme sonucunu secin.`
              : `Choose a payment outcome for "${pendingDecisionCourseTitle ?? ''}".`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              className="w-full justify-center"
              onClick={() => resolvePaymentDecision(true)}
              size="lg"
            >
              {language === 'tr' ? 'Onayla (Success)' : 'Approve (Success)'}
            </Button>
            <Button
              className="w-full justify-center"
              onClick={() => resolvePaymentDecision(false)}
              size="lg"
              variant="secondary"
            >
              {language === 'tr' ? 'Reddet (Fail)' : 'Decline (Fail)'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        description={language === 'tr' ? 'Secilen kurslariniz aktif hale getirildi.' : 'Your selected courses are now active.'}
        onClose={() => setIsSuccessModalOpen(false)}
        open={isSuccessModalOpen}
        title={language === 'tr' ? 'Odeme Basarili' : 'Payment successful'}
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
