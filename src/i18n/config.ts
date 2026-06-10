import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { LANGUAGE_STORAGE_KEY, LEGACY_LANGUAGE_STORAGE_KEY } from '../utils/constants'
import { resources } from './resources'

try {
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  const legacyLanguage = localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY)

  if (!storedLanguage && legacyLanguage) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, legacyLanguage)
    localStorage.removeItem(LEGACY_LANGUAGE_STORAGE_KEY)
  }
} catch {
  // Ignore storage errors and let language detection fall back naturally.
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'tr'],
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  })

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language.startsWith('tr') ? 'tr' : 'en'
})

export default i18n
