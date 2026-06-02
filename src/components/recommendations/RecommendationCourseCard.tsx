import { ArrowRight, BookOpen, Clock3, Star, WandSparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../utils/constants'
import { formatDuration } from '../../utils/duration'
import type { RecommendationCourse } from '../../utils/types'
import {
  formatRecommendationScore,
  resolveRecommendationThumbnailUrl,
  truncateRecommendationText,
} from '../../utils/recommendations'
import Button from '../ui/Button'
import RecommendationBadges from './RecommendationBadges'

interface RecommendationCourseCardProps {
  item: RecommendationCourse
  language: 'en' | 'tr'
}

const RecommendationCourseCard = ({ item, language }: RecommendationCourseCardProps) => {
  const thumbnailUrl = resolveRecommendationThumbnailUrl(item.thumbnailUrl)
  const scoreLabel = formatRecommendationScore(item.score, language)
  const detailPath = ROUTES.courseDetail(item.courseId)
  const reason = truncateRecommendationText(item.reason, 160)
  const description = truncateRecommendationText(item.description, 140)
  const recommendationDurationSeconds = item.totalDurationSeconds ?? item.totalDuration ?? item.durationSeconds ?? item.duration

  return (
    <article className="flex h-full flex-col rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4">
      {thumbnailUrl ? (
        <Link className="block overflow-hidden rounded-sm border border-[color:var(--border)]" to={detailPath}>
          <img
            alt={item.title}
            className="h-32 w-full object-cover transition-transform duration-200 hover:scale-[1.01]"
            loading="lazy"
            src={thumbnailUrl}
          />
        </Link>
      ) : (
        <div className="h-32 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)]" />
      )}

      <div className="mt-4 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2 py-0.5 text-[11px] font-medium theme-muted">
            {item.category}
          </span>
          <span className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2 py-0.5 text-[11px] font-medium theme-muted">
            {item.level}
          </span>
          {scoreLabel ? (
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2 py-0.5 text-[11px] font-medium theme-muted">
              <WandSparkles className="h-3 w-3" />
              {scoreLabel}
            </span>
          ) : null}
        </div>

        <h3 className="theme-heading mt-3 text-base font-semibold leading-6">
          <Link className="transition-colors hover:text-[color:var(--primary)]" to={detailPath}>
            {item.title}
          </Link>
        </h3>

        {description ? <p className="theme-muted text-clamp-2 mt-2 text-sm leading-6">{description}</p> : null}

        <div className="theme-subtle mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDuration(recommendationDurationSeconds, language)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            {language === 'tr'
              ? `${item.lessonCount} ders`
              : `${item.lessonCount} lessons`}
          </span>
          {typeof item.rating === 'number' ? (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              {item.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>

      {reason ? (
        <div className="mt-3 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2">
          <p className="theme-muted text-sm leading-6">{reason}</p>
        </div>
      ) : null}

      <RecommendationBadges badges={item.badges} />

      <div className="mt-auto pt-4">
        <Link to={detailPath}>
          <Button asChild className="w-full justify-center" size="sm" variant="secondary">
            {language === 'tr' ? 'Incele' : 'View course'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </article>
  )
}

export default RecommendationCourseCard
