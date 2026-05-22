import { ArrowRight, Clock3, GraduationCap, Star, UserRound } from 'lucide-react'
import type { SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage'
import { resolveServiceUrl } from '../config/api'
import { API_ENDPOINTS } from '../services/endpoints'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'
import { formatCoursePrice } from '../utils/helpers'
import type { Course } from '../utils/types'

interface CatalogCourseCardProps {
  course: Course
  compact?: boolean
}

const CatalogCourseCard = ({ course, compact = false }: CatalogCourseCardProps) => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const fallbackImageUrl = resolveServiceUrl(API_ENDPOINTS.courses.image.public(course.id))
  const courseImageUrl = course.imageUrl || fallbackImageUrl
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const freeLabel = language === 'tr' ? 'Ücretsiz' : 'Free'

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget

    if (target.dataset.fallbackApplied === 'true') {
      return
    }

    target.dataset.fallbackApplied = 'true'
    target.src = fallbackImageUrl
  }

  const visibleTags = course.tags.slice(0, compact ? 2 : 3)

  return (
    <article className="catalog-course-card">
      <div className="catalog-course-media">
        <img
          alt={course.title}
          loading="lazy"
          onError={handleImageError}
          src={courseImageUrl}
        />
        <div className="catalog-course-overlay" />
      </div>

      <div className="catalog-course-body">
        <div className="catalog-course-top">
          <span className="catalog-course-badge catalog-course-badge-strong">{getCourseCategoryLabel(course)}</span>
          <span className="catalog-course-badge">{course.level.levelName}</span>
        </div>

        <h3 className="catalog-course-title">{course.title}</h3>

        <p className="catalog-course-instructor">
          <UserRound className="h-4 w-4" />
          {course.instructor.name}
        </p>

        <p className={`catalog-course-summary ${compact ? 'text-clamp-2' : ''}`}>{course.summary}</p>

        <div className="catalog-course-tags">
          {visibleTags.map((tag) => (
            <span className="catalog-course-tag" key={tag}>{tag}</span>
          ))}
        </div>

        <div className="catalog-course-meta">
          <span className="catalog-course-meta-item">
            <Clock3 className="h-4 w-4" />
            {course.duration}
          </span>
          <span className="catalog-course-meta-item">
            <GraduationCap className="h-4 w-4" />
            {course.students}
          </span>
          <span className="catalog-course-meta-item catalog-course-meta-item-rating">
            <Star className="h-4 w-4" />
            {course.rating}
          </span>
        </div>

        <div className="catalog-course-footer">
          <div>
            <p className="catalog-course-price-label">{t('common.price')}</p>
            <p className="catalog-course-price">
              {formatCoursePrice(course.price, course.currency, { locale, freeLabel })}
            </p>
          </div>

          <div className="catalog-course-actions">
            <Link to={ROUTES.register}>
              <span className="public-primary-button">
                {t('landing.coursePrimaryCta')}
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <Link to={ROUTES.login}>
              <span className="public-outline-button">
                {t('landing.courseSecondaryCta')}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export default CatalogCourseCard

