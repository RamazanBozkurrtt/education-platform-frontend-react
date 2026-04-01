export const cn = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export const sleep = (duration = 600) =>
  new Promise((resolve) => window.setTimeout(resolve, duration))

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
