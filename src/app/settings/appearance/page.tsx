'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { useTheme } from "next-themes"
import { HexColorPicker } from "react-colorful"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { SettingsLayout } from "@/components/settings/settings-layout"
import logger from '@/lib/logger'

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export default function AppearanceSettingsPage() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: (theme as 'light' | 'dark' | 'system') || 'system',
    accentColor: '#3b82f6', // Default blue
    borderRadius: 'md'
  })
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('appearanceSettings')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        logger.error('Failed to parse appearance settings', error)
      }
    }
  }, [])

  // Apply theme when settings change
  useEffect(() => {
    setTheme(settings.theme)
    document.documentElement.style.setProperty('--accent', settings.accentColor)
    
    // Save to localStorage
    localStorage.setItem('appearanceSettings', JSON.stringify(settings))
  }, [settings, setTheme])

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({ ...prev, theme: newTheme }))
    toast.success(t('settings.appearance.themeUpdated') || 'Theme updated successfully')
  }

  const handleAccentColorChange = (color: string) => {
    setSettings(prev => ({ ...prev, accentColor: color }))
  }

  const handleBorderRadiusChange = (size: 'none' | 'sm' | 'md' | 'lg' | 'xl') => {
    setSettings(prev => ({ ...prev, borderRadius: size }))
    toast.success(t('settings.appearance.borderRadiusUpdated') || 'Border radius updated')
  }

  const resetToDefaults = () => {
    const defaults: AppearanceSettings = {
      theme: 'system',
      accentColor: '#3b82f6',
      borderRadius: 'md'
    }
    setSettings(defaults)
    toast.success(t('settings.appearance.resetSuccess') || 'Settings reset to defaults')
  }

  return (
    <SettingsLayout
      title={t('settings.appearance.title') || 'Appearance'}
      description={t('settings.appearance.description') || 'Customize the look and feel of the application'}
      currentPage={t('settings.appearance.title') || 'Appearance'}
    >
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appearance.theme.title') || 'Theme'}</CardTitle>
          <CardDescription>
            {t('settings.appearance.theme.description') || 'Select the theme for the application'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-light">
              {t('settings.appearance.theme.light') || 'Light'}
            </Label>
            <Checkbox
              id="theme-light"
              checked={settings.theme === 'light'}
              onCheckedChange={() => handleThemeChange('light')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-dark">
              {t('settings.appearance.theme.dark') || 'Dark'}
            </Label>
            <Checkbox
              id="theme-dark"
              checked={settings.theme === 'dark'}
              onCheckedChange={() => handleThemeChange('dark')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-system">
              {t('settings.appearance.theme.system') || 'System'}
            </Label>
            <Checkbox
              id="theme-system"
              checked={settings.theme === 'system'}
              onCheckedChange={() => handleThemeChange('system')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appearance.accentColor') || 'Accent Color'}</CardTitle>
          <CardDescription>
            {t('settings.appearance.accentColorDescription') || 'Choose the accent color for the application'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div 
              className="w-10 h-10 rounded-md border cursor-pointer"
              style={{ backgroundColor: settings.accentColor }}
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
            />
            <Input
              type="text"
              value={settings.accentColor}
              onChange={(e) => handleAccentColorChange(e.target.value)}
              className="w-32"
            />
          </div>
          
          {isColorPickerOpen && (
            <div className="mt-4">
              <HexColorPicker 
                color={settings.accentColor} 
                onChange={handleAccentColorChange} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.appearance.borderRadius') || 'Border Radius'}</CardTitle>
          <CardDescription>
            {t('settings.appearance.borderRadiusDescription') || 'Adjust the roundness of corners'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <Button
                key={size}
                variant={settings.borderRadius === size ? "default" : "outline"}
                onClick={() => handleBorderRadiusChange(size)}
                className="capitalize"
              >
                {t(`settings.appearance.borderRadiusOptions.${size}`) || size}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={resetToDefaults}>
          {t('settings.appearance.reset') || 'Reset to Defaults'}
        </Button>
      </div>
    </SettingsLayout>
  )
}