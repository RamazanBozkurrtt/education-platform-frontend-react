import { ArrowRight, Clock3, GraduationCap, Star, UserRound } from 'lucide-react'
import type { SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { resolveServiceUrl } from '../config/api'
import { API_ENDPOINTS } from '../services/endpoints'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { formatCurrency } from '../utils/helpers'
import type { Course } from '../utils/types'

interface CatalogCourseCardProps {
  course: Course
  compact?: boolean
}

const CatalogCourseCard = ({ course, compact = false }: CatalogCourseCardProps) => {
  const { t } = useTranslation()
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
    <article className="public-section-card overflow-hidden rounded-lg">
      <div className="h-1 bg-[color:var(--primary)]" />

      <div className={`grid ${compact ? 'gap-5 p-5' : 'gap-6 p-6 xl:grid-cols-[1.7fr_0.9fr]'}`}>
        <div className="min-w-0">
          <div className={`relative overflow-hidden rounded-md border border-[color:var(--border)] ${compact ? 'aspect-[16/8]' : 'aspect-[16/9]'}`}>
            <img
              alt={course.title}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={handleImageError}
              src={courseImageUrl}
            />
            <div className="theme-overlay pointer-events-none absolute inset-0 opacity-50" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-semibold theme-heading">
              {getCourseCategoryLabel(course)}
            </span>
            <span className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1 text-xs font-medium theme-muted">
              {course.level}
            </span>
          </div>

          <h3 className={`theme-heading mt-4 font-semibold tracking-[-0.03em] ${compact ? 'text-[1.45rem] leading-tight' : 'text-[2rem]'}`}>
            {course.title}
          </h3>

          <p className="theme-muted mt-3 flex items-center gap-2 text-sm">
            <UserRound className="h-4 w-4 text-[color:var(--primary)]" />
            {course.instructor.name}
          </p>

          <p className={`theme-muted mt-3 max-w-2xl text-sm ${compact ? 'text-clamp-2 leading-6' : 'leading-7'}`}>
            {course.summary}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {course.tags.slice(0, compact ? 2 : 3).map((tag) => (
              <span
                className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs theme-muted"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={`rounded-md border border-[color:var(--border)] bg-[color:var(--surface-muted)] ${compact ? 'p-4' : 'p-5'}`}>
          <div className={`grid gap-4 ${compact ? 'sm:grid-cols-3' : 'sm:grid-cols-3 xl:grid-cols-1'}`}>
            <div>
              <p className="theme-subtle text-xs uppercase tracking-[0.18em]">{t('landing.courseStatOne')}</p>
              <p className="theme-heading mt-2 flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="h-4 w-4 text-[color:var(--primary)]" />
                {course.duration}
              </p>
            </div>

            <div>
              <p className="theme-subtle text-xs uppercase tracking-[0.18em]">{t('landing.courseStatTwo')}</p>
              <p className="theme-heading mt-2 flex items-center gap-2 text-sm font-semibold">
                <GraduationCap className="h-4 w-4 text-[color:var(--primary)]" />
                {course.students}
              </p>
            </div>

            <div>
              <p className="theme-subtle text-xs uppercase tracking-[0.18em]">{t('landing.courseStatThree')}</p>
              <p className="theme-heading mt-2 flex items-center gap-2 text-sm font-semibold">
                <Star className="h-4 w-4 text-[color:var(--accent)]" />
                {course.rating}
              </p>
            </div>
          </div>

          <div className={`border-t border-[color:var(--border)] ${compact ? 'mt-4 pt-4' : 'mt-5 pt-5'}`}>
            <p className="theme-subtle text-xs uppercase tracking-[0.18em]">{t('common.price')}</p>
            <p className={`theme-heading mt-2 font-semibold tracking-[-0.03em] ${compact ? 'text-[1.75rem]' : 'text-3xl'}`}>{formatCurrency(course.price)}</p>

            <div className={`mt-4 flex ${compact ? 'flex-col gap-2' : 'flex-col gap-2.5'}`}>
              <Link className="w-full" to={ROUTES.register}>
                <span className={`public-primary-button w-full whitespace-nowrap px-4 text-sm font-semibold ${compact ? 'h-10' : 'h-11'}`}>
                  {t('landing.coursePrimaryCta')}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>

              <Link className="w-full" to={ROUTES.login}>
                <span className={`public-outline-button w-full whitespace-nowrap px-4 text-sm font-semibold ${compact ? 'h-10' : 'h-11'}`}>
                  {t('landing.courseSecondaryCta')}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export default CatalogCourseCard
