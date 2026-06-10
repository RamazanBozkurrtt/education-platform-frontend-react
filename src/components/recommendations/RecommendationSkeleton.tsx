interface RecommendationSkeletonProps {
  count?: number
  message?: string
}

const RecommendationSkeleton = ({ count = 3, message }: RecommendationSkeletonProps) => (
  <div className="space-y-4">
    {message ? (
      <div
        aria-live="polite"
        className="flex flex-col items-center justify-center gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-4 py-6 text-center sm:flex-row sm:text-left"
        role="status"
      >
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <span className="absolute h-12 w-12 animate-ping rounded-full bg-[color:var(--primary)]/15" />
          <span className="absolute h-9 w-9 rounded-full border border-[color:var(--primary)]/25" />
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--primary)]" />
        </span>
        <span className="min-w-0">
          <span className="theme-heading block text-sm font-semibold">{message}</span>
          <span className="mt-2 flex justify-center gap-1 sm:justify-start" aria-hidden="true">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--primary)] [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--primary)] [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--primary)]" />
          </span>
        </span>
      </div>
    ) : null}

    <div aria-hidden="true" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
  </div>
)

export default RecommendationSkeleton

