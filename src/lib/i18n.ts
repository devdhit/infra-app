// Define our supported languages
export type Language = 'en' | 'zh-tw'
export const supportedLanguages: Language[] = ['en', 'zh-tw']

// Default language
export const defaultLanguage: Language = 'en'

// Function to dynamically import translation files
async function loadTranslations(lang: Language) {
  try {
    const translations = await import(`@/locales/${lang}.json`)
    return translations.default
  } catch (error) {
    console.warn(`Failed to load translations for ${lang}, falling back to default`)
    try {
      const defaultTranslations = await import(`@/locales/${defaultLanguage}.json`)
      return defaultTranslations.default
    } catch (defaultError) {
      console.error('Failed to load default translations', defaultError)
      return {}
    }
  }
}

// Get all translations for a language
export async function getTranslations(lang?: Language) {
  const currentLang = lang || defaultLanguage
  return await loadTranslations(currentLang)
}

// Get translation for a key with optional parameters
export function t(key: string, translations: Record<string, any>, ...params: (string | number)[]): string {
  // Navigate through the translation object using the key path
  const keyParts = key.split('.')
  let translation: any = translations
  
  for (const part of keyParts) {
    if (translation && typeof translation === 'object' && part in translation) {
      translation = translation[part]
    } else {
      // Return the key if translation not found
      return key
    }
  }
  
  // If we found a translation string, process parameters
  if (typeof translation === 'string') {
    // Replace placeholders {0}, {1}, etc. with provided parameters
    params.forEach((param, index) => {
      // Escape special regex characters in param
      const escapedParam = String(param).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      translation = translation.replace(new RegExp(`\\{${index}\\}`, 'g'), escapedParam)
    })
    return translation
  }
  
  // Return the key if translation is not a string
  return key
}

// Enhanced translation function with fallback and error handling
export function translate(
  key: string, 
  translations: Record<string, any>, 
  fallback: string = key,
  ...params: (string | number)[]
): string {
  try {
    // Navigate through the translation object using the key path
    const keyParts = key.split('.')
    let translation: any = translations
    
    for (const part of keyParts) {
      if (translation && typeof translation === 'object' && part in translation) {
        translation = translation[part]
      } else {
        // Return fallback if translation not found
        return processParams(fallback, params)
      }
    }
    
    // If we found a translation string, process parameters
    if (typeof translation === 'string') {
      return processParams(translation, params)
    }
    
    // Return fallback if translation is not a string
    return processParams(fallback, params)
  } catch (error) {
    console.error(`Error translating key "${key}":`, error)
    return processParams(fallback, params)
  }
}

// Helper function to process parameters in translation strings
function processParams(template: string, params: (string | number)[]): string {
  if (!params || params.length === 0) {
    return template
  }
  
  let result = template
  params.forEach((param, index) => {
    // Escape special regex characters in param
    const escapedParam = String(param).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), escapedParam)
  })
  
  return result
}

// Function to check if a translation key exists
export function hasTranslation(key: string, translations: Record<string, any>): boolean {
  try {
    const keyParts = key.split('.')
    let translation: any = translations
    
    for (const part of keyParts) {
      if (translation && typeof translation === 'object' && part in translation) {
        translation = translation[part]
      } else {
        return false
      }
    }
    
    return typeof translation === 'string'
  } catch (error) {
    return false
  }
}

// Function to get application name from localStorage or default
export function getApplicationName(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('applicationName') || 'IT Asset Management';
  }
  return 'IT Asset Management';
}

// Function to set application name in localStorage
export function setApplicationName(name: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('applicationName', name);
  }
}
