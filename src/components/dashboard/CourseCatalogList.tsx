import { ArrowRight, CheckCircle2, Clock3, PlayCircle, ShoppingCart, Star, UserRound, UsersRound } from 'lucide-react'
import type { SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { resolveServiceUrl } from '../../config/api'
import { useCart } from '../../hooks/useCart'
import { useLanguage } from '../../hooks/useLanguage'
import { useLibrary } from '../../hooks/useLibrary'
import { API_ENDPOINTS } from '../../services/endpoints'
import { ROUTES } from '../../utils/constants'
import { getCourseCategoryLabel } from '../../utils/courseCategory'
import { resolveCourseDurationLabel } from '../../utils/duration'
import { formatCoursePrice } from '../../utils/helpers'
import type { Course } from '../../utils/types'
import Button from '../ui/Button'
import StatusBadge from './StatusBadge'

interface CourseCatalogListProps {
  courses: Course[]
}

const CourseCatalogList = ({ courses }: CourseCatalogListProps) => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const { addCourse, isInCart } = useCart()
  const { isPurchased } = useLibrary()
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const freeLabel = language === 'tr' ? 'Ücretsiz' : 'Free'

  const handleAddToCart = (courseId: string) => {
    addCourse(courseId)
    navigate(ROUTES.cart)
  }

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>, fallbackImageUrl: string) => {
    const target = event.currentTarget

    if (target.dataset.fallbackApplied === 'true') {
      return
    }

    target.dataset.fallbackApplied = 'true'
    target.src = fallbackImageUrl
  }

  return (
    <ul className="divide-y divide-[color:var(--border)] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
      {courses.map((course) => {
        const inCart = isInCart(course.id)
        const purchased = isPurchased(course.id)
        const fallbackImageUrl = resolveServiceUrl(API_ENDPOINTS.courses.image.public(course.id))
        const courseImageUrl = course.imageUrl || fallbackImageUrl
        const durationLabel = resolveCourseDurationLabel(course, language)

        return (
          <li className="px-4 py-4 md:px-5" key={course.id}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex flex-1 gap-3">
                <Link className="shrink-0" to={ROUTES.courseDetail(course.slug)}>
                  <img
                    alt={course.title}
                    className="h-14 w-[88px] rounded-sm border border-[color:var(--border)] object-cover"
                    loading="lazy"
                    onError={(event) => handleImageError(event, fallbackImageUrl)}
                    src={courseImageUrl}
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge>{getCourseCategoryLabel(course)}</StatusBadge>
                    <StatusBadge>{course.level.levelName}</StatusBadge>
                  </div>
                  <h3 className="theme-heading mt-3 text-base font-semibold leading-6">
                    <Link className="transition-colors hover:text-[color:var(--primary)]" to={ROUTES.courseDetail(course.slug)}>
                      {course.title}
                    </Link>
                  </h3>
                  <p className="theme-muted mt-1.5 flex items-center gap-2 text-sm">
                    <UserRound className="h-4 w-4" />
                    {course.instructor.name}
                  </p>
                  <p className="theme-muted mt-2 text-sm leading-6">{course.summary}</p>
                  <div className="theme-subtle mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {durationLabel}
                    </span>
                    <span>{t('courseCard.lessonsValue', { count: course.lessons })}</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5" />
                      {course.rating}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <UsersRound className="h-3.5 w-3.5" />
                      {course.students}
                    </span>
                  </div>
                </div>
              </div>

              <div className="xl:w-[240px]">
                <p className="theme-heading text-lg font-semibold">
                  {formatCoursePrice(course.price, course.currency, { locale, freeLabel })}
                </p>
                <div className="mt-3 grid gap-2">
                  {purchased ? (
                    <Link to={ROUTES.coursePlayer(course.slug)}>
                      <Button asChild className="w-full justify-center" size="sm">
                        <PlayCircle className="h-4 w-4" />
                        {t('common.watchCourse')}
                      </Button>
                    </Link>
                  ) : inCart ? (
                    <Link to={ROUTES.cart}>
                      <Button asChild className="w-full justify-center" size="sm" variant="secondary">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('common.goToCart')}
                      </Button>
                    </Link>
                  ) : (
                    <Button className="w-full justify-center" onClick={() => handleAddToCart(course.id)} size="sm" variant="secondary">
                      <ShoppingCart className="h-4 w-4" />
                      {t('common.addToCart')}
                    </Button>
                  )}
                  <Link to={ROUTES.courseDetail(course.slug)}>
                    <Button asChild className="w-full justify-center" size="sm" variant="ghost">
                      {t('common.viewDetails')}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default CourseCatalogList

