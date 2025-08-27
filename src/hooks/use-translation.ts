import { useI18n } from '@/contexts/i18n-context'
import { Language } from '@/lib/i18n'

export function useTranslation() {
  const { t, language, setLanguage, loading } = useI18n()
  
  return {
    t: t,
    language,
    setLanguage,
    loading,
    // Add a function to check if a key exists
    exists: (key: string): boolean => {
      // Since translations are now loaded asynchronously, we can't check synchronously
      // This would need to be handled differently in components that need this functionality
      return false
    }
  }
}