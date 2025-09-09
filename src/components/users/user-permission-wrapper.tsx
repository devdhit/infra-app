'use client'

import { ReactNode, useEffect, useState } from 'react'
import { PermissionDenied } from '@/components/ui/permission-denied'
import { Skeleton } from '@/components/ui/skeleton'

interface UserPermissionWrapperProps {
  requiredPermission: () => Promise<boolean>
  resource: string
  action: string
  children: ReactNode
  fallback?: ReactNode
}

export function UserPermissionWrapper({ 
  requiredPermission, 
  resource, 
  action, 
  children,
  fallback 
}: UserPermissionWrapperProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<boolean>(false)

  useEffect(() => {
    let isMounted = true
    
    const checkPermission = async () => {
      try {
        const result = await requiredPermission()
        if (isMounted) {
          setHasPermission(result)
          setError(false)
        }
      } catch (err) {
        if (isMounted) {
          setHasPermission(false)
          setError(true)
        }
      }
    }

    checkPermission()

    return () => {
      isMounted = false
    }
  }, [requiredPermission])

  // Show skeleton while loading
  if (hasPermission === null) {
    return fallback || <Skeleton className="w-full h-64" />
  }

  // Show permission denied if user doesn't have permission
  if (!hasPermission) {
    return (
      <PermissionDenied 
        resource={resource}
        action={action}
        message={error ? undefined : `You don't have permission to ${action} ${resource}`}
      />
    )
  }

  // Show children if user has permission
  return <>{children}</>
}