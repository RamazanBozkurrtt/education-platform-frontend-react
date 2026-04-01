import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { LIBRARY_STORAGE_KEY } from '../utils/constants'
import { getCourses } from '../utils/mockData'
import { useLanguage } from './useLanguage'
import type { Course } from '../utils/types'

interface LibraryContextValue {
  purchasedCourseIds: string[]
  purchasedCourses: Course[]
  purchaseCourses: (courseIds: string[]) => void
  isPurchased: (courseId: string) => boolean
}

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined)

export const LibraryProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage()
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>(() => {
    const storedLibrary = localStorage.getItem(LIBRARY_STORAGE_KEY)

    if (!storedLibrary) {
      return []
    }

    try {
      const parsed = JSON.parse(storedLibrary) as string[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(purchasedCourseIds))
  }, [purchasedCourseIds])

  const localizedCourses = getCourses(language)
  const purchasedCourses = purchasedCourseIds
    .map((courseId) => localizedCourses.find((entry) => entry.id === courseId) ?? null)
    .filter((course): course is Course => course !== null)

  const purchaseCourses = (courseIds: string[]) => {
    setPurchasedCourseIds((currentIds) => [...new Set([...currentIds, ...courseIds])])
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
