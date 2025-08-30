'use client'


import { useCurrentUser } from '@/hooks/useApi'
import { usePathname } from 'next/navigation'
import { Navigation } from './navigation'
import { Header } from './header'

import type { UserRole } from '@/lib/permissions'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()
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

  // If authenticated, show the protected layout with fixed positioning
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Navigation userRole={(user?.role as UserRole) || 'user'} />
      <div className="flex flex-col flex-1 md:ml-64 relative">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <div className="max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}