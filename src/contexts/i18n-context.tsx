'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { Language, supportedLanguages, defaultLanguage, getTranslations, t } from '@/lib/i18n'
import { usePathname, useRouter } from 'next/navigation'

type I18nContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, ...params: (string | number)[]) => string
  loading: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode
  initialLanguage?: Language
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage || defaultLanguage)
  const [translations, setTranslations] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  // Load translations when language changes
  useEffect(() => {
    async function loadLanguage() {
      setLoading(true)
      try {
        const loadedTranslations = await getTranslations(language)
        setTranslations(loadedTranslations)
      } catch (error) {
        console.error('Failed to load translations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadLanguage()
  }, [language])

  const setLanguage = (lang: Language) => {
    // Set the language state
    setLanguageState(lang)
    
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`
  }
  
  const translate = (key: string, ...params: (string | number)[]): string => {
    return t(key, translations, ...params)
  }
  
  return (
    <I18nContext.Provider value={{ language, setLanguage, t: translate, loading }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}