export type AppLanguage = 'en' | 'tr'

export type LocalizedField<T> = Record<AppLanguage, T>

export interface User {
  id: string
  name: string
  email: string
  roleLabelKey: string
  avatarColor: string
  initials: string
}

export interface AuthPayload {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface MetricCard {
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
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
}

export interface Course {
  id: string
  slug: string
  title: string
  category: string
  level: string
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
