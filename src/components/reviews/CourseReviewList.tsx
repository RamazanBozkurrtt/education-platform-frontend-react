import Button from '../ui/Button'
import ReviewItem from './ReviewItem'
import type { Review } from '../../utils/types'

interface CourseReviewListProps {
  reviews: Review[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isLoading: boolean
  onLoadMore: () => void
  canDeleteReview: (review: Review) => boolean
  canEditReview: (review: Review) => boolean
  onEditReview: (review: Review) => void
  onDeleteReview: (review: Review) => void
  deletingReviewId?: string | null
}

const CourseReviewList = ({
  reviews,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  onLoadMore,
  canDeleteReview,
  canEditReview,
  onEditReview,
  onDeleteReview,
  deletingReviewId,
}: CourseReviewListProps) => {
  if (isLoading) {
    return <p className="theme-muted text-sm">Yorumlar yukleniyor...</p>
  }

  if (reviews.length === 0) {
    return <p className="theme-muted text-sm">Bu kurs için henüz değerlendirme yapılmamış.</p>
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewItem
          canDelete={canDeleteReview(review)}
          canEdit={canEditReview(review)}
          isDeleting={deletingReviewId === review.id}
          key={review.id}
          onDelete={onDeleteReview}
          onEdit={onEditReview}
          review={review}
        />
      ))}

      {hasNextPage ? (
        <Button disabled={isFetchingNextPage} onClick={onLoadMore} type="button" variant="secondary">
          {isFetchingNextPage ? 'Yukleniyor...' : 'Daha fazla goster'}
        </Button>
      ) : null}
    </div>
  )
}

export default CourseReviewList
