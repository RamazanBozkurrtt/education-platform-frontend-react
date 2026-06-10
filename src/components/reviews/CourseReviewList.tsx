import Button from '../ui/Button'
import { useLanguage } from '../../hooks/useLanguage'
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
  const { language } = useLanguage()

  if (isLoading) {
    return <p className="theme-muted text-sm">{language === 'tr' ? 'Yorumlar yukleniyor...' : 'Loading reviews...'}</p>
  }

  if (reviews.length === 0) {
    return <p className="theme-muted text-sm">{language === 'tr' ? 'Bu kurs icin henuz degerlendirme yapilmamis.' : 'No reviews yet for this course.'}</p>
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-[color:var(--border)] rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
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
      </div>

      {hasNextPage ? (
        <div className="flex justify-start">
          <Button disabled={isFetchingNextPage} onClick={onLoadMore} type="button" variant="secondary">
            {isFetchingNextPage
              ? (language === 'tr' ? 'Yukleniyor...' : 'Loading...')
              : (language === 'tr' ? 'Daha fazla goster' : 'Show more')}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default CourseReviewList
