import { ThemeProvider } from '@/components/providers/theme-provider'
import { I18nProvider } from '@/contexts/i18n-context'
import { AuthProvider } from '@/components/providers/auth-provider'
import { CurrentUserProvider } from '@/contexts/current-user-context'
import { SearchContextProvider } from '@/contexts/search-context'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'IT Asset Management System',
  description: 'Comprehensive IT asset management solution',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <I18nProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SearchContextProvider>
              <CurrentUserProvider>
                <AuthProvider>
                  {children}
                  <Toaster />
                </AuthProvider>
              </CurrentUserProvider>
            </SearchContextProvider>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  )
}