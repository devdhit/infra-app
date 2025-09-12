'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  X
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface RealTimeNotificationsProps {
  onNotificationChange?: (notifications: Notification[]) => void
}

export function RealTimeNotifications({ onNotificationChange }: RealTimeNotificationsProps) {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isEnabled, setIsEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const getRandomTitle = useCallback((type: string): string => {
    const titles: Record<string, string[]> = {
      info: [
        t('common.info', 'Information'),
        t('dashboard.assetGrowth', 'Asset Growth'),
        t('settings.notifications.title', 'Notification')
      ],
      warning: [
        t('common.warning', 'Warning'),
        t('settings.security.title', 'Security Alert'),
        t('dashboard.licenseExpirations', 'License Expiration')
      ],
      success: [
        t('common.success', 'Success'),
        t('assets.create.success', 'Asset created successfully'),
        t('users.create.success', 'User created successfully')
      ],
      error: [
        t('common.error', 'Error'),
        t('assets.delete.error', 'Failed to delete asset'),
        t('users.delete.error', 'Failed to delete user')
      ]
    }
    
    const options = titles[type] || titles.info
    const selectedOptions = options || []
    if (selectedOptions.length === 0) {
      return 'Notification'
    }
    return selectedOptions[Math.floor(Math.random() * selectedOptions.length)] || 'Notification'
  }, [t])

  const getRandomMessage = useCallback((type: string): string => {
    const messages: Record<string, string[]> = {
      info: [
        t('dashboard.assetGrowthDescription', 'New assets have been added to your inventory'),
        t('dashboard.utilizationDescription', 'Asset utilization has increased by 5%'),
        t('settings.notifications.inApp.description', 'You have a new in-app notification')
      ],
      warning: [
        t('dashboard.licenseExpirationsSoon', 'Several licenses are expiring soon'),
        t('settings.security.twoFactor.description', 'Two-factor authentication is recommended'),
        t('assets.status.repair', 'Multiple assets require maintenance')
      ],
      success: [
        t('assets.import.success', 'Assets imported successfully'),
        t('users.update.success', 'User information updated'),
        t('settings.application.nameUpdated', 'Application settings saved')
      ],
      error: [
        t('dashboard.errorLoading', 'Error loading dashboard data'),
        t('assets.bulkDelete.error', 'Failed to delete multiple assets'),
        t('auth.login.error', 'Authentication failed')
      ]
    }
    
    const options = messages[type] || messages.info
    const selectedOptions = options || []
    if (selectedOptions.length === 0) {
      return 'You have a new notification'
    }
    return selectedOptions[Math.floor(Math.random() * selectedOptions.length)] || 'You have a new notification'
  }, [t])

  // Simulate real-time notifications
  useEffect(() => {
    if (!isEnabled) return

    const interval = setInterval(() => {
      // Simulate receiving a new notification
      const shouldAddNotification = Math.random() > 0.7
      
      if (shouldAddNotification) {
        const types: Array<'info' | 'warning' | 'success' | 'error'> = ['info', 'warning', 'success', 'error']
        const randomIndex = Math.floor(Math.random() * types.length)
        const randomType = types[randomIndex] || 'info'
        
        const newNotification: Notification = {
          id: Math.random().toString(36).substr(2, 9),
          type: randomType,
          title: getRandomTitle(randomType),
          message: getRandomMessage(randomType),
          timestamp: new Date(),
          read: false
        }

        setNotifications(prev => {
          const updated = [newNotification, ...prev.slice(0, 9)] // Keep only last 10 notifications
          const unread = updated.filter(n => !n.read).length
          setUnreadCount(unread)
          
          // Notify parent component if callback provided
          if (onNotificationChange) {
            onNotificationChange(updated)
          }
          
          // Show toast notification
          showToast(newNotification)
          
          return updated
        })
      }
    }, 30000) // Check for new notifications every 30 seconds

    return () => clearInterval(interval)
  }, [isEnabled, onNotificationChange, getRandomMessage, getRandomTitle])

  const showToast = (notification: Notification) => {
    const toastOptions = {
      description: notification.message,
      duration: 5000
    }

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, toastOptions)
        break
      case 'warning':
        toast.warning(notification.title, toastOptions)
        break
      case 'error':
        toast.error(notification.title, toastOptions)
        break
      default:
        toast.info(notification.title, toastOptions)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
    setUnreadCount(0)
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const toggleNotifications = () => {
    setIsEnabled(!isEnabled)
    toast.info(
      isEnabled 
        ? t('settings.notifications.channels.inApp', 'Notifications disabled') 
        : t('settings.notifications.channels.inApp', 'Notifications enabled')
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default'
      case 'warning':
        return 'destructive'
      case 'error':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" disabled={!isEnabled}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <h3 className="font-semibold">{t('settings.notifications.title', 'Notifications')}</h3>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleNotifications}
              className="h-6 px-2"
            >
              {isEnabled ? <BellOff className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
            </Button>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="h-6 px-2"
              >
                {t('common.markAllRead', 'Mark all read')}
              </Button>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('dashboard.noRecentActivities', 'No notifications')}
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className="flex flex-col items-start p-3 focus:bg-accent"
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex w-full items-start justify-between">
                  <div className="flex items-start space-x-2">
                    {getIcon(notification.type)}
                    <div>
                      <div className="font-medium text-sm">{notification.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant={getBadgeVariant(notification.type)} className="h-4 text-xs px-1.5">
                      {notification.type}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.timestamp)}
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="border-t p-2 flex justify-between">
            <Button variant="ghost" size="sm" onClick={clearAll}>
              {t('common.clearAll', 'Clear all')}
            </Button>
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              {t('common.markAllRead', 'Mark all read')}
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}