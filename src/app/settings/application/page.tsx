'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { useApplicationName } from "@/hooks/use-application-name"
import { toast } from "sonner"
import { SettingsLayout } from "@/components/settings/settings-layout"

export default function ApplicationSettingsPage() {
  const { t } = useTranslation()
  const { applicationName, updateApplicationName, resetApplicationName } = useApplicationName()
  const [appName, setAppName] = useState(applicationName)

  // Update the local state when the application name changes
  useEffect(() => {
    setAppName(applicationName)
  }, [applicationName])

  const handleSave = () => {
    try {
      updateApplicationName(appName)
      // Show success message
      toast.success(t('settings.application.nameUpdated') || 'Application name updated successfully')
      
      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      toast.error(t('settings.application.updateError') || 'Failed to update application name')
    }
  }

  const handleReset = () => {
    resetApplicationName()
    
    // Show success message
    toast.success(t('settings.application.resetSuccess') || 'Application name reset to default')
    
    // Reload the page to reflect changes
    setTimeout(() => {
      window.location.reload()
    }, 1000)
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
              onChange={(e) => setAppName(e.target.value)}
              placeholder={t('settings.application.namePlaceholder') || 'Enter application name'}
            />
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
            <Button onClick={handleSave}>
              {t('common.save') || 'Save'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
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
                  {appName || 'IT Asset Management'}
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