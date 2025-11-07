'use client'

import { useCurrentUser } from '@/contexts/current-user-context'
import { usePathname, useRouter } from 'next/navigation'
import { Header } from './header'
import { useEffect, useState } from 'react'
import { navigationMonitor } from '@/lib/navigation-performance'
import logger from '@/lib/logger';
import { api } from '@/lib/api'; // Import the api client

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading, error } = useCurrentUser()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Monitor navigation performance
  useEffect(() => {
    // Only run navigation monitoring in browser environment
    if (typeof window !== 'undefined' && navigationMonitor) {
      // Start timing when pathname changes
      navigationMonitor.startNavigation();
      
      // End timing after a short delay to ensure rendering is complete
      const timer = setTimeout(() => {
        const duration = navigationMonitor.endNavigation(pathname);
        
        // Log slow navigations
        if (duration && duration > 1000) {
          logger.warn(`[PERFORMANCE] Slow navigation detected: ${pathname} took ${duration.toFixed(2)}ms`);
        }
      }, 50); // Small delay to ensure rendering is complete
      
      return () => clearTimeout(timer);
    }
    // Always return a cleanup function or undefined
    return () => {};
  }, [pathname]);

  // Handle authentication state - initialize token from localStorage
  useEffect(() => {
    // Initialize token from localStorage when component mounts
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token');
      if (token) {
        api.setToken(token); // Set token in API client
      }
    }
    
    // Check if we're still in the initial loading phase
    const hasToken = typeof window !== 'undefined' && 
      (localStorage.getItem('auth-token') || api.getToken());
    
    // If there's no token, we're not checking auth
    if (!hasToken) {
      setIsCheckingAuth(false);
      return;
    }
    
    // If we have user data or an error, we're done checking auth
    if (user !== null || error) {
      setIsCheckingAuth(false);
    }
    // Otherwise, we're still checking auth (user is null and no error yet)
  }, [user, error]);

  // Handle token expiration
  useEffect(() => {
    // If we get a 401 error, redirect to login
    if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
      router.push('/auth/login');
      return;
    }
    // Always return a cleanup function or undefined
    return () => {};
  }, [error, router]);

  // Handle authentication redirect
  useEffect(() => {
    // If not authenticated or there's an error, redirect to login
    // But only after we've finished checking auth
    if (!isCheckingAuth && (!user || error) && !isLoading) {
      router.push('/auth/login');
    }
  }, [user, error, isLoading, isCheckingAuth, router]);

  // For auth routes, don't show the navigation layout
  if (pathname.startsWith('/auth/')) {
    return <>{children}</>
  }

  // Show loading state while checking auth
  if (isCheckingAuth || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // If not authenticated or there's an error, show nothing while redirecting
  if (!user || error) {
    return null;
  }

  // If authenticated, show the protected layout without sidebar
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}