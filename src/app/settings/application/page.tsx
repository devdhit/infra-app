'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { getApplicationSettings, updateApplicationSettings, resetApplicationSettings } from '@/lib/api/application'

export default function ApplicationSettingsPage() {
  const { t } = useTranslation()
  const [appName, setAppName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  // Load application settings
  const loadApplicationSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const settings = await getApplicationSettings()
      setAppName(settings.applicationName)
    } catch (error) {
      toast.error(t('settings.application.loadError') || 'Failed to load application settings')
    } finally {
      setIsLoading(false)
    }
  }, [t, setAppName, setIsLoading])

  useEffect(() => {
    loadApplicationSettings()
  }, [loadApplicationSettings])

  // Validate the application name
  const validateAppName = (name: string) => {
    if (name.length > 50) {
      return t('settings.application.nameTooLong') || 'Application name must be less than 50 characters'
    }
    return ''
  }

  const handleSave = async () => {
    // Validate input
    const validationError = validateAppName(appName)
    if (validationError) {
      setError(validationError)
      return
    }
    
    setError('')
    setIsSaving(true)
    
    try {
      const updatedSettings = await updateApplicationSettings({ applicationName: appName })
      setAppName(updatedSettings.applicationName)
      // Show success message
      toast.success(t('settings.application.nameUpdated') || 'Application name updated successfully')
    } catch (error) {
      toast.error(t('settings.application.updateError') || 'Failed to update application name')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    try {
      setIsSaving(true)
      const updatedSettings = await resetApplicationSettings()
      setAppName(updatedSettings.applicationName)
      // Show success message
      toast.success(t('settings.application.resetSuccess') || 'Application name reset to default')
    } catch (error) {
      toast.error(t('settings.application.resetError') || 'Failed to reset application name')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAppName(value)
    
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
    
    // Validate as user types
    const validationError = validateAppName(value)
    setError(validationError)
  }

  if (isLoading) {
    return (
      <SettingsLayout
        title={t('settings.application.title') || 'Application Settings'}
        description={t('settings.application.description') || 'Customize the application name and branding'}
        currentPage={t('settings.application.title') || 'Application'}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout
      title={t('settings.application.title') || 'Application Settings'}
      description={t('settings.application.description') || 'Customize the application name and branding'}
      currentPage={t('settings.application.title') || 'Application'}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.application.name') || 'Application Name'}</CardTitle>
          <CardDescription>
            {t('settings.application.nameDescription') || 'Set the name that appears in the sidebar and header'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="app-name">
              {t('settings.application.fullName') || 'Full Application Name'}
            </Label>
            <Input
              id="app-name"
              value={appName}
              onChange={handleInputChange}
              placeholder={t('settings.application.namePlaceholder') || 'Enter application name'}
              disabled={isSaving}
              maxLength={50}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {appName.length}/50 {t('settings.application.characters') || 'characters'}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>
              {t('settings.application.shortName') || 'Short Name Preview'}
            </Label>
            <div className="p-3 rounded-md border bg-muted">
              {appName.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS'}
            </div>
            <p className="text-sm text-muted-foreground">
              {t('settings.application.shortNameDescription') || 'This will appear in the mobile header and small spaces'}
            </p>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} disabled={isSaving || !!error}>
              {isSaving ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isSaving}>
              {t('settings.application.reset') || 'Reset to Default'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.application.preview') || 'Preview'}</CardTitle>
          <CardDescription>
            {t('settings.application.previewDescription') || 'See how the application name will appear'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">{t('settings.application.desktopPreview') || 'Desktop Sidebar'}</h3>
              <div className="p-4 rounded-lg border bg-background">
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                  {appName || t('common.applicationName') || 'IT Asset Management'}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">{t('settings.application.mobilePreview') || 'Mobile Header'}</h3>
              <div className="p-4 rounded-lg border bg-background">
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                  {appName.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </SettingsLayout>
  )
}