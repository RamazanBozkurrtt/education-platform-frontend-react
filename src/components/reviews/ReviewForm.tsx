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
      return mode === 'create' ? 'Gönderiliyor...' : 'Güncelleniyor...'
    }

    return mode === 'create' ? 'Değerlendirme gönder' : 'Değerlendirmeyi güncelle'
  }, [isSubmitting, mode])

  const validate = () => {
    const nextErrors: FormErrors = {}

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      nextErrors.rating = 'Puan 1 ile 5 arasında olmalı.'
    }

    const trimmedComment = comment.trim()

    if (!trimmedComment) {
      nextErrors.comment = 'Yorum boş olamaz.'
    } else if (trimmedComment.length < 5) {
      nextErrors.comment = 'Yorum en az 5 karakter olmalı.'
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
        <p className="text-sm font-medium text-slate-200">Puanın</p>
        <RatingStars readOnly={false} size="lg" value={rating} onChange={(nextRating) => {
          setRating(nextRating)
          setErrors((current) => ({ ...current, rating: undefined }))
        }} />
        {errors.rating ? <p className="mt-2 text-xs text-rose-300">{errors.rating}</p> : null}
      </div>

      <label className="flex flex-col gap-2" htmlFor="review-comment">
        <span className="text-sm font-medium text-slate-200">Yorum</span>
        <textarea
          className="min-h-28 w-full rounded-lg border border-white/10 bg-[color:var(--surface-muted)] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/20"
          id="review-comment"
          maxLength={MAX_COMMENT_LENGTH}
          onChange={(event) => {
            setComment(event.target.value)
            setErrors((current) => ({ ...current, comment: undefined }))
          }}
          placeholder="Deneyimini kısa ve net şekilde yaz"
          value={comment}
        />
        <div className="flex items-center justify-between gap-4">
          {errors.comment ? <p className="text-xs text-rose-300">{errors.comment}</p> : <span />}
          <p className="text-xs text-slate-500">{comment.length}/{MAX_COMMENT_LENGTH}</p>
        </div>
      </label>

      {submitError ? (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
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
