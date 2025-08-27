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
      translation = translation.replace(new RegExp(`\\{${index}\\}`, 'g'), String(param))
    })
    return translation
  }
  
  // Return the key if translation is not a string
  return key
}
