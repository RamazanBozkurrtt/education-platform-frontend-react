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
        <p className="text-sm text-slate-300">Değerlendirmeler yükleniyor...</p>
      </Card>
    )
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <Card>
        <p className="text-lg font-semibold text-white">Değerlendirme özeti</p>
        <p className="mt-3 text-sm text-slate-300">Bu kurs için henüz değerlendirme yapılmamış.</p>
      </Card>
    )
  }

  const averageRating = Number.isFinite(summary.averageRating) ? summary.averageRating : 0

  return (
    <Card>
      <p className="text-lg font-semibold text-white">Değerlendirme özeti</p>
      <div className="mt-5 grid gap-5 md:grid-cols-[200px_minmax(0,1fr)]">
        <div>
          <p className="text-4xl font-semibold text-white">{averageRating.toFixed(1)}</p>
          <RatingStars className="mt-2" readOnly size="md" value={Math.round(averageRating)} />
          <p className="mt-2 text-sm text-slate-400">{summary.totalReviews} değerlendirme</p>
        </div>
        <RatingDistribution distribution={summary.ratingDistribution} totalReviews={summary.totalReviews} />
      </div>
    </Card>
  )
}

export default CourseReviewSummary
