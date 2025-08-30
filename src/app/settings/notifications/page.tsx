'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface NotificationSettings {
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  assetCreated: boolean
  assetUpdated: boolean
  assetDeleted: boolean
  maintenanceReminder: boolean
  licenseExpiry: boolean
  emailRecipient: string
  smsRecipient: string
}

export default function NotificationsSettingsPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    assetCreated: true,
    assetUpdated: true,
    assetDeleted: false,
    maintenanceReminder: true,
    licenseExpiry: true,
    emailRecipient: '',
    smsRecipient: ''
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error('Failed to parse notification settings', error)
      }
    }
  }, [])

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings))
  }, [settings])

  const handleToggle = (field: keyof NotificationSettings) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleInputChange = (field: keyof NotificationSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = () => {
    // In a real application, this would send the settings to the server
    toast.success(t('settings.notifications.saveSuccess') || 'Notification settings saved successfully')
  }

  const resetToDefaults = () => {
    const defaults: NotificationSettings = {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      assetCreated: true,
      assetUpdated: true,
      assetDeleted: false,
      maintenanceReminder: true,
      licenseExpiry: true,
      emailRecipient: '',
      smsRecipient: ''
    }
    setSettings(defaults)
    toast.success(t('settings.notifications.resetSuccess') || 'Settings reset to defaults')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.notifications.title') || 'Notifications'}</h1>
        <p className="text-muted-foreground">
          {t('settings.notifications.description') || 'Configure how you receive notifications'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.notifications.channels.title') || 'Notification Channels'}</CardTitle>
          <CardDescription>
            {t('settings.notifications.channels.description') || 'Select which channels you want to receive notifications through'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-channel">
                {t('settings.notifications.channels.email') || 'Email'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.channels.emailDescription') || 'Receive notifications via email'}
              </p>
            </div>
            <Checkbox
              id="email-channel"
              checked={settings.emailEnabled}
              onCheckedChange={() => handleToggle('emailEnabled')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms-channel">
                {t('settings.notifications.channels.sms') || 'SMS'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.channels.smsDescription') || 'Receive notifications via text message'}
              </p>
            </div>
            <Checkbox
              id="sms-channel"
              checked={settings.smsEnabled}
              onCheckedChange={() => handleToggle('smsEnabled')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-channel">
                {t('settings.notifications.channels.push') || 'Push Notifications'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.notifications.channels.pushDescription') || 'Receive notifications in the app'}
              </p>
            </div>
            <Checkbox
              id="push-channel"
              checked={settings.pushEnabled}
              onCheckedChange={() => handleToggle('pushEnabled')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.notifications.events.title') || 'Notification Events'}</CardTitle>
          <CardDescription>
            {t('settings.notifications.events.description') || 'Select which events trigger notifications'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="asset-created">
              {t('settings.notifications.events.assetCreated') || 'Asset Created'}
            </Label>
            <Checkbox
              id="asset-created"
              checked={settings.assetCreated}
              onCheckedChange={() => handleToggle('assetCreated')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="asset-updated">
              {t('settings.notifications.events.assetUpdated') || 'Asset Updated'}
            </Label>
            <Checkbox
              id="asset-updated"
              checked={settings.assetUpdated}
              onCheckedChange={() => handleToggle('assetUpdated')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="asset-deleted">
              {t('settings.notifications.events.assetDeleted') || 'Asset Deleted'}
            </Label>
            <Checkbox
              id="asset-deleted"
              checked={settings.assetDeleted}
              onCheckedChange={() => handleToggle('assetDeleted')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-reminder">
              {t('settings.notifications.events.maintenanceReminder') || 'Maintenance Reminder'}
            </Label>
            <Checkbox
              id="maintenance-reminder"
              checked={settings.maintenanceReminder}
              onCheckedChange={() => handleToggle('maintenanceReminder')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="license-expiry">
              {t('settings.notifications.events.licenseExpiry') || 'License Expiry'}
            </Label>
            <Checkbox
              id="license-expiry"
              checked={settings.licenseExpiry}
              onCheckedChange={() => handleToggle('licenseExpiry')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.notifications.recipients.title') || 'Notification Recipients'}</CardTitle>
          <CardDescription>
            {t('settings.notifications.recipients.description') || 'Specify who should receive notifications'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-recipient">
              {t('settings.notifications.recipients.email') || 'Email Recipients'}
            </Label>
            <Input
              id="email-recipient"
              placeholder={t('settings.notifications.recipients.emailPlaceholder') || "Enter email addresses (comma separated)"}
              value={settings.emailRecipient}
              onChange={(e) => handleInputChange('emailRecipient', e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {t('settings.notifications.recipients.emailHelp') || 'Enter email addresses separated by commas'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sms-recipient">
              {t('settings.notifications.recipients.sms') || 'SMS Recipients'}
            </Label>
            <Textarea
              id="sms-recipient"
              placeholder={t('settings.notifications.recipients.smsPlaceholder') || "Enter phone numbers (one per line)"}
              value={settings.smsRecipient}
              onChange={(e) => handleInputChange('smsRecipient', e.target.value)}
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              {t('settings.notifications.recipients.smsHelp') || 'Enter phone numbers, one per line'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={resetToDefaults}>
          {t('settings.notifications.reset') || 'Reset to Defaults'}
        </Button>
        <Button onClick={saveSettings}>
          {t('settings.notifications.save') || 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
