import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { LIBRARY_STORAGE_KEY } from '../utils/constants'
import { useLanguage } from './useLanguage'
import { useAuth } from './useAuth'
import { getAccessToken } from '../services/authSession'
import { courseService } from '../services/courseService'
import { authFlowLog } from '../shared/authFlowDebug'
import type { AuthClaims, Course } from '../utils/types'

interface LibraryContextValue {
  purchasedCourseIds: string[]
  purchasedCourses: Course[]
  purchaseCourses: (courseIds: string[]) => void
  isPurchased: (courseId: string) => boolean
}

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined)

const resolveLibraryAudience = (claims: AuthClaims | null) => {
  const candidates = [claims?.roles, claims?.authorities, claims?.scope]

  for (const candidate of candidates) {
    const values = Array.isArray(candidate)
      ? candidate
      : typeof candidate === 'string'
        ? candidate.split(/\s+/)
        : []

    for (const value of values) {
      if (typeof value !== 'string') {
        continue
      }

      const normalized = value.trim().toUpperCase().replace(/^ROLE_/, '')

      if (normalized === 'ADMIN' || normalized === 'INSTRUCTOR') {
        return 'instructor' as const
      }
    }
  }

  return 'student' as const
}

export const LibraryProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage()
  const { isAuthenticated, isBootstrapping, user, claims } = useAuth()
  const canLoadPrivateLibrary = isAuthenticated && Boolean(user?.profileCompleted)
  const audience = resolveLibraryAudience(claims)
  const storageScope = user?.id ? encodeURIComponent(user.id) : 'guest'
  const storageKey = `${LIBRARY_STORAGE_KEY}.${storageScope}`
  const [localPurchasedCourseIds, setLocalPurchasedCourseIds] = useState<string[]>([])
  const [optimisticCourseIds, setOptimisticCourseIds] = useState<string[]>([])
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null)

  useEffect(() => {
    if (isBootstrapping || isAuthenticated) {
      return
    }

    const storedLibrary = localStorage.getItem(storageKey)

    if (!storedLibrary) {
      setLocalPurchasedCourseIds([])
      setHydratedStorageKey(storageKey)
      return
    }

    try {
      const parsed = JSON.parse(storedLibrary) as string[]
      setLocalPurchasedCourseIds(Array.isArray(parsed) ? parsed : [])
    } catch {
      setLocalPurchasedCourseIds([])
    }

    setHydratedStorageKey(storageKey)
  }, [isAuthenticated, isBootstrapping, storageKey])

  useEffect(() => {
    if (isBootstrapping || isAuthenticated || hydratedStorageKey !== storageKey) {
      return
    }

    localStorage.setItem(storageKey, JSON.stringify(localPurchasedCourseIds))
  }, [hydratedStorageKey, isAuthenticated, isBootstrapping, localPurchasedCourseIds, storageKey])

  useEffect(() => {
    setOptimisticCourseIds([])
  }, [user?.id])

  useEffect(() => {
    authFlowLog('course request enabled:', {
      enabled: !isBootstrapping && canLoadPrivateLibrary,
      userId: user?.id ?? null,
      role: audience,
      tokenExists: Boolean(getAccessToken()),
    })
  }, [audience, canLoadPrivateLibrary, isBootstrapping, user?.id])

  const { data: userCourses = [] } = useQuery({
    queryKey: ['my-courses', user?.id, language, audience],
    queryFn: async () => {
      try {
        const courses = await courseService.getMyCourses(language, { audience })
        authFlowLog('course response/error:', { count: courses.length })
        return courses
      } catch (error) {
        authFlowLog('course response/error:', error)
        throw error
      }
    },
    enabled: !isBootstrapping && canLoadPrivateLibrary,
  })

  const { data: localizedCourses = [] } = useQuery({
    queryKey: ['public-courses', language],
    queryFn: () => courseService.getCourses(language),
  })

  const purchasedCourses = useMemo(() => {
    if (isAuthenticated) {
      const optimisticCourses = optimisticCourseIds
        .filter((courseId) => !userCourses.some((course) => course.id === courseId))
        .map((courseId) => localizedCourses.find((entry) => entry.id === courseId) ?? null)
        .filter((course): course is Course => course !== null)

      return [...userCourses, ...optimisticCourses]
    }

    return localPurchasedCourseIds
      .map((courseId) => localizedCourses.find((entry) => entry.id === courseId) ?? null)
      .filter((course): course is Course => course !== null)
  }, [isAuthenticated, localPurchasedCourseIds, localizedCourses, optimisticCourseIds, userCourses])

  const purchasedCourseIds = useMemo(
    () => purchasedCourses.map((course) => course.id),
    [purchasedCourses],
  )

  const purchaseCourses = (courseIds: string[]) => {
    if (isAuthenticated) {
      setOptimisticCourseIds((currentIds) => [...new Set([...currentIds, ...courseIds])])
      return
    }

    setLocalPurchasedCourseIds((currentIds) => [...new Set([...currentIds, ...courseIds])])
  }

  const isPurchased = (courseId: string) => purchasedCourseIds.includes(courseId)

  return (
    <LibraryContext.Provider
      value={{
        purchasedCourseIds,
        purchasedCourses,
        purchaseCourses,
        isPurchased,
      }}
    >
      {children}
    </LibraryContext.Provider>
  )
}

export const useLibrary = () => {
  const context = useContext(LibraryContext)

  if (!context) {
    throw new Error('useLibrary must be used inside LibraryProvider')
  }

  return context
}
