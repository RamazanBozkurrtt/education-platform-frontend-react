import InfoBadge from './InfoBadge'

interface TagListProps {
  tags: string[]
  label?: string
  emptyText?: string
  hideWhenEmpty?: boolean
}

const TagList = ({ tags, label, emptyText = 'Etiket eklenmemiş.', hideWhenEmpty = false }: TagListProps) => {
  if (tags.length === 0 && hideWhenEmpty) {
    return null
  }

  return (
    <div className="space-y-2">
      {label ? <p className="text-xs font-medium text-slate-400">{label}</p> : null}
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <InfoBadge key={tag}>{tag}</InfoBadge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">{emptyText}</p>
      )}
    </div>
  )
}

export default TagList
