import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supportedLanguages, defaultLanguage } from '@/lib/i18n'

// Match all request paths except for the ones starting with:
// - api (API routes)
// - _next/static (static files)
// - _next/image (image optimization files)
// - favicon.ico (favicon file)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the pathname already has a locale
  const pathnameHasLocale = supportedLanguages.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  // If the pathname already has a locale, strip it and continue
  if (pathnameHasLocale) {
    const newPath = pathname.replace(/^\/(en|zh-tw)/, '') || '/'
    const response = NextResponse.rewrite(new URL(newPath, request.url))
    // Add the locale to the response headers
    const locale = pathname.split('/')[1]
    response.headers.set('x-locale', locale)
    return response
  }
  
  // Get the preferred language from the Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  let preferredLanguage = defaultLanguage
  
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',')
    for (const lang of languages) {
      const cleanLang = lang.split(';')[0].trim().toLowerCase()
      if (cleanLang === 'zh-tw' || cleanLang === 'zh-hant') {
        preferredLanguage = 'zh-tw'
        break
      }
      if (cleanLang.startsWith('en')) {
        preferredLanguage = 'en'
        break
      }
    }
  }
  
  // Rewrite to the preferred language
  const response = NextResponse.rewrite(new URL(pathname, request.url))
  response.headers.set('x-locale', preferredLanguage)
  return response
}