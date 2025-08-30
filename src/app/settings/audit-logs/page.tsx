'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

import { FileText, Save, RotateCcw, Bell, SettingsIcon, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuditLogsSettings, useUpdateAuditLogsSettings } from "@/hooks/useApi"

interface AuditLogsSettingsData {
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
  const { data: settingsData, isLoading, isError, error } = useAuditLogsSettings()
  const updateMutation = useUpdateAuditLogsSettings()
  
  const [settings, setSettings] = useState<AuditLogsSettingsData>({
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

  // Update local state when data is fetched
  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData)
    }
  }, [settingsData])

  const handleToggle = (field: keyof AuditLogsSettingsData) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleInputChange = (field: keyof AuditLogsSettingsData, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = async () => {
    try {
      await updateMutation.mutateAsync(settings)
      toast.success(t('settings.auditLogs.saveSuccess') || 'Audit logs settings saved successfully')
    } catch (error) {
      console.error('Error saving audit logs settings:', error)
      toast.error(t('settings.auditLogs.saveError') || 'Failed to save audit logs settings')
    }
  }

  const resetToDefaults = () => {
    const defaults: AuditLogsSettingsData = {
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

  if (isError) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-red-500">{t('settings.auditLogs.loadError') || 'Failed to load audit logs settings'}</p>
          {error && <p className="text-sm text-muted-foreground mt-2">{error.message}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            <FileText className="h-8 w-8 mr-3 text-blue-500" />
            {t('settings.auditLogs.title') || 'Audit Logs'}
          </h1>
          <p className="text-muted-foreground">
            {t('settings.auditLogs.description') || 'Configure audit logging and monitoring settings'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefaults} className="rounded-lg">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('settings.auditLogs.reset') || 'Reset to Defaults'}
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={updateMutation.isPending}
            className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? (t('settings.auditLogs.saving') || 'Saving...') : (t('settings.auditLogs.save') || 'Save Settings')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* General Settings Card */}
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-blue-500" />
              <CardTitle>{t('settings.auditLogs.general.title') || 'General Settings'}</CardTitle>
              <Badge variant={settings.enabled ? "default" : "secondary"} className="ml-auto">
                {settings.enabled ? t('common.enabled') : t('common.disabled')}
              </Badge>
            </div>
            <CardDescription>
              {t('settings.auditLogs.general.description') || 'Basic audit logging configuration'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="audit-logs-enabled" className="text-base font-medium">
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
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retention-period" className="text-base font-medium">
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
                  className="w-32 rounded-lg"
                />
                <span className="text-muted-foreground">{t('settings.auditLogs.general.days') || 'days'}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('settings.auditLogs.general.retentionDescription') || 'How long to keep audit logs before automatic deletion'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Event Types Card */}
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-green-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <CardTitle>{t('settings.auditLogs.events.title') || 'Event Types'}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.auditLogs.events.description') || 'Select which events to log'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <Label htmlFor="log-asset-creation" className="font-medium">
                  {t('settings.auditLogs.events.assetCreation') || 'Asset Creation'}
                </Label>
                <Switch
                  id="log-asset-creation"
                  checked={settings.logAssetCreation}
                  onCheckedChange={() => handleToggle('logAssetCreation')}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <Label htmlFor="log-asset-updates" className="font-medium">
                  {t('settings.auditLogs.events.assetUpdates') || 'Asset Updates'}
                </Label>
                <Switch
                  id="log-asset-updates"
                  checked={settings.logAssetUpdates}
                  onCheckedChange={() => handleToggle('logAssetUpdates')}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <Label htmlFor="log-asset-deletion" className="font-medium">
                  {t('settings.auditLogs.events.assetDeletion') || 'Asset Deletion'}
                </Label>
                <Switch
                  id="log-asset-deletion"
                  checked={settings.logAssetDeletion}
                  onCheckedChange={() => handleToggle('logAssetDeletion')}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <Label htmlFor="log-user-login" className="font-medium">
                  {t('settings.auditLogs.events.userLogin') || 'User Login'}
                </Label>
                <Switch
                  id="log-user-login"
                  checked={settings.logUserLogin}
                  onCheckedChange={() => handleToggle('logUserLogin')}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <Label htmlFor="log-user-logout" className="font-medium">
                  {t('settings.auditLogs.events.userLogout') || 'User Logout'}
                </Label>
                <Switch
                  id="log-user-logout"
                  checked={settings.logUserLogout}
                  onCheckedChange={() => handleToggle('logUserLogout')}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <Label htmlFor="log-permission-changes" className="font-medium">
                  {t('settings.auditLogs.events.permissionChanges') || 'Permission Changes'}
                </Label>
                <Switch
                  id="log-permission-changes"
                  checked={settings.logPermissionChanges}
                  onCheckedChange={() => handleToggle('logPermissionChanges')}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-yellow-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-500" />
              <CardTitle>{t('settings.auditLogs.notifications.title') || 'Notifications'}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.auditLogs.notifications.description') || 'Configure how you receive audit log notifications'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="notify-critical-events" className="text-base font-medium">
                  {t('settings.auditLogs.notifications.criticalEvents') || 'Notify on Critical Events'}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.auditLogs.notifications.description') || 'Configure how you receive audit log notifications'}
                </p>
              </div>
              <Switch
                id="notify-critical-events"
                checked={settings.notifyOnCriticalEvents}
                onCheckedChange={() => handleToggle('notifyOnCriticalEvents')}
                className="data-[state=checked]:bg-yellow-500"
              />
            </div>
            
            <div className="space-y-4">
              <Label className="text-base font-medium">{t('settings.auditLogs.notifications.channels') || 'Notification Channels'}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Label htmlFor="email-notifications" className="font-medium">
                    {t('settings.auditLogs.notifications.email') || 'Email'}
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={() => handleToggle('emailNotifications')}
                    className="data-[state=checked]:bg-blue-500"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Label htmlFor="slack-notifications" className="font-medium">
                    {t('settings.auditLogs.notifications.slack') || 'Slack'}
                  </Label>
                  <Switch
                    id="slack-notifications"
                    checked={settings.slackNotifications}
                    onCheckedChange={() => handleToggle('slackNotifications')}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notification-email" className="text-base font-medium">
                {t('settings.auditLogs.notifications.emailAddress') || 'Notification Email'}
              </Label>
              <Input
                id="notification-email"
                type="email"
                value={settings.notificationEmail}
                onChange={(e) => handleInputChange('notificationEmail', e.target.value)}
                placeholder={t('settings.auditLogs.notifications.emailPlaceholder') || "admin@example.com"}
                className="max-w-md rounded-lg"
              />
              <div className="flex items-center text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mr-1.5" />
                <span>
                  {t('settings.auditLogs.notifications.emailDescription') || 'Email address to receive audit notifications'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" onClick={resetToDefaults} className="rounded-lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('settings.auditLogs.reset') || 'Reset to Defaults'}
        </Button>
        <Button 
          onClick={saveSettings} 
          disabled={updateMutation.isPending}
          className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? (t('settings.auditLogs.saving') || 'Saving...') : (t('settings.auditLogs.save') || 'Save Settings')}
        </Button>
      </div>
    </div>
  )
}