import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../utils/constants'
import type { AppLanguage } from '../utils/types'

const normalizeLanguage = (language?: string): AppLanguage =>
  language?.startsWith('tr') ? 'tr' : 'en'

export const useLanguage = () => {
  const { i18n } = useTranslation()

  return {
    language: normalizeLanguage(i18n.resolvedLanguage ?? i18n.language),
    changeLanguage: (language: AppLanguage) => void i18n.changeLanguage(language),
    supportedLanguages: SUPPORTED_LANGUAGES,
  }
}
