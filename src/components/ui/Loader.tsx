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
        fullScreen ? 'theme-overlay min-h-screen flex-col' : 'py-20',
      )}
    >
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan-300" />
      <span className="theme-muted text-sm font-medium">{label ?? t('loader.default')}</span>
    </div>
  )
}

export default Loader
