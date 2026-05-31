interface RecommendationSkeletonProps {
  count?: number
}

const RecommendationSkeleton = ({ count = 3 }: RecommendationSkeletonProps) => (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: count }).map((_, index) => (
      <div
        className="animate-pulse rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-4"
        key={`recommendation-skeleton-${index}`}
      >
        <div className="h-32 rounded-sm bg-[color:var(--surface-soft)]" />
        <div className="mt-4 h-4 w-2/3 rounded bg-[color:var(--surface-soft)]" />
        <div className="mt-2 h-3 w-5/6 rounded bg-[color:var(--surface-soft)]" />
        <div className="mt-4 h-3 w-full rounded bg-[color:var(--surface-soft)]" />
        <div className="mt-2 h-3 w-4/5 rounded bg-[color:var(--surface-soft)]" />
        <div className="mt-4 h-9 w-28 rounded bg-[color:var(--surface-soft)]" />
      </div>
    ))}
  </div>
)

export default RecommendationSkeleton

