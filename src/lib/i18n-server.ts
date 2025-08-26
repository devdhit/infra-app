import { cookies, headers } from 'next/headers'
import { Language, supportedLanguages, defaultLanguage } from '@/lib/i18n'

// Get the current language from cookies, headers, or middleware
export async function getCurrentLanguage(): Promise<Language> {
  // Try to get language from cookies first
  const cookieStore = await cookies()
  const langCookie = cookieStore.get('NEXT_LOCALE')
  if (langCookie?.value && supportedLanguages.includes(langCookie.value as Language)) {
    return langCookie.value as Language
  }

  // Try to get language from request headers (set by middleware)
  const headersList = await headers()
  const localeHeader = headersList.get('x-locale')
  if (localeHeader && supportedLanguages.includes(localeHeader as Language)) {
    return localeHeader as Language
  }

  // Try to get language from Accept-Language header
  const acceptLanguage = headersList.get('accept-language')
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',')
    for (const lang of languages) {
      const cleanLang = lang.split(';')[0].trim().toLowerCase()
      if (cleanLang === 'zh-tw' || cleanLang === 'zh-hant') {
        return 'zh-tw'
      }
      if (cleanLang.startsWith('en')) {
        return 'en'
      }
    }
  }

  // Default to English
  return defaultLanguage
}