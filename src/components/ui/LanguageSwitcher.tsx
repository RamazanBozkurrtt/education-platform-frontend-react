import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../hooks/useLanguage'
import { cn } from '../../utils/helpers'

interface LanguageSwitcherProps {
  compact?: boolean
}

const LanguageSwitcher = ({ compact = false }: LanguageSwitcherProps) => {
  const { t } = useTranslation()
  const { changeLanguage, language } = useLanguage()

  return (
    <div
      aria-label={t('language.label')}
      className={cn(
        'theme-surface-muted flex items-center gap-1 rounded-xl border border-white/10 p-1',
        compact ? 'min-w-[108px]' : 'min-w-[160px]',
      )}
      role="group"
    >
      {!compact ? <Languages className="theme-muted ml-2 h-4 w-4" /> : null}
      <button
        className={cn(
          'rounded-lg px-3 py-2 text-xs font-semibold transition',
          language === 'en'
            ? 'bg-sky-600 text-white'
            : 'theme-muted hover:bg-white/6 hover:text-white',
          compact && 'flex-1',
        )}
        onClick={() => changeLanguage('en')}
        type="button"
      >
        {compact ? t('language.shortEnglish') : t('language.english')}
      </button>
      <button
        className={cn(
          'rounded-lg px-3 py-2 text-xs font-semibold transition',
          language === 'tr'
            ? 'bg-sky-600 text-white'
            : 'theme-muted hover:bg-white/6 hover:text-white',
          compact && 'flex-1',
        )}
        onClick={() => changeLanguage('tr')}
        type="button"
      >
        {compact ? t('language.shortTurkish') : t('language.turkish')}
      </button>
    </div>
  )
}

export default LanguageSwitcher
