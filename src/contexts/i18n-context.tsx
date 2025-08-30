'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Language, defaultLanguage, getTranslations, translate as translateFunction, hasTranslation } from '@/lib/i18n'

type I18nContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, fallback?: string, ...params: (string | number)[]) => string
  hasTranslation: (key: string) => boolean
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

  const setLanguage = useCallback((lang: Language) => {
    // Set the language state
    setLanguageState(lang)
    
    // Set cookie for persistence
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`
  }, [])

  const translate = useCallback((key: string, fallback?: string, ...params: (string | number)[]): string => {
    return translateFunction(key, translations, fallback || key, ...params)
  }, [translations])

  const checkTranslation = useCallback((key: string): boolean => {
    return hasTranslation(key, translations)
  }, [translations])
  
  return (
    <I18nContext.Provider value={{ 
      language, 
      setLanguage, 
      t: translate, 
      hasTranslation: checkTranslation,
      loading 
    }}>
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