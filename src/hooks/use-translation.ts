import { useI18n } from '@/contexts/i18n-context'

export function useTranslation() {
  const { t, language, setLanguage, loading, hasTranslation } = useI18n()
  
  return {
    t,
    language,
    setLanguage,
    loading,
    hasTranslation,
    // Add a function to check if a key exists
    exists: hasTranslation
  }
}