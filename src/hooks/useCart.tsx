import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { CART_STORAGE_KEY } from '../utils/constants'
import { getCourses } from '../utils/mockData'
import { useLanguage } from './useLanguage'
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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { language } = useLanguage()
  const [courseIds, setCourseIds] = useState<string[]>(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY)

    if (!storedCart) {
      return []
    }

    try {
      const parsed = JSON.parse(storedCart) as string[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(courseIds))
  }, [courseIds])

  const localizedCourses = getCourses(language)
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
    setCourseIds((currentIds) =>
      currentIds.includes(courseId) ? currentIds : [...currentIds, courseId],
    )
  }

  const removeCourse = (courseId: string) => {
    setCourseIds((currentIds) => currentIds.filter((currentId) => currentId !== courseId))
  }

  const clearCart = () => {
    setCourseIds([])
  }

  const isInCart = (courseId: string) => courseIds.includes(courseId)

  return (
    <CartContext.Provider
      value={{
        items,
        courseIds,
        itemCount: items.length,
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
