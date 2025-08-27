'use client'

import { Navigation } from "@/components/layout/navigation";
import { Header } from "@/components/layout/header";
import { ReactNode, useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useApi";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { data: user, isLoading: userLoading, isError, status } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Determine if current path is a protected route
  const isProtectedRoute = ['/dashboard', '/assets', '/users', '/tenants', '/settings'].some(route => 
    pathname?.startsWith(route)
  );

  // Determine if current path is an auth route
  const isAuthRoute = pathname?.startsWith('/auth');

  // Initial auth check from localStorage
  useEffect(() => {
    // Check if user is authenticated by looking for token
    const token = localStorage.getItem('auth-token') || api.getToken();
    if (token) {
      // Set token in API client to ensure all requests include it
      api.setToken(token);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
    setIsCheckingAuth(false);
  }, []);

  // Update auth state based on API response
  useEffect(() => {
    // Only update state if we've finished checking local storage
    if (!isCheckingAuth) {
      if (status === 'success' && user) {
        setIsAuthenticated(true);
      } else if (status === 'error') {
        setIsAuthenticated(false);
        // Clear token if it's invalid
        localStorage.removeItem('auth-token');
        api.setToken(null);
      }
    }
  }, [user, status, isCheckingAuth]);

  // Handle redirects based on auth state
  useEffect(() => {
    // Only redirect after initial auth check is complete
    if (!isCheckingAuth && !userLoading) {
      // Redirect to login if not authenticated and trying to access protected routes
      if (isProtectedRoute && !isAuthenticated) {
        router.push('/auth/login');
      }
      
      // Redirect to dashboard if authenticated and on auth route
      if (isAuthRoute && isAuthenticated) {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isCheckingAuth, isProtectedRoute, isAuthRoute, router, userLoading]);

  // If we're still checking auth, show loading spinner
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // For protected routes when authenticated, show with Navigation and Header
  if (isAuthenticated && isProtectedRoute) {
    return (
      <div className="flex h-screen">
        <Navigation />
        <div className="flex flex-col flex-1 md:ml-64">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // For all other cases (login page, etc.), just render children without Navigation
  return <>{children}</>;
}