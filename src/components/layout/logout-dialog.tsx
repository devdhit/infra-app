'use client'

import { useState } from 'react'
import { useLogout } from '@/hooks/useApi'
import { toast } from 'sonner'
import { useTranslation } from '@/hooks/use-translation'
import {
  AlertDialog,  
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import logger from '@/lib/logger';

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const logoutMutation = useLogout()
  const { t } = useTranslation()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logoutMutation.mutateAsync()
      // Clear token from localStorage and API client
      localStorage.removeItem('auth-token')
      // Use window.location for full page redirect to ensure proper navigation
      window.location.href = '/auth/login'
    } catch (error: any) {
      logger.error('Logout error:', error)
      let message = t('auth.logout.error') || 'Failed to logout'
      if (error?.message) {
        message = error.message
      }
      toast.error(message)
    } finally {
      setIsLoggingOut(false)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('auth.logout.confirmTitle') || 'Confirm Logout'}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('auth.logout.confirmDescription') || 'Are you sure you want to logout? You will need to sign in again to access the system.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoggingOut}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (t('auth.logout.loggingOut') || 'Logging out...') : (t('auth.logout_a') || 'Logout')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}