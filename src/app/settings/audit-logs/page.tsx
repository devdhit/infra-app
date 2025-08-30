'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface AuditLogsSettings {
  id?: string
  enabled: boolean
  retentionPeriod: number
  logAssetCreation: boolean
  logAssetUpdates: boolean
  logAssetDeletion: boolean
  logUserLogin: boolean
  logUserLogout: boolean
  logPermissionChanges: boolean
  notifyOnCriticalEvents: boolean
  emailNotifications: boolean
  slackNotifications: boolean
  notificationEmail: string
}

export default function AuditLogsSettingsPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<AuditLogsSettings>({
    enabled: true,
    retentionPeriod: 90,
    logAssetCreation: true,
    logAssetUpdates: true,
    logAssetDeletion: true,
    logUserLogin: true,
    logUserLogout: true,
    logPermissionChanges: true,
    notifyOnCriticalEvents: true,
    emailNotifications: true,
    slackNotifications: false,
    notificationEmail: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Load settings from API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/audit-logs')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        } else {
          toast.error(t('settings.auditLogs.loadError') || 'Failed to load audit logs settings')
        }
      } catch (error) {
        console.error('Error fetching audit logs settings:', error)
        toast.error(t('settings.auditLogs.loadError') || 'Failed to load audit logs settings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [t])

  const handleToggle = (field: keyof AuditLogsSettings) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleInputChange = (field: keyof AuditLogsSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/audit-logs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success(t('settings.auditLogs.saveSuccess') || 'Audit logs settings saved successfully')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || t('settings.auditLogs.saveError') || 'Failed to save audit logs settings')
      }
    } catch (error) {
      console.error('Error saving audit logs settings:', error)
      toast.error(t('settings.auditLogs.saveError') || 'Failed to save audit logs settings')
    } finally {
      setIsSaving(false)
    }
  }

  const resetToDefaults = () => {
    const defaults: AuditLogsSettings = {
      enabled: true,
      retentionPeriod: 90,
      logAssetCreation: true,
      logAssetUpdates: true,
      logAssetDeletion: true,
      logUserLogin: true,
      logUserLogout: true,
      logPermissionChanges: true,
      notifyOnCriticalEvents: true,
      emailNotifications: true,
      slackNotifications: false,
      notificationEmail: settings.notificationEmail
    }
    setSettings(defaults)
    toast.success(t('settings.auditLogs.resetSuccess') || 'Settings reset to defaults')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.auditLogs.title') || 'Audit Logs'}</h1>
        <p className="text-muted-foreground">
          {t('settings.auditLogs.description') || 'Configure audit logging and monitoring settings'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.auditLogs.general.title') || 'General Settings'}</CardTitle>
          <CardDescription>
            {t('settings.auditLogs.general.description') || 'Basic audit logging configuration'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="audit-logs-enabled">
                {t('settings.auditLogs.general.enabled') || 'Enable Audit Logs'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.auditLogs.general.enabledDescription') || 'Turn on audit logging for your organization'}
              </p>
            </div>
            <Switch
              id="audit-logs-enabled"
              checked={settings.enabled}
              onCheckedChange={() => handleToggle('enabled')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="retention-period">
              {t('settings.auditLogs.general.retentionPeriod') || 'Retention Period'}
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="retention-period"
                type="number"
                min="1"
                max="3650"
                value={settings.retentionPeriod}
                onChange={(e) => handleInputChange('retentionPeriod', parseInt(e.target.value) || 90)}
                className="w-32"
              />
              <span>{t('settings.auditLogs.general.days') || 'days'}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('settings.auditLogs.general.retentionDescription') || 'How long to keep audit logs before automatic deletion'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.auditLogs.events.title') || 'Event Types'}</CardTitle>
          <CardDescription>
            {t('settings.auditLogs.events.description') || 'Select which events to log'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="log-asset-creation">
              {t('settings.auditLogs.events.assetCreation') || 'Asset Creation'}
            </Label>
            <Switch
              id="log-asset-creation"
              checked={settings.logAssetCreation}
              onCheckedChange={() => handleToggle('logAssetCreation')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="log-asset-updates">
              {t('settings.auditLogs.events.assetUpdates') || 'Asset Updates'}
            </Label>
            <Switch
              id="log-asset-updates"
              checked={settings.logAssetUpdates}
              onCheckedChange={() => handleToggle('logAssetUpdates')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="log-asset-deletion">
              {t('settings.auditLogs.events.assetDeletion') || 'Asset Deletion'}
            </Label>
            <Switch
              id="log-asset-deletion"
              checked={settings.logAssetDeletion}
              onCheckedChange={() => handleToggle('logAssetDeletion')}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="log-user-login">
              {t('settings.auditLogs.events.userLogin') || 'User Login'}
            </Label>
            <Switch
              id="log-user-login"
              checked={settings.logUserLogin}
              onCheckedChange={() => handleToggle('logUserLogin')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="log-user-logout">
              {t('settings.auditLogs.events.userLogout') || 'User Logout'}
            </Label>
            <Switch
              id="log-user-logout"
              checked={settings.logUserLogout}
              onCheckedChange={() => handleToggle('logUserLogout')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="log-permission-changes">
              {t('settings.auditLogs.events.permissionChanges') || 'Permission Changes'}
            </Label>
            <Switch
              id="log-permission-changes"
              checked={settings.logPermissionChanges}
              onCheckedChange={() => handleToggle('logPermissionChanges')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.auditLogs.notifications.title') || 'Notifications'}</CardTitle>
          <CardDescription>
            {t('settings.auditLogs.notifications.description') || 'Configure how you receive audit log notifications'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notify-critical-events">
              {t('settings.auditLogs.notifications.criticalEvents') || 'Notify on Critical Events'}
            </Label>
            <Switch
              id="notify-critical-events"
              checked={settings.notifyOnCriticalEvents}
              onCheckedChange={() => handleToggle('notifyOnCriticalEvents')}
            />
          </div>
          
          <div className="space-y-2">
            <Label>{t('settings.auditLogs.notifications.channels') || 'Notification Channels'}</Label>
            <div className="space-y-2 pl-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications" className="font-normal">
                  {t('settings.auditLogs.notifications.email') || 'Email'}
                </Label>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={() => handleToggle('emailNotifications')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="slack-notifications" className="font-normal">
                  {t('settings.auditLogs.notifications.slack') || 'Slack'}
                </Label>
                <Switch
                  id="slack-notifications"
                  checked={settings.slackNotifications}
                  onCheckedChange={() => handleToggle('slackNotifications')}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notification-email">
              {t('settings.auditLogs.notifications.emailAddress') || 'Notification Email'}
            </Label>
            <Input
              id="notification-email"
              type="email"
              value={settings.notificationEmail}
              onChange={(e) => handleInputChange('notificationEmail', e.target.value)}
              placeholder={t('settings.auditLogs.notifications.emailPlaceholder') || "admin@example.com"}
            />
            <p className="text-sm text-muted-foreground">
              {t('settings.auditLogs.notifications.emailDescription') || 'Email address to receive audit notifications'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={resetToDefaults}>
          {t('settings.auditLogs.reset') || 'Reset to Defaults'}
        </Button>
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? (t('settings.auditLogs.saving') || 'Saving...') : (t('settings.auditLogs.save') || 'Save Settings')}
        </Button>
      </div>
    </div>
  )
}