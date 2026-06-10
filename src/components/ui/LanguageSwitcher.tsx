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
        'language-switcher',
        compact ? 'min-w-[104px]' : 'min-w-[160px]',
      )}
      role="group"
    >
      {!compact ? <Languages className="theme-muted ml-2 h-4 w-4" /> : null}
      <button
        className={cn(
          'language-switcher-option',
          language === 'en' && 'language-switcher-option-active',
          compact && 'flex-1',
        )}
        onClick={() => changeLanguage('en')}
        type="button"
      >
        {compact ? t('language.shortEnglish') : t('language.english')}
      </button>
      <button
        className={cn(
          'language-switcher-option',
          language === 'tr' && 'language-switcher-option-active',
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
