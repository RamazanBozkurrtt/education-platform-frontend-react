export const APP_NAME = 'Luma Academy'
export const AUTH_TOKEN_KEY = 'luma.auth.token'
export const AUTH_USER_KEY = 'luma.auth.user'
export const THEME_STORAGE_KEY = 'luma.theme'
export const LANGUAGE_STORAGE_KEY = 'luma.language'
export const CART_STORAGE_KEY = 'luma.cart'
export const LIBRARY_STORAGE_KEY = 'luma.library'
export const SUPPORTED_LANGUAGES = ['en', 'tr'] as const

export const ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/',
  courses: '/courses',
  courseDetail: (slug = ':slug') => `/courses/${slug}`,
  coursePlayer: (slug = ':slug') => `/courses/${slug}/watch`,
  cart: '/cart',
  payment: '/payment',
  search: '/search',
} as const
