import RatingDistribution from './RatingDistribution'
import RatingStars from './RatingStars'
import { useLanguage } from '../../hooks/useLanguage'
import type { ReviewSummary } from '../../utils/types'

interface CourseReviewSummaryProps {
  summary?: ReviewSummary
  isLoading?: boolean
}

const CourseReviewSummary = ({ summary, isLoading = false }: CourseReviewSummaryProps) => {
  const { language } = useLanguage()

  const copy = language === 'tr'
    ? {
      title: 'Degerlendirmeler',
      loading: 'Degerlendirmeler yukleniyor...',
      empty: 'Bu kurs icin henuz degerlendirme yapilmamis.',
      totalLabel: 'degerlendirme',
    }
    : {
      title: 'Reviews',
      loading: 'Loading reviews...',
      empty: 'No reviews have been posted for this course yet.',
      totalLabel: 'reviews',
    }

  if (isLoading) {
    return (
      <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-4">
        <p className="theme-muted text-sm">{copy.loading}</p>
      </div>
    )
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-4">
        <p className="theme-heading text-sm font-semibold">{copy.title}</p>
        <p className="theme-muted mt-2 text-sm">{copy.empty}</p>
      </div>
    )
  }

  const averageRating = Number.isFinite(summary.averageRating) ? summary.averageRating : 0

  return (
    <div className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-4">
      <p className="theme-heading text-sm font-semibold">{copy.title}</p>
      <div className="mt-4 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="theme-heading text-3xl font-semibold leading-none">{averageRating.toFixed(1)}</p>
            <p className="theme-subtle mt-1 text-xs">/ 5</p>
          </div>
          <div className="text-right">
            <RatingStars className="justify-end" readOnly size="sm" value={Math.round(averageRating)} />
            <p className="theme-muted mt-1 text-xs">{summary.totalReviews} {copy.totalLabel}</p>
          </div>
        </div>
        <RatingDistribution distribution={summary.ratingDistribution} totalReviews={summary.totalReviews} />
      </div>
    </div>
  )
}

export default CourseReviewSummary
