import { normalizeApiError } from '../../shared/errors/normalizeApiError'

interface QueryErrorStateProps {
  error: unknown
  fullScreen?: boolean
}

const QueryErrorState = ({ error, fullScreen = false }: QueryErrorStateProps) => {
  const appError = normalizeApiError(error)

  return (
    <div
      role="alert"
      className={
        fullScreen
          ? 'flex min-h-screen items-center justify-center px-4'
          : 'rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft-peach)] px-5 py-4'
      }
    >
      <p className="max-w-lg text-sm text-[color:var(--text-heading)]">{appError.message}</p>
    </div>
  )
}

export default QueryErrorState

