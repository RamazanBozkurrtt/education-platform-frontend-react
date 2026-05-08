import { cn } from '../../utils/helpers'
import { useTranslation } from 'react-i18next'

interface LoaderProps {
  label?: string
  fullScreen?: boolean
}

const Loader = ({ fullScreen = false, label }: LoaderProps) => {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'theme-text flex items-center justify-center gap-3',
        fullScreen ? 'min-h-screen flex-col bg-[color:var(--bg)]/90 px-4' : 'py-20',
      )}
    >
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--primary)]" />
      <span className="theme-muted text-sm font-medium">{label ?? t('loader.default')}</span>
    </div>
  )
}

export default Loader
