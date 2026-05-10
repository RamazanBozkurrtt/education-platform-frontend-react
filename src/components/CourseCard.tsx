import { ArrowRight, CheckCircle2, Clock3, PlayCircle, ShoppingCart, Star, UserRound } from 'lucide-react'
import type { SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
import { resolveServiceUrl } from '../config/api'
import { API_ENDPOINTS } from '../services/endpoints'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { formatCurrency } from '../utils/helpers'
import type { Course } from '../utils/types'
import Button from './ui/Button'
import Card from './ui/Card'
import MetaRow from './ui/MetaRow'
import TagList from './ui/TagList'

interface CourseCardProps {
  course: Course
}

const CourseCard = ({ course }: CourseCardProps) => {
  const { t } = useTranslation()
  const { addCourse, isInCart } = useCart()
  const { isPurchased } = useLibrary()
  const inCart = isInCart(course.id)
  const purchased = isPurchased(course.id)
  const fallbackImageUrl = resolveServiceUrl(API_ENDPOINTS.courses.image.public(course.id))
  const courseImageUrl = course.imageUrl || fallbackImageUrl

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget

    if (target.dataset.fallbackApplied === 'true') {
      return
    }

    target.dataset.fallbackApplied = 'true'
    target.src = fallbackImageUrl
  }

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-medium theme-muted">
          {getCourseCategoryLabel(course)}
        </span>
        <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs theme-muted">
          {course.level}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[var(--radius-navigation)] border border-[color:var(--border)]">
        <img
          alt={course.title}
          className="h-44 w-full object-cover"
          loading="lazy"
          onError={handleImageError}
          src={courseImageUrl}
        />
      </div>

      <div className="mt-4 min-h-[7rem]">
        <h3 className="text-clamp-2 theme-heading text-xl font-semibold leading-7">{course.title}</h3>
        <p className="theme-muted mt-2 flex items-center gap-2 text-sm">
          <UserRound className="h-4 w-4 text-[color:var(--text-muted)]" />
          {course.instructor.name}
        </p>
        <p className="text-clamp-2 theme-muted mt-2 text-sm leading-6">{course.summary}</p>
      </div>

      <MetaRow
        className="mt-4"
        items={[
          { key: 'duration', icon: Clock3, label: t('courseDetail.duration'), value: course.duration },
          { key: 'lessons', label: t('courseDetail.lessons'), value: t('courseCard.lessonsValue', { count: course.lessons }) },
          { key: 'rating', icon: Star, label: 'Puan', value: String(course.rating) },
        ]}
      />

      <div className="mt-4 border-t border-[color:var(--border)] pt-4">
        <TagList hideWhenEmpty label="Etiketler" tags={course.tags.slice(0, 3)} />
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-4 border-t border-[color:var(--border)] pt-4">
          <div>
            <p className="theme-subtle text-xs">{t('common.price')}</p>
            <p className="theme-heading mt-1 text-2xl font-semibold">{formatCurrency(course.price)}</p>
          </div>
          <p className="theme-muted text-sm">{course.instructor.role}</p>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {purchased ? (
            <Link className="w-full" to={ROUTES.coursePlayer(course.slug)}>
              <Button asChild className="group/cta w-full justify-center">
                <PlayCircle className="h-4 w-4" />
                {t('common.watchCourse')}
              </Button>
            </Link>
          ) : inCart ? (
            <Link className="w-full" to={ROUTES.cart}>
              <Button asChild className="group/cta w-full justify-center" variant="secondary">
                <CheckCircle2 className="h-4 w-4 text-[color:var(--text-muted)]" />
                {t('common.goToCart')}
              </Button>
            </Link>
          ) : (
            <Button className="w-full justify-center" onClick={() => addCourse(course.id)} variant="secondary">
              <ShoppingCart className="h-4 w-4" />
              {t('common.addToCart')}
            </Button>
          )}
          <Link className="w-full" to={ROUTES.courseDetail(course.slug)}>
            <Button asChild className="group/cta w-full justify-center" variant="ghost">
              {t('common.viewDetails')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

export default CourseCard
