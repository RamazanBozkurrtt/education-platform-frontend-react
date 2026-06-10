import { MoonStar, SunMedium } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../hooks/useTheme'
import themesIcon from '../../assets/themes.png'
import Button from './Button'

interface ThemeToggleProps {
  compact?: boolean
}

const ThemeToggle = ({ compact = false }: ThemeToggleProps) => {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const [imageFailed, setImageFailed] = useState(false)
  const isDark = theme === 'dark'
  const switchLabel = isDark ? t('theme.switchToLight') : t('theme.switchToDark')
  const modeLabel = isDark ? t('theme.dark') : t('theme.light')

  return (
    <Button
      aria-label={switchLabel}
      aria-pressed={isDark}
      className={compact ? 'h-10 min-w-24 rounded-[var(--radius-navigation)] px-2.5' : undefined}
      onClick={toggleTheme}
      title={switchLabel}
      variant="secondary"
    >
      <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center">
        {!imageFailed ? (
          <img
            alt=""
            aria-hidden
            className="h-6 w-6 object-contain"
            onError={() => setImageFailed(true)}
            src={themesIcon}
          />
        ) : null}
        <span className="absolute inset-0 inline-flex items-center justify-center">
          {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
        </span>
      </span>
      <span className={compact ? 'text-xs font-semibold' : undefined}>{modeLabel}</span>
    </Button>
  )
}

export default ThemeToggle
