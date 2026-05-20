import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { useQuery } from '@tanstack/react-query'
import { CART_STORAGE_KEY } from '../utils/constants'
import { useLanguage } from './useLanguage'
import { useAuth } from './useAuth'
import { courseService } from '../services/courseService'
import type { CartItem } from '../utils/types'

interface CartContextValue {
  items: CartItem[]
  courseIds: string[]
  itemCount: number
  subtotal: number
  tax: number
  total: number
  addCourse: (courseId: string) => void
  removeCourse: (courseId: string) => void
  clearCart: () => void
  isInCart: (courseId: string) => boolean
}

const CartContext = createContext<CartContextValue | undefined>(undefined)
const normalizeCourseId = (courseId: string) => String(courseId ?? '').trim()

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage()
  const { isBootstrapping, user } = useAuth()
  const storageScope = user?.id ? encodeURIComponent(user.id) : 'guest'
  const storageKey = `${CART_STORAGE_KEY}.${storageScope}`
  const [courseIds, setCourseIds] = useState<string[]>([])
  const [hydratedStorageKey, setHydratedStorageKey] = useState<string | null>(null)

  useEffect(() => {
    if (isBootstrapping) {
      return
    }

    const storedCart = localStorage.getItem(storageKey)

    if (!storedCart) {
      setCourseIds([])
      setHydratedStorageKey(storageKey)
      return
    }

    try {
      const parsed = JSON.parse(storedCart) as string[]
      const normalized = Array.isArray(parsed)
        ? Array.from(new Set(
          parsed
            .map((item) => normalizeCourseId(item))
            .filter(Boolean),
        ))
        : []
      setCourseIds(normalized)
    } catch {
      setCourseIds([])
    }

    setHydratedStorageKey(storageKey)
  }, [isBootstrapping, storageKey])

  useEffect(() => {
    if (isBootstrapping || hydratedStorageKey !== storageKey) {
      return
    }

    localStorage.setItem(storageKey, JSON.stringify(courseIds))
  }, [courseIds, hydratedStorageKey, isBootstrapping, storageKey])

  const { data: localizedCourses = [] } = useQuery({
    queryKey: ['public-courses', language],
    queryFn: () => courseService.getCourses(language),
  })
  const items = courseIds
    .map((courseId) => {
      const course = localizedCourses.find((entry) => entry.id === courseId)

      return course ? { courseId, course } : null
    })
    .filter((item): item is CartItem => item !== null)

  const subtotal = items.reduce((sum, item) => sum + item.course.price, 0)
  const tax = Math.round(subtotal * 0.08)
  const total = subtotal + tax

  const addCourse = (courseId: string) => {
    const normalizedCourseId = normalizeCourseId(courseId)
    if (!normalizedCourseId) {
      return
    }

    setCourseIds((currentIds) =>
      currentIds.includes(normalizedCourseId) ? currentIds : [...currentIds, normalizedCourseId],
    )
  }

  const removeCourse = (courseId: string) => {
    const normalizedCourseId = normalizeCourseId(courseId)
    setCourseIds((currentIds) => currentIds.filter((currentId) => currentId !== normalizedCourseId))
  }

  const clearCart = () => {
    setCourseIds([])
  }

  const isInCart = (courseId: string) => courseIds.includes(normalizeCourseId(courseId))

  return (
    <CartContext.Provider
      value={{
        items,
        courseIds,
        itemCount: courseIds.length,
        subtotal,
        tax,
        total,
        addCourse,
        removeCourse,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
