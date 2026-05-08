import Card from '../ui/Card'
import RatingDistribution from './RatingDistribution'
import RatingStars from './RatingStars'
import type { ReviewSummary } from '../../utils/types'

interface CourseReviewSummaryProps {
  summary?: ReviewSummary
  isLoading?: boolean
}

const CourseReviewSummary = ({ summary, isLoading = false }: CourseReviewSummaryProps) => {
  if (isLoading) {
    return (
      <Card>
        <p className="theme-muted text-sm">Değerlendirmeler yükleniyor...</p>
      </Card>
    )
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <Card>
        <p className="theme-heading text-xl font-semibold">Değerlendirmeler</p>
        <p className="theme-muted mt-3 text-sm">Bu kurs için henüz değerlendirme yapılmamış.</p>
      </Card>
    )
  }

  const averageRating = Number.isFinite(summary.averageRating) ? summary.averageRating : 0

  return (
    <Card>
      <p className="theme-heading text-xl font-semibold">Değerlendirmeler</p>
      <div className="mt-5 grid gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
          <p className="theme-heading text-4xl font-semibold">{averageRating.toFixed(1)}</p>
          <RatingStars className="mt-2" readOnly size="md" value={Math.round(averageRating)} />
          <p className="theme-muted mt-2 text-sm">{summary.totalReviews} değerlendirme</p>
        </div>
        <RatingDistribution distribution={summary.ratingDistribution} totalReviews={summary.totalReviews} />
      </div>
    </Card>
  )
}

export default CourseReviewSummary
