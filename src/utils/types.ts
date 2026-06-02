export type AppLanguage = 'en' | 'tr'

export type LocalizedField<T> = Record<AppLanguage, T>

export interface User {
  id: string
  name: string
  email: string
  roles?: string[]
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

export interface ForgotPasswordPayload {
  email: string
}

export interface ReactivationRequestPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
  confirmPassword: string
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
  user_id?: string | number | null
  userId?: string | number | null
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
  durationSeconds?: number | null
  type: string
  completed: boolean
  description?: string
  order?: number
  videoUrl?: string
}

export interface LessonProgress {
  courseId: string
  lessonId: string
  lastWatchedSecond: number
  watchedPercentage: number
  completed: boolean
  completedAt: string | null
  updatedAt: string | null
}

export interface LessonProgressUpdateRequest {
  lastWatchedSecond: number
  videoDurationSecond: number
}

export interface CourseProgressSummary {
  courseId: string
  totalLessons: number
  completedLessons: number
  overallPercentage: number
  lastLessonId: string | null
  lastWatchedSecond: number
  lastActivityAt: string | null
}

export interface CourseCategoryOption {
  id: string
  categoryName: string
}

export interface CourseLevelOption {
  id: string
  levelName: string
}

export interface Course {
  id: string
  slug: string
  title: string
  imageUrl: string
  categoryIds?: string[]
  categories?: CourseCategoryOption[]
  categoryId?: string
  category: string
  categoryKey: string
  levelId?: string
  level: CourseLevelOption
  levelKey: string
  duration: string
  durationSeconds?: number | null
  totalDurationSeconds?: number | null
  lessons: number
  progress: number
  students: string
  rating: number
  price: number
  currency?: string
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
    avatarUrl?: string
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

export interface RecommendationCourse {
  courseId: string
  title: string
  description: string
  category: string
  level: string
  duration?: string | number | null
  durationSeconds?: string | number | null
  totalDuration?: string | number | null
  totalDurationSeconds?: string | number | null
  lessonCount: number
  rating?: number | null
  thumbnailUrl?: string | null
  score?: number | null
  reason?: string | null
  badges?: string[] | null
}

export interface RecommendationListPayload {
  recommendations: RecommendationCourse[]
  strategy?: string
}

export interface RecommendationExplainPayload {
  favoriteCategories?: string[] | null
  averageCompletionRate?: number | null
  dropoutRate?: number | null
  preferredDurationLabel?: string | null
  recommendationStrategy?: string | null
  explanation?: string | null
}

export interface InstructorProfilePayload {
  displayName: string
  biography: string
  expertise: string[]
  websiteUrl?: string
  linkedinUrl?: string
  githubUrl?: string
  profileImageUrl?: string
}

export interface InstructorProfileResponse extends InstructorProfilePayload {
  id?: string
  status?: string
  userId?: string
  roles?: string[]
  access_token?: string | null
  refresh_token?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface PagedResponse<T> {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface Review {
  id: string
  courseId: string
  userId: string
  userDisplayName?: string
  userProfileImageUrl?: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
  ownedByCurrentUser?: boolean
}

export interface ReviewSummary {
  courseId: string
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<string, number>
}

export interface CreateReviewRequest {
  rating: number
  comment: string
}

export interface UpdateReviewRequest {
  rating: number
  comment: string
}
