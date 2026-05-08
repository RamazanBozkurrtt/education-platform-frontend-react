import InfoBadge from './InfoBadge'

interface TagListProps {
  tags: string[]
  label?: string
  emptyText?: string
  hideWhenEmpty?: boolean
}

const TagList = ({ tags, label, emptyText = 'Etiket eklenmemis.', hideWhenEmpty = false }: TagListProps) => {
  if (tags.length === 0 && hideWhenEmpty) {
    return null
  }

  return (
    <div className="space-y-2">
      {label ? <p className="theme-muted text-xs font-medium">{label}</p> : null}
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <InfoBadge key={tag}>{tag}</InfoBadge>
          ))}
        </div>
      ) : (
        <p className="theme-muted text-sm">{emptyText}</p>
      )}
    </div>
  )
}

export default TagList
