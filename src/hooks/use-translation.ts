import { useI18n } from '@/contexts/i18n-context'
import { getTranslations, Language } from '@/lib/i18n'

export function useTranslation() {
  const { t, language, setLanguage } = useI18n()
  
  return {
    t: t,
    language,
    setLanguage,
    // Add a function to check if a key exists
    exists: (key: string): boolean => {
      const translations = getTranslations(language as Language)
      return translations[key] !== undefined && translations[key] !== key
    }
  }
}