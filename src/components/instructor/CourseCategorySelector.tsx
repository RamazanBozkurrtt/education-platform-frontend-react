import Button from '../ui/Button'

interface CategoryOption {
  id: string
  categoryName: string
}

interface CourseCategorySelectorProps {
  label: string
  helperText: string
  selectedSummary: string
  loadingText: string
  emptyStateText: string
  clearLabel: string
  loadFailedText: string
  retryLabel: string
  categories: CategoryOption[]
  selectedIds: string[]
  loading: boolean
  hasLoadError: boolean
  errorMessage?: string
  onChange: (nextIds: string[]) => void
  onRetry: () => void
}

const CourseCategorySelector = ({
  label,
  helperText,
  selectedSummary,
  loadingText,
  emptyStateText,
  clearLabel,
  loadFailedText,
  retryLabel,
  categories,
  selectedIds,
  loading,
  hasLoadError,
  errorMessage,
  onChange,
  onRetry,
}: CourseCategorySelectorProps) => {
  const selectedIdSet = new Set(selectedIds)

  const handleToggle = (categoryId: string) => {
    if (selectedIdSet.has(categoryId)) {
      onChange(selectedIds.filter((id) => id !== categoryId))
      return
    }

    onChange([...selectedIds, categoryId])
  }

  const canClear = selectedIds.length > 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="theme-text text-sm font-medium">{label}</span>
        <span className="theme-subtle text-xs">{selectedSummary}</span>
      </div>

      <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3">
        {loading ? (
          <p className="theme-muted text-sm">{loadingText}</p>
        ) : categories.length === 0 ? (
          <p className="theme-muted text-sm">{emptyStateText}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isSelected = selectedIdSet.has(category.id)

              return (
                <button
                  aria-pressed={isSelected}
                  className={`rounded-[var(--radius-navigation)] border px-3 py-2 text-sm transition ${
                    isSelected
                      ? 'border-[color:var(--primary)] bg-[color:var(--primary)] text-white'
                      : 'border-[color:var(--border)] bg-[color:var(--surface-soft)] theme-text hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
                  }`}
                  key={category.id}
                  onClick={() => handleToggle(category.id)}
                  type="button"
                >
                  {category.categoryName}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="theme-subtle text-xs">{helperText}</span>
        <Button disabled={!canClear} onClick={() => onChange([])} size="sm" type="button" variant="ghost">
          {clearLabel}
        </Button>
      </div>

      {errorMessage ? <span className="text-xs text-[color:var(--danger)]">{errorMessage}</span> : null}

      {hasLoadError ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[color:var(--danger)]">{loadFailedText}</span>
          <Button onClick={onRetry} size="sm" type="button" variant="ghost">
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default CourseCategorySelector
