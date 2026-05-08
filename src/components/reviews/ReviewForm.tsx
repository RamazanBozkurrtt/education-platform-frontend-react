import { useEffect, useMemo, useState, type FormEvent } from 'react'
import Button from '../ui/Button'
import RatingStars from './RatingStars'
import type { CreateReviewRequest, UpdateReviewRequest } from '../../utils/types'

interface ReviewFormProps {
  mode: 'create' | 'update'
  initialValue?: {
    rating: number
    comment: string
  }
  onSubmit: (payload: CreateReviewRequest | UpdateReviewRequest) => Promise<void>
  isSubmitting?: boolean
  submitError?: string | null
}

interface FormErrors {
  rating?: string
  comment?: string
}

const MAX_COMMENT_LENGTH = 1000

const ReviewForm = ({
  mode,
  initialValue,
  onSubmit,
  isSubmitting = false,
  submitError,
}: ReviewFormProps) => {
  const [rating, setRating] = useState(initialValue?.rating ?? 0)
  const [comment, setComment] = useState(initialValue?.comment ?? '')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setRating(initialValue?.rating ?? 0)
    setComment(initialValue?.comment ?? '')
    setErrors({})
  }, [initialValue?.comment, initialValue?.rating])

  const submitLabel = useMemo(() => {
    if (isSubmitting) {
      return mode === 'create' ? 'Gonderiliyor...' : 'Guncelleniyor...'
    }

    return mode === 'create' ? 'Degerlendirme gonder' : 'Degerlendirmeyi guncelle'
  }, [isSubmitting, mode])

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      nextErrors.rating = 'Puan 1 ile 5 arasinda olmali.'
    }

    const trimmedComment = comment.trim()

    if (!trimmedComment) {
      nextErrors.comment = 'Yorum bos olamaz.'
    } else if (trimmedComment.length < 5) {
      nextErrors.comment = 'Yorum en az 5 karakter olmali.'
    } else if (trimmedComment.length > MAX_COMMENT_LENGTH) {
      nextErrors.comment = `Yorum en fazla ${MAX_COMMENT_LENGTH} karakter olabilir.`
    }

    return nextErrors
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      return
    }

    await onSubmit({ rating, comment: comment.trim() })
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <p className="theme-heading text-sm font-semibold">Puanin</p>
        <RatingStars
          className="mt-1"
          onChange={(nextRating) => {
            setRating(nextRating)
            setErrors((current) => ({ ...current, rating: undefined }))
          }}
          readOnly={false}
          size="lg"
          value={rating}
        />
        {errors.rating ? <p className="mt-2 text-xs text-[color:var(--danger)]">{errors.rating}</p> : null}
      </div>

      <label className="flex flex-col gap-2" htmlFor="review-comment">
        <span className="theme-heading text-sm font-semibold">Yorum</span>
        <textarea
          className="theme-text theme-placeholder min-h-28 w-full rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-3 text-sm outline-none transition focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--focus-ring)]"
          id="review-comment"
          maxLength={MAX_COMMENT_LENGTH}
          onChange={(event) => {
            setComment(event.target.value)
            setErrors((current) => ({ ...current, comment: undefined }))
          }}
          placeholder="Deneyimini kisa ve net sekilde yaz"
          value={comment}
        />
        <div className="flex items-center justify-between gap-4">
          {errors.comment ? <p className="text-xs text-[color:var(--danger)]">{errors.comment}</p> : <span />}
          <p className="theme-subtle text-xs">{comment.length}/{MAX_COMMENT_LENGTH}</p>
        </div>
      </label>

      {submitError ? (
        <div className="rounded-[var(--radius-cards)] border border-[color:var(--danger)]/30 bg-[color:var(--surface-soft-peach)] px-4 py-3 text-sm text-[color:var(--danger)]">
          {submitError}
        </div>
      ) : null}

      <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
        {submitLabel}
      </Button>
    </form>
  )
}

export default ReviewForm
