'use client'

import { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import { useCurrentUser as useCurrentUserHook } from '@/hooks/useApi'
import logger from '@/lib/logger'

interface CurrentUserContextType {
  user: any
  isLoading: boolean
  error: any
  refetch: () => void
  data: any // Add data property to match expected interface
}

const CurrentUserContext = createContext<CurrentUserContextType | undefined>(undefined)

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, error, refetch } = useCurrentUserHook()
  const [initialized, setInitialized] = useState(false)

  // Log when user data changes for debugging
  useEffect(() => {
    if (user && !initialized) {
      logger.debug('CurrentUserProvider: User data initialized', { userId: user?.id })
      setInitialized(true)
    }
  }, [user, initialized])

  return (
    <CurrentUserContext.Provider value={{ user, data: user, isLoading, error, refetch }}>
      {children}
    </CurrentUserContext.Provider>
  )
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext)
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a CurrentUserProvider')
  }
  return context
}