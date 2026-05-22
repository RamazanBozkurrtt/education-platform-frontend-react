import Button from '../ui/Button'

interface LevelOption {
  id: string
  levelName: string
}

interface CourseLevelSelectorProps {
  label: string
  helperText: string
  placeholder: string
  loadingText: string
  emptyStateText: string
  loadFailedText: string
  retryLabel: string
  levels: LevelOption[]
  selectedId: string
  loading: boolean
  hasLoadError: boolean
  errorMessage?: string
  onChange: (nextId: string) => void
  onRetry: () => void
}

const CourseLevelSelector = ({
  label,
  helperText,
  placeholder,
  loadingText,
  emptyStateText,
  loadFailedText,
  retryLabel,
  levels,
  selectedId,
  loading,
  hasLoadError,
  errorMessage,
  onChange,
  onRetry,
}: CourseLevelSelectorProps) => (
  <div className="space-y-2">
    <span className="theme-text text-sm font-medium">{label}</span>

    <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-strong)] p-3">
      {loading ? (
        <p className="theme-muted text-sm">{loadingText}</p>
      ) : levels.length === 0 ? (
        <p className="theme-muted text-sm">{emptyStateText}</p>
      ) : (
        <select
          aria-invalid={Boolean(errorMessage)}
          className="theme-text h-11 w-full rounded-[var(--radius-navigation)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 text-sm focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)]"
          onChange={(event) => onChange(event.target.value)}
          value={selectedId}
        >
          <option value="">{placeholder}</option>
          {levels.map((level) => (
            <option key={level.id} value={level.id}>{level.levelName}</option>
          ))}
        </select>
      )}
    </div>

    <span className="theme-subtle text-xs">{helperText}</span>
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

export default CourseLevelSelector
