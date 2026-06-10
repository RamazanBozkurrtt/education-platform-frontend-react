export const cn = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export const sleep = (duration = 600) =>
  new Promise((resolve) => window.setTimeout(resolve, duration))

interface CurrencyFormatOptions {
  currency?: string
  locale?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

const normalizeCurrencyCode = (currency?: string | null) => {
  if (typeof currency !== 'string') {
    return undefined
  }

  const normalized = currency.trim().toUpperCase()

  return /^[A-Z]{3}$/.test(normalized) ? normalized : undefined
}

export const formatCurrency = (
  amount: number,
  {
    currency = 'USD',
    locale = 'en-US',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  }: CurrencyFormatOptions = {},
) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizeCurrencyCode(currency) ?? 'USD',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)

interface CoursePriceFormatOptions {
  locale?: string
  freeLabel?: string
}

export const formatCoursePrice = (
  price: number | null | undefined,
  currency?: string | null,
  { locale = 'en-US', freeLabel = 'Free' }: CoursePriceFormatOptions = {},
) => {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return freeLabel
  }

  const normalizedCurrency = normalizeCurrencyCode(currency) ?? 'USD'
  const hasFraction = Math.abs(price % 1) > Number.EPSILON
  const fractionDigits = hasFraction ? 2 : 0

  return formatCurrency(price, {
    currency: normalizedCurrency,
    locale,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export const parseStudentCount = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.round(value))
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim().toLocaleLowerCase('en-US')

  if (!normalized) {
    return undefined
  }

  const multiplier = normalized.endsWith('k') ? 1000 : 1
  const rawNumericPart = normalized
    .replace(/k$/, '')
    .replace(/\s*(learners?|students?|öğrenci|ogrenci|katılımcı|katilimci)\s*/gi, '')
    .replace(/[^0-9.,]/g, '')
  const numericPart = multiplier === 1000
    ? rawNumericPart.replace(/,/g, '.')
    : rawNumericPart.includes('.') && rawNumericPart.includes(',')
      ? rawNumericPart.replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.')
      : rawNumericPart.replace(/[.,](?=\d{3}\b)/g, '')
  const parsed = Number.parseFloat(numericPart)

  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * multiplier)) : undefined
}

export const formatStudentCount = (value: number | null | undefined, locale = 'en-US') => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return '0'
  }

  return Math.round(value).toLocaleString(locale)
}

export const formatStudentCountLabel = (
  value: number | null | undefined,
  language: 'en' | 'tr' = 'en',
) => {
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const count = formatStudentCount(value, locale)

  return language === 'tr'
    ? `${count} öğrenci`
    : `${count} ${value === 1 ? 'student' : 'students'}`
}

export const createIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const randomPart = Math.random().toString(36).slice(2, 10)
  return `idem-${Date.now()}-${randomPart}`
}

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
