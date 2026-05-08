interface RatingDistributionProps {
  distribution: Record<string, number>
  totalReviews: number
}

const RatingDistribution = ({ distribution, totalReviews }: RatingDistributionProps) => (
  <div className="space-y-2">
    {[5, 4, 3, 2, 1].map((rating) => {
      const count = distribution[String(rating)] ?? 0
      const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0

      return (
        <div className="flex items-center gap-3" key={rating}>
          <span className="w-8 text-sm text-slate-300">{rating}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800/70">
            <div className="h-full rounded-full bg-amber-300" style={{ width: `${percentage}%` }} />
          </div>
          <span className="w-16 text-right text-xs text-slate-400">{count} ({percentage}%)</span>
        </div>
      )
    })}
  </div>
)

export default RatingDistribution
