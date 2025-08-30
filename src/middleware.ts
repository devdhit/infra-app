import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { defaultLanguage } from '@/lib/i18n'

// Match all request paths except for the ones starting with:
// - api (API routes)
// - _next/static (static files)
// - _next/image (image optimization files)
// - favicon.ico (favicon file)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}

export function middleware(request: NextRequest) {
  
  // Get the preferred language from the Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  let preferredLanguage = defaultLanguage
  
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',')
    for (const lang of languages) {
      const parts = lang.split(';')
      if (parts.length > 0 && parts[0] !== undefined) {
        const cleanLang = parts[0].trim().toLowerCase()
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
  }
  
  // Rewrite to the preferred language without changing the URL
  const response = NextResponse.next()
  response.headers.set('x-locale', preferredLanguage)
  return response
}