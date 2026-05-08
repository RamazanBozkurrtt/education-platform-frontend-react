import { MoonStar, SunMedium } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../hooks/useTheme'
import Button from './Button'

interface ThemeToggleProps {
  compact?: boolean
}

const ThemeToggle = ({ compact = false }: ThemeToggleProps) => {
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      aria-pressed={isDark}
      className={compact ? 'h-10 w-10 rounded-[var(--radius-navigation)] px-0' : undefined}
      onClick={toggleTheme}
      variant="secondary"
    >
      {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
      {compact ? null : <span>{isDark ? t('theme.light') : t('theme.dark')}</span>}
    </Button>
  )
}

export default ThemeToggle
