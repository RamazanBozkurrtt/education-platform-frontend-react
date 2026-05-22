import Button from '../ui/Button'
import RatingStars from './RatingStars'
import { getInitials } from '../../utils/helpers'
import { useLanguage } from '../../hooks/useLanguage'
import type { Review } from '../../utils/types'

interface ReviewItemProps {
  review: Review
  canEdit: boolean
  canDelete: boolean
  onEdit: (review: Review) => void
  onDelete: (review: Review) => void
  isDeleting?: boolean
}

const formatDate = (value: string, locale: string) => {
  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(parsedDate)
}

const ReviewItem = ({ review, canEdit, canDelete, onEdit, onDelete, isDeleting = false }: ReviewItemProps) => {
  const { language } = useLanguage()
  const displayName = review.userDisplayName?.trim() || (language === 'tr' ? 'Kullanici' : 'User')
  const initials = getInitials(displayName)
  const locale = language === 'tr' ? 'tr-TR' : 'en-US'
  const createdAt = formatDate(review.createdAt, locale)
  const updatedAt = formatDate(review.updatedAt, locale)
  const wasUpdated = Boolean(review.updatedAt) && review.updatedAt !== review.createdAt

  return (
    <article className="space-y-3 px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {review.userProfileImageUrl ? (
            <img
              alt={displayName}
              className="h-10 w-10 rounded-full border border-[color:var(--border)] object-cover"
              src={review.userProfileImageUrl}
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-white)] text-xs font-semibold theme-heading">
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="theme-heading truncate text-sm font-semibold">{displayName}</p>
            <p className="theme-muted text-xs">{createdAt}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <RatingStars readOnly size="sm" value={review.rating} />
          <p className="theme-subtle mt-1 text-xs">{review.rating.toFixed(1)} / 5</p>
        </div>
      </div>

      <p className="theme-text whitespace-pre-wrap text-sm leading-6">{review.comment}</p>

      <div className="flex flex-wrap items-center gap-2">
        {wasUpdated ? (
          <span className="rounded-sm border border-[color:var(--border)] px-2.5 py-1 text-xs theme-muted">
            {language === 'tr' ? 'Guncellendi' : 'Updated'} {updatedAt}
          </span>
        ) : null}

        {canEdit ? (
          <Button onClick={() => onEdit(review)} size="sm" type="button" variant="ghost">
            {language === 'tr' ? 'Duzenle' : 'Edit'}
          </Button>
        ) : null}

        {canDelete ? (
          <Button disabled={isDeleting} onClick={() => onDelete(review)} size="sm" type="button" variant="ghost">
            {language === 'tr' ? 'Sil' : 'Delete'}
          </Button>
        ) : null}
      </div>
    </article>
  )
}

export default ReviewItem
