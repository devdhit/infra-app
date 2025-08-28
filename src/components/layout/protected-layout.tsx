'use client'

import { useEffect } from 'react'
import { useCurrentUser } from '@/hooks/useApi'
import { usePathname } from 'next/navigation'
import { Navigation } from './navigation'
import { Header } from './header'
import { useTranslation } from '@/hooks/use-translation'
import type { UserRole } from '@/lib/permissions'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()
  const { t } = useTranslation()
  const { data: user, isLoading, isError } = useCurrentUser()

  // For auth routes, don't show the navigation layout
  if (pathname.startsWith('/auth/')) {
    return <>{children}</>
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If not authenticated, show nothing (AuthProvider will handle redirect)
  if (!user || isError) {
    return null
  }

  // If authenticated, show the protected layout
  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation userRole={(user?.role as UserRole) || 'user'} />
      <div className="flex flex-col flex-1 md:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}