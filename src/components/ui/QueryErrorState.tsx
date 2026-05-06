import { normalizeApiError } from '../../shared/errors/normalizeApiError'

interface QueryErrorStateProps {
  error: unknown
  fullScreen?: boolean
}

const QueryErrorState = ({ error, fullScreen = false }: QueryErrorStateProps) => {
  const appError = normalizeApiError(error)

  return (
    <div className={fullScreen ? 'flex min-h-screen items-center justify-center px-4' : 'rounded-2xl border border-rose-400/30 bg-rose-500/10 px-5 py-4'}>
      <p className="max-w-lg text-sm text-rose-200">{appError.message}</p>
    </div>
  )
}

export default QueryErrorState

