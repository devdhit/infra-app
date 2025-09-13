'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { useWebSocketContext } from '@/contexts/websocket-context'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  category?: string
  modelType?: string
  action?: string
  uniqueKey?: string  // Add uniqueKey property
}

interface RealTimeNotificationsProps {
  onNotificationChange?: (notifications: Notification[]) => void
}

export function RealTimeNotifications({ onNotificationChange }: RealTimeNotificationsProps) {
  const { t } = useTranslation()
  const { assetUpdates, auditLogs } = useWebSocketContext()  // Get auditLogs from context
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isEnabled, setIsEnabled] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  // Remove local auditLogs state since we're using the context

  // Convert audit logs to notifications
  const auditLogNotifications = useMemo(() => {
    return auditLogs.map(log => {
      const action = log.action.toLowerCase()
      let type: 'info' | 'warning' | 'success' | 'error' = 'info'
      let title = ''
      let message = ''
      
      // Determine notification type based on action
      switch (action) {
        case 'create':
          type = 'success'
          break
        case 'update':
          type = 'info'
          break
        case 'delete':
          type = 'warning'
          break
        case 'login':
        case 'logout':
          type = 'info'
          break
        default:
          type = 'info'
      }
      
      // Get model-specific icon and title
      const modelType = log.modelType.toLowerCase()
      
      switch (modelType) {
        case 'user':
          title = t('users.title', 'User')
          break
        case 'tenant':
          title = t('tenants.title', 'Tenant')
          break
        case 'pc':
          title = t('assets.pc.title', 'PC')
          break
        case 'laptop':
          title = t('assets.laptop.title', 'Laptop')
          break
        case 'printer':
          title = t('assets.printer.title', 'Printer')
          break
        case 'license':
          title = t('assets.license.title', 'License')
          break
        case 'warehouseit':
          title = t('assets.warehouse.title', 'Warehouse IT')
          break
        case 'internet':
          title = t('assets.internet.title', 'Internet')
          break
        case 'role':
          title = t('roles.title', 'Role')
          break
        default:
          title = log.modelType
      }
      
      // Create message based on action
      const user = log.user?.name || t('common.unknownUser', 'Unknown User')
      const actionText = t(`common.actions.${action}`, action)
      
      // Format message with parameters: {0} = user, {1} = action, {2} = model
      message = t('notifications.auditLogMessage', '{0} {1} {2}', user, actionText, title)
      
      return {
        id: log.id,
        type,
        title: t('notifications.auditLogTitle', 'Audit Log'),
        message,
        timestamp: new Date(log.createdAt),
        read: false,
        category: 'audit',
        modelType: log.modelType,
        action: log.action
      }
    })
  }, [auditLogs, t])

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

  // Handle real-time asset updates from WebSocket
  useEffect(() => {
    if (!isEnabled || assetUpdates.length === 0) return

    const newNotifications: Notification[] = assetUpdates.map(update => {
      const action = update.type || update.action || 'update'
      let type: 'info' | 'warning' | 'success' | 'error' = 'info'
      
      switch (action.toLowerCase()) {
        case 'asset_created':
        case 'create':
          type = 'success'
          break
        case 'asset_updated':
        case 'update':
          type = 'info'
          break
        case 'asset_deleted':
        case 'delete':
          type = 'warning'
          break
        default:
          type = 'info'
      }
      
      return {
        id: update.id || Math.random().toString(36).substr(2, 9),
        type,
        title: getRandomTitle(type),
        message: update.payload?.name || update.data?.name || t('notifications.assetUpdate', 'Asset updated'),
        timestamp: new Date(update.timestamp || Date.now()),
        read: false,
        category: 'asset'
      }
    })

    setNotifications(prev => {
      const updated = [...newNotifications, ...prev].slice(0, 20) // Keep only last 20 notifications
      const unread = updated.filter(n => !n.read).length
      setUnreadCount(unread)
      
      // Notify parent component if callback provided
      if (onNotificationChange) {
        onNotificationChange(updated)
      }
      
      // Show toast notifications for new updates
      newNotifications.forEach(notification => {
        showToast(notification)
      })
      
      return updated
    })
  }, [assetUpdates, isEnabled, onNotificationChange, getRandomTitle, t])

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
          read: false,
          category: 'system'
        }

        setNotifications(prev => {
          const updated = [newNotification, ...prev.slice(0, 19)] // Keep only last 20 notifications
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

  // Combine all notifications (audit logs + system notifications)
  const allNotifications = useMemo(() => {
    // Combine audit log notifications with system notifications
    const combined = [...auditLogNotifications, ...notifications]
    
    // Ensure all notifications have unique keys
    const uniqueNotifications = combined.map((notification, index) => ({
      ...notification,
      // Create a unique key by combining the original ID with a prefix and index
      uniqueKey: `${notification.category || 'system'}-${notification.id || index}-${index}`
    }))
    
    // Sort by timestamp (newest first)
    return uniqueNotifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 20) // Keep only the 20 most recent
  }, [auditLogNotifications, notifications])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" disabled={!isEnabled}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              data-testid="notification-badge"
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
            {allNotifications.length > 0 && (
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
          {allNotifications.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('dashboard.noRecentActivities', 'No notifications')}
            </div>
          ) : (
            allNotifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.uniqueKey || notification.id} 
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
        
        {allNotifications.length > 0 && (
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