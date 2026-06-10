export const APP_NAME = 'EduBase'
export const AUTH_TOKEN_KEY = 'accessToken'
export const AUTH_REFRESH_TOKEN_KEY = 'refreshToken'
export const LEGACY_AUTH_TOKEN_KEY = 'access_token'
export const LEGACY_AUTH_REFRESH_TOKEN_KEY = 'refresh_token'
export const AUTH_USER_KEY = 'edubase.auth.user'
export const AUTH_CLAIMS_KEY = 'edubase.auth.claims'
export const THEME_STORAGE_KEY = 'edubase.theme'
export const LANGUAGE_STORAGE_KEY = 'edubase.language'
export const CART_STORAGE_KEY = 'edubase.cart'
export const LIBRARY_STORAGE_KEY = 'edubase.library'
export const LEGACY_AUTH_USER_KEY = 'luma.auth.user'
export const LEGACY_AUTH_CLAIMS_KEY = 'luma.auth.claims'
export const LEGACY_THEME_STORAGE_KEY = 'luma.theme'
export const LEGACY_LANGUAGE_STORAGE_KEY = 'luma.language'
export const LEGACY_CART_STORAGE_KEY = 'luma.cart'
export const LEGACY_LIBRARY_STORAGE_KEY = 'luma.library'
export const SUPPORTED_LANGUAGES = ['en', 'tr'] as const
export const PROGRESS_SYNC_INTERVAL_SECONDS = 15
export const RESUME_PROMPT_MIN_SECONDS = 10
export const LESSON_COMPLETION_THRESHOLD_PERCENT = 80

export const ROUTES = {
  home: '/',
  catalog: '/catalog',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  changePassword: '/change-password',
  reactivateAccount: '/reactivate-account',
  completeProfile: '/complete-profile',
  dashboard: '/dashboard',
  myCourses: '/my-courses',
  courses: '/courses',
  courseDetail: (slug = ':slug') => `/courses/${slug}`,
  coursePlayer: (slug = ':slug') => `/courses/${slug}/watch`,
  courseFinalExamOverview: (courseId = ':courseId') => `/courses/${courseId}/final-exam`,
  courseFinalExamAttempt: (courseId = ':courseId', attemptId = ':attemptId') => `/courses/${courseId}/final-exam/attempt/${attemptId}`,
  courseFinalExamResult: (courseId = ':courseId', attemptId = ':attemptId') => `/courses/${courseId}/final-exam/attempt/${attemptId}/result`,
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
