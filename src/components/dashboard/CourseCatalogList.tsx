import { ArrowRight, BookOpen, CheckCircle2, Clock3, PlayCircle, ShoppingCart, Star, UserRound, UsersRound } from 'lucide-react'
import type { SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { resolveServiceUrl } from '../../config/api'
import { useCart } from '../../hooks/useCart'
import { useLanguage } from '../../hooks/useLanguage'
import { useLibrary } from '../../hooks/useLibrary'
import { API_ENDPOINTS } from '../../services/endpoints'
import { ROUTES } from '../../utils/constants'
import { getCourseCategoryLabels } from '../../utils/courseCategory'
import { resolveCourseDurationLabel } from '../../utils/duration'
import { formatCoursePrice, formatStudentCountLabel, parseStudentCount } from '../../utils/helpers'
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
  const copy = language === 'tr'
    ? {
      action: 'Aksiyon',
      available: 'Uygun',
      category: 'Kategori',
      course: 'Kurs',
      enrolled: 'Kayıtlı',
      inCart: 'Sepette',
      instructor: 'Eğitmen',
      level: 'Seviye',
      metrics: 'Detaylar',
      price: 'Fiyat',
      rating: 'Puan',
    }
    : {
      action: 'Action',
      available: 'Available',
      category: 'Category',
      course: 'Course',
      enrolled: 'Enrolled',
      inCart: 'In cart',
      instructor: 'Instructor',
      level: 'Level',
      metrics: 'Details',
      price: 'Price',
      rating: 'Rating',
    }

  const handleAddToCart = (courseId: string) => {
    addCourse(courseId)
    navigate(ROUTES.cart)
  }

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>, fallbackSrc: string) => {
    const target = event.currentTarget

    if (target.dataset.fallbackApplied === 'true') {
      return
    }

    target.dataset.fallbackApplied = 'true'
    target.src = fallbackSrc
  }

  return (
    <div className="overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
      <div className="hidden grid-cols-[minmax(0,1.45fr)_minmax(160px,0.55fr)_minmax(220px,0.75fr)_minmax(120px,0.4fr)_170px] border-b border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3 lg:grid">
        <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.08em]">{copy.course}</p>
        <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.08em]">{copy.category}</p>
        <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.08em]">{copy.metrics}</p>
        <p className="theme-subtle text-xs font-semibold uppercase tracking-[0.08em]">{copy.price}</p>
        <p className="theme-subtle text-right text-xs font-semibold uppercase tracking-[0.08em]">{copy.action}</p>
      </div>

      <div className="divide-y divide-[color:var(--border)]">
        {courses.map((course) => {
          const inCart = isInCart(course.id)
          const purchased = isPurchased(course.id)
          const fallbackImageUrl = resolveServiceUrl(API_ENDPOINTS.courses.image.public(course.id))
          const courseImageUrl = course.imageUrl || fallbackImageUrl
          const durationLabel = resolveCourseDurationLabel(course, language)
          const categoryLabels = getCourseCategoryLabels(course)
          const primaryCategory = categoryLabels[0] ?? 'General'
          const additionalCategoryCount = Math.max(0, categoryLabels.length - 1)
          const statusLabel = purchased ? copy.enrolled : inCart ? copy.inCart : copy.available
          const statusTone = purchased ? 'success' : inCart ? 'warning' : 'default'
          const studentCount = course.studentsCount ?? parseStudentCount(course.students) ?? 0
          const studentLabel = formatStudentCountLabel(studentCount, language)
          const hasRating = (course.ratingCount ?? 0) > 0 || course.rating > 0
          const ratingValue = hasRating ? course.rating.toFixed(1) : (language === 'tr' ? 'Yeni' : 'New')

          return (
            <article
              className="grid gap-4 px-4 py-4 transition-colors hover:bg-[color:var(--surface-hover)] lg:grid-cols-[minmax(0,1.45fr)_minmax(160px,0.55fr)_minmax(220px,0.75fr)_minmax(120px,0.4fr)_170px] lg:items-center"
              key={course.id}
            >
              <div className="flex min-w-0 gap-3">
                <Link
                  aria-label={course.title}
                  className="block h-16 w-24 shrink-0 overflow-hidden rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-strong)] lg:h-[58px] lg:w-[88px]"
                  to={ROUTES.courseDetail(course.slug)}
                >
                  <img
                    alt={course.title}
                    className="block h-full w-full object-cover object-center"
                    decoding="async"
                    loading="lazy"
                    onError={(event) => handleImageError(event, fallbackImageUrl)}
                    src={courseImageUrl}
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
                    <StatusBadge className="normal-case tracking-normal">{course.level.levelName}</StatusBadge>
                  </div>
                  <h3 className="theme-heading mt-2 line-clamp-2 text-base font-semibold leading-6">
                    <Link className="transition-colors hover:text-[color:var(--primary)]" to={ROUTES.courseDetail(course.slug)}>
                      {course.title}
                    </Link>
                  </h3>
                  <p className="theme-muted mt-1 flex items-center gap-1.5 truncate text-xs">
                    <UserRound className="h-3.5 w-3.5 shrink-0" />
                    {copy.instructor}: {course.instructor.name}
                  </p>
                  <p className="theme-subtle mt-1.5 line-clamp-2 text-xs leading-5">{course.summary}</p>
                </div>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-2 lg:block">
                <div>
                  <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.08em] lg:hidden">{copy.category}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5 lg:mt-0">
                    <span className="inline-flex min-h-6 items-center rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2 text-xs font-medium text-[color:var(--text-heading)]">
                      {primaryCategory}
                    </span>
                    {additionalCategoryCount > 0 ? (
                      <span className="inline-flex min-h-6 items-center rounded-sm border border-[color:var(--border)] px-2 text-xs font-medium text-[color:var(--text-muted)]">
                        +{additionalCategoryCount}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="lg:mt-2">
                  <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.08em] lg:hidden">{copy.level}</p>
                  <p className="theme-muted mt-1 truncate text-xs lg:mt-0">{course.level.levelName}</p>
                </div>
              </div>

              <div>
                <p className="theme-subtle mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] lg:hidden">{copy.metrics}</p>
                <div className="grid gap-1.5 text-sm sm:grid-cols-2 lg:grid-cols-1">
                  <p className="theme-muted flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-[color:var(--text-subtle)]" />
                    {durationLabel}
                  </p>
                  <p className="theme-muted flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[color:var(--text-subtle)]" />
                    {t('courseCard.lessonsValue', { count: course.lessons })}
                  </p>
                  <p className="theme-muted flex items-center gap-2">
                    <Star className="h-4 w-4 text-[color:var(--text-subtle)]" />
                    {copy.rating}: {ratingValue}
                  </p>
                  <p className="theme-muted flex items-center gap-2">
                    <UsersRound className="h-4 w-4 text-[color:var(--text-subtle)]" />
                    {studentLabel}
                  </p>
                </div>
              </div>

              <div>
                <p className="theme-subtle mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] lg:hidden">{copy.price}</p>
                <p className="theme-heading text-lg font-semibold leading-tight">
                  {formatCoursePrice(course.price, course.currency, { locale, freeLabel })}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {purchased ? (
                  <Link className="flex-1 sm:flex-none" to={ROUTES.coursePlayer(course.slug)}>
                    <Button asChild className="w-full min-w-[132px] justify-center whitespace-nowrap" size="sm">
                      <PlayCircle className="h-4 w-4" />
                      {t('common.watchCourse')}
                    </Button>
                  </Link>
                ) : inCart ? (
                  <Link className="flex-1 sm:flex-none" to={ROUTES.cart}>
                    <Button asChild className="w-full min-w-[132px] justify-center whitespace-nowrap" size="sm" variant="secondary">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('common.goToCart')}
                    </Button>
                  </Link>
                ) : (
                  <Button className="flex-1 justify-center whitespace-nowrap sm:flex-none lg:min-w-[132px]" onClick={() => handleAddToCart(course.id)} size="sm" variant="secondary">
                    <ShoppingCart className="h-4 w-4" />
                    {t('common.addToCart')}
                  </Button>
                )}

                <Link className="flex-1 sm:flex-none" to={ROUTES.courseDetail(course.slug)}>
                  <Button asChild className="w-full justify-center whitespace-nowrap" size="sm" variant="ghost">
                    {t('common.viewDetails')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default CourseCatalogList
