'use client'

import { AlertCircle, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/use-translation'

interface PermissionDeniedProps {
  resource?: string
  action?: string
  message?: string
  onRetry?: () => void
}

export function PermissionDenied({ 
  resource = 'this resource', 
  action = 'access', 
  message,
  onRetry 
}: PermissionDeniedProps) {
  const { t } = useTranslation()
  
  const defaultMessage = message || t('permissions.denied', `You don't have permission to ${action} ${resource}`)

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
        <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h3 className="mt-4 text-lg font-medium text-foreground">
        {t('permissions.accessDenied', 'Access Denied')}
      </h3>
      
      <p className="mt-2 text-sm text-muted-foreground">
        {defaultMessage}
      </p>
      
      <p className="mt-1 text-sm text-muted-foreground">
        {t('permissions.contactAdmin', 'Please contact your administrator if you believe this is an error.')}
      </p>
      
      {onRetry && (
        <div className="mt-6">
          <Button onClick={onRetry} variant="outline">
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      )}
      
      <div className="mt-4 text-xs text-muted-foreground">
        <AlertCircle className="inline h-3 w-3 mr-1" />
        {t('permissions.permissionError', 'Permission Error')}
      </div>
    </div>
  )
}