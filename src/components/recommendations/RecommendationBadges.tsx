interface RecommendationBadgesProps {
  badges?: string[] | null
}

const RecommendationBadges = ({ badges }: RecommendationBadgesProps) => {
  if (!badges || badges.length === 0) {
    return null
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {badges.slice(0, 4).map((badge) => (
        <span
          className="rounded-[var(--radius-badges)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2.5 py-1 text-[11px] font-medium theme-muted"
          key={badge}
        >
          {badge}
        </span>
      ))}
    </div>
  )
}

export default RecommendationBadges

