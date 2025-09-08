'use client'

import { useCurrentUser } from '@/hooks/useApi'
import { usePathname } from 'next/navigation'
import { Navigation } from './navigation'
import { Header } from './header'
import { useEffect } from 'react'
import { navigationMonitor } from '@/lib/navigation-performance'

import type { UserRole } from '@/types/users'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()
  const { data: user, isLoading, isError } = useCurrentUser()

  // Get user role for navigation
  const userRole = (user?.role as { name: string })?.name as UserRole || 'user';

  // Monitor navigation performance
  useEffect(() => {
    // Start timing when pathname changes
    navigationMonitor.startNavigation();
    
    // End timing after a short delay to ensure rendering is complete
    const timer = setTimeout(() => {
      const duration = navigationMonitor.endNavigation(pathname);
      
      // Log slow navigations
      if (duration && duration > 1000) {
        console.warn(`[PERFORMANCE] Slow navigation detected: ${pathname} took ${duration.toFixed(2)}ms`);
      }
    }, 50); // Small delay to ensure rendering is complete
    
    return () => clearTimeout(timer);
  }, [pathname]);

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
      <Navigation userRole={userRole} />
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