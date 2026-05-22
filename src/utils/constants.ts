export const APP_NAME = 'Edubase'
export const AUTH_TOKEN_KEY = 'accessToken'
export const AUTH_REFRESH_TOKEN_KEY = 'refreshToken'
export const LEGACY_AUTH_TOKEN_KEY = 'access_token'
export const LEGACY_AUTH_REFRESH_TOKEN_KEY = 'refresh_token'
export const AUTH_USER_KEY = 'luma.auth.user'
export const AUTH_CLAIMS_KEY = 'luma.auth.claims'
export const THEME_STORAGE_KEY = 'luma.theme'
export const LANGUAGE_STORAGE_KEY = 'luma.language'
export const CART_STORAGE_KEY = 'luma.cart'
export const LIBRARY_STORAGE_KEY = 'luma.library'
export const SUPPORTED_LANGUAGES = ['en', 'tr'] as const

export const ROUTES = {
  home: '/',
  catalog: '/catalog',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  reactivateAccount: '/reactivate-account',
  completeProfile: '/complete-profile',
  dashboard: '/dashboard',
  myCourses: '/my-courses',
  courses: '/courses',
  courseDetail: (slug = ':slug') => `/courses/${slug}`,
  coursePlayer: (slug = ':slug') => `/courses/${slug}/watch`,
  cart: '/cart',
  payment: '/payment',
  payments: '/payments',
  search: '/search',
  profile: '/profile',
  becomeInstructor: '/dashboard/become-instructor',
  instructorDashboard: '/instructor',
  instructorProfile: '/instructor/profile',
  instructorNewCourse: '/instructor/courses/new',
  instructorNewCourseVideo: (courseId = ':courseId') => `/instructor/courses/${courseId}/videos/new`,
  unauthorized: '/unauthorized',
} as const
