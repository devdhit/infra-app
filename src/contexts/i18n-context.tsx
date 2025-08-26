'use client'

import { createContext, useContext } from 'react'
import { Language, supportedLanguages, defaultLanguage, getTranslations } from '@/lib/i18n'

type I18nContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, ...params: (string | number)[]) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode
  initialLanguage?: Language
}) {
  // In a client component, we can't use server functions like getCurrentLanguage
  // So we'll use a simple state-based approach
  const language = initialLanguage || defaultLanguage
  
  const setLanguage = (lang: Language) => {
    // This would typically involve setting a cookie and reloading the page
    // or using a more sophisticated state management solution
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000; SameSite=Lax`
    window.location.reload()
  }
  
  const t = (key: string, ...params: (string | number)[]): string => {
    const translations = getTranslations(language)
    let translation = translations[key] || key
    
    // Replace placeholders {0}, {1}, etc. with provided parameters
    params.forEach((param, index) => {
      translation = translation.replace(new RegExp(`\\{${index}\\}`, 'g'), String(param))
    })
    
    return translation
  }
  
  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
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