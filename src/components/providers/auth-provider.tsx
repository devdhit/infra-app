'use client'

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
      // Also redirect to login if accessing root path and not authenticated
      if ((!isAuthenticated && isProtectedRoute) || 
          (!isAuthenticated && pathname === '/')) {
        router.replace('/auth/login');
        return;
      }
      
      // Redirect to dashboard if authenticated and on auth route (except logout)
      if (isAuthRoute && isAuthenticated && pathname !== '/auth/logout') {
        router.replace('/dashboard');
        return;
      }
      
      // Redirect to dashboard if authenticated and on root path
      if (isAuthenticated && pathname === '/') {
        router.replace('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isCheckingAuth, isProtectedRoute, isAuthRoute, router, userLoading, pathname]);

  // If we're still checking auth, show loading spinner
  if (isCheckingAuth || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // For protected routes when authenticated, render children directly
  // The ProtectedLayout component will handle Navigation and Header
  if (isAuthenticated && isProtectedRoute) {
    return <>{children}</>;
  }

  // For all other cases (login page, etc.), just render children
  return <>{children}</>;
}