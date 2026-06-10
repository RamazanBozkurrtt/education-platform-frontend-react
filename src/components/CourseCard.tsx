import { ArrowRight, CheckCircle2, Clock3, PlayCircle, ShoppingCart, Star, UserRound, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLibrary } from '../hooks/useLibrary'
import { useLanguage } from '../hooks/useLanguage'
import { resolveServiceUrl } from '../config/api'
import { API_ENDPOINTS } from '../services/endpoints'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { resolveCourseDurationLabel } from '../utils/duration'
import { formatCoursePrice, formatStudentCountLabel, parseStudentCount } from '../utils/helpers'
import type { Course } from '../utils/types'
import CourseImage from './CourseImage'
import Button from './ui/Button'
import Card from './ui/Card'
import MetaRow from './ui/MetaRow'
import TagList from './ui/TagList'

interface CourseCardProps {
  course: Course
}

const CourseCard = ({ course }: CourseCardProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { addCourse, isInCart } = useCart()
  const { isPurchased } = useLibrary()
  const { language } = useLanguage()
  const inCart = isInCart(course.id)
  const purchased = isPurchased(course.id)
  const fallbackImageUrl = resolveServiceUrl(API_ENDPOINTS.courses.image.public(course.id))
  const courseImageUrl = course.imageUrl || fallbackImageUrl
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const freeLabel = language === 'tr' ? 'Ücretsiz' : 'Free'
  const durationLabel = resolveCourseDurationLabel(course, language)
  const ratingLabel = language === 'tr' ? 'Puan' : 'Rating'
  const studentCount = course.studentsCount ?? parseStudentCount(course.students) ?? 0
  const studentLabel = formatStudentCountLabel(studentCount, language)
  const hasRating = (course.ratingCount ?? 0) > 0 || course.rating > 0
  const ratingValue = hasRating ? course.rating.toFixed(1) : (language === 'tr' ? 'Yeni' : 'New')

  const handleAddToCart = () => {
    addCourse(course.id)
    navigate(ROUTES.cart)
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-medium theme-muted">
          {getCourseCategoryLabel(course)}
        </span>
        <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1 text-xs theme-muted">
          {course.level.levelName}
        </span>
      </div>

      <Link
        aria-label={`${course.title} ${t('common.viewDetails')}`}
        className="mt-4 block overflow-hidden rounded-[var(--radius-navigation)] border border-[color:var(--border)]"
        to={ROUTES.courseDetail(course.slug)}
      >
        <CourseImage
          alt={course.title}
          className="h-44 w-full"
          fit="cover"
          fallbackSrc={fallbackImageUrl}
          src={courseImageUrl}
        />
      </Link>

      <div className="mt-4 min-h-[7.25rem]">
        <h3 className="text-clamp-2 theme-heading text-xl font-semibold leading-7">
          <Link className="transition-colors hover:text-[color:var(--primary)]" to={ROUTES.courseDetail(course.slug)}>
            {course.title}
          </Link>
        </h3>
        <p className="theme-muted mt-2 flex items-center gap-2 text-sm">
          <UserRound className="h-4 w-4 text-[color:var(--text-muted)]" />
          {course.instructor.name}
        </p>
        <p className="text-clamp-2 theme-muted mt-2 text-sm leading-6">{course.summary}</p>
      </div>

      <MetaRow
        className="mt-4"
        items={[
          { key: 'duration', icon: Clock3, label: t('courseDetail.duration'), value: durationLabel },
          { key: 'lessons', label: t('courseDetail.lessons'), value: t('courseCard.lessonsValue', { count: course.lessons }) },
          { key: 'students', icon: UsersRound, label: t('courseDetail.enrolled'), value: studentLabel },
          { key: 'rating', icon: Star, label: ratingLabel, value: ratingValue },
        ]}
      />

      <div className="mt-4 border-t border-[color:var(--border)] pt-4">
        <TagList hideWhenEmpty label="Etiketler" tags={course.tags.slice(0, 3)} />
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-end justify-between gap-4 border-t border-[color:var(--border)] pt-4">
          <div>
            <p className="theme-subtle text-xs">{t('common.price')}</p>
            <p className="theme-heading mt-1 text-2xl font-semibold">
              {formatCoursePrice(course.price, course.currency, { locale, freeLabel })}
            </p>
          </div>
          <p className="theme-muted text-sm">{course.instructor.role}</p>
        </div>

        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {purchased ? (
            <Link className="w-full sm:col-span-2" to={ROUTES.coursePlayer(course.slug)}>
              <Button asChild className="group/cta w-full justify-center">
                <PlayCircle className="h-4 w-4" />
                {t('common.watchCourse')}
              </Button>
            </Link>
          ) : inCart ? (
            <Link className="w-full sm:col-span-2" to={ROUTES.cart}>
              <Button asChild className="group/cta w-full justify-center" variant="secondary">
                <CheckCircle2 className="h-4 w-4 text-[color:var(--text-muted)]" />
                {t('common.goToCart')}
              </Button>
            </Link>
          ) : (
            <Button className="w-full justify-center sm:col-span-2" onClick={handleAddToCart} variant="secondary">
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



