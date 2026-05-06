export type AppLanguage = 'en' | 'tr'

export type LocalizedField<T> = Record<AppLanguage, T>

export interface User {
  id: string
  name: string
  email: string
  roleLabelKey: string
  avatarColor: string
  initials: string
  profileCompleted?: boolean
  firstName?: string
  lastName?: string
  headline?: string
  biography?: string
  avatarUrl?: string
  socialLinks?: Record<string, string>
}

export interface AuthPayload {
  email: string
  password: string
  name?: string
}

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
}

export interface ApiEnvelope<T> {
  success: boolean
  status: number
  message: string
  data?: T
  errors?: ApiErrorBag
  timestamp: number
}

export type ApiErrorBag =
  | string
  | string[]
  | Record<string, string | string[]>

export interface NormalizedApiError {
  message: string
  details: string[]
  fieldErrors: Record<string, string>
}

export interface AuthClaims {
  sub?: string
  email?: string
  name?: string
  preferred_username?: string
  given_name?: string
  family_name?: string
  roles?: string[] | string
  authorities?: string[] | string
  scope?: string[] | string
  exp?: number
  iat?: number
  [key: string]: unknown
}

export type AuthTokens = {
  access_token: string
  refresh_token: string
  reactivation_link?: string | null
}

export interface AuthSessionSnapshot {
  accessToken: string
  refreshToken: string
  claims: AuthClaims | null
  user: User
}

export interface RegisteredUserData {
  id: number
  email: string
  createdAt: string
  updatedAt: string
  locked: boolean
  userStatus: 'ACTUAL' | 'DEACTIVATED'
}

export type LoginSuccessData = AuthTokens

export interface UserProfileResponse {
  email: string
  firstName?: string
  lastName?: string
  headline?: string
  biography?: string
  avatarUrl?: string
  socialLinks?: Record<string, string>
}

export interface AuthActionResult {
  status: 'authenticated' | 'deactivated'
  message?: string
  reactivationLink?: string
  session?: AuthSessionSnapshot
}

export interface UserProfilePayload {
  email?: string
  firstName?: string
  lastName?: string
  headline?: string
  biography?: string
  avatarUrl?: string
  socialLinks?: Record<string, string>
}

export interface MetricCard {
  label: string
  value: string
  progress: number
  tone: 'cyan' | 'emerald' | 'amber' | 'indigo'
}

export interface ActivityItem {
  id: string
  title: string
  description: string
  time: string
  tag: string
}

export interface CourseModule {
  id: string
  title: string
  duration: string
  type: string
  completed: boolean
  description?: string
  order?: number
  videoUrl?: string
}

export interface Course {
  id: string
  slug: string
  title: string
  imageUrl: string
  category: string
  categoryKey: string
  level: string
  levelKey: string
  duration: string
  lessons: number
  progress: number
  students: string
  rating: number
  price: number
  accent: string
  summary: string
  description: string
  outcomes: string[]
  tags: string[]
  modules: CourseModule[]
  instructor: {
    name: string
    role: string
    bio: string
  }
}

export interface CartItem {
  courseId: string
  course: Course
}

export interface DashboardOverview {
  metrics: MetricCard[]
  recentActivity: ActivityItem[]
  focusCourse: Course
  upcomingMilestones: Array<{
    id: string
    label: string
    due: string
    status: string
  }>
}

export interface SearchFilters {
  query: string
  category: string
  level: string
}

export interface SearchResponse {
  filters: {
    categories: string[]
    levels: string[]
  }
  results: Course[]
}
