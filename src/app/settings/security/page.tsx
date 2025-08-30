'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface SecuritySettings {
  twoFactorEnabled: boolean
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecial: boolean
  sessionTimeout: number // in minutes
}

interface ActiveSession {
  id: string
  device: string
  location: string
  lastActive: string
  current: boolean
}

export default function SecuritySettingsPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecial: false,
    sessionTimeout: 30
  })
  
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'New York, US',
      lastActive: '2 minutes ago',
      current: true
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'New York, US',
      lastActive: '1 hour ago',
      current: false
    },
    {
      id: '3',
      device: 'Firefox on macOS',
      location: 'London, UK',
      lastActive: '2 days ago',
      current: false
    }
  ])

  const handleToggle = (field: keyof SecuritySettings) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const handleInputChange = (field: keyof SecuritySettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const saveSettings = () => {
    // In a real application, this would send the settings to the server
    toast.success(t('settings.security.saveSuccess') || 'Security settings saved successfully')
  }

  const resetToDefaults = () => {
    const defaults: SecuritySettings = {
      twoFactorEnabled: false,
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecial: false,
      sessionTimeout: 30
    }
    setSettings(defaults)
    toast.success(t('settings.security.resetSuccess') || 'Settings reset to defaults')
  }

  const endSession = (id: string) => {
    setActiveSessions(prev => prev.filter(session => session.id !== id))
    toast.success(t('settings.security.sessionEnded') || 'Session ended successfully')
  }

  const endAllSessions = () => {
    setActiveSessions(prev => prev.filter(session => session.current))
    toast.success(t('settings.security.allSessionsEnded') || 'All sessions ended except current')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.security.title') || 'Security'}</h1>
        <p className="text-muted-foreground">
          {t('settings.security.description') || 'Manage your security preferences and settings'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.security.twoFactor.title') || 'Two-Factor Authentication'}</CardTitle>
          <CardDescription>
            {t('settings.security.twoFactor.description') || 'Add an extra layer of security to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="two-factor">
                {t('settings.security.twoFactor.enable') || 'Enable Two-Factor Authentication'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.security.twoFactor.enableDescription') || 'Require a second form of authentication when signing in'}
              </p>
            </div>
            <Checkbox
              id="two-factor"
              checked={settings.twoFactorEnabled}
              onCheckedChange={() => handleToggle('twoFactorEnabled')}
            />
          </div>
          
          {settings.twoFactorEnabled && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">{t('settings.security.twoFactor.setup') || 'Setup Instructions'}</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>{t('settings.security.twoFactor.step1') || 'Download an authenticator app like Google Authenticator or Authy'}</li>
                <li>{t('settings.security.twoFactor.step2') || 'Scan the QR code with your authenticator app'}</li>
                <li>{t('settings.security.twoFactor.step3') || 'Enter the 6-digit code from your app to complete setup'}</li>
              </ol>
              <div className="mt-4 flex justify-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 flex items-center justify-center">
                  {t('settings.security.twoFactor.qrCode') || 'QR Code'}
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Input placeholder={t('settings.security.twoFactor.codePlaceholder') || "Enter 6-digit code"} />
                <Button>{t('settings.security.twoFactor.verify') || 'Verify'}</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.security.password.title') || 'Password Requirements'}</CardTitle>
          <CardDescription>
            {t('settings.security.password.description') || 'Set requirements for user passwords'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="min-length">
              {t('settings.security.password.minLength') || 'Minimum Length'}
            </Label>
            <Input
              id="min-length"
              type="number"
              min="6"
              max="128"
              value={settings.passwordMinLength}
              onChange={(e) => handleInputChange('passwordMinLength', parseInt(e.target.value) || 8)}
              className="w-32"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="require-uppercase">
              {t('settings.security.password.requireUppercase') || 'Require Uppercase Letters'}
            </Label>
            <Checkbox
              id="require-uppercase"
              checked={settings.passwordRequireUppercase}
              onCheckedChange={() => handleToggle('passwordRequireUppercase')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="require-lowercase">
              {t('settings.security.password.requireLowercase') || 'Require Lowercase Letters'}
            </Label>
            <Checkbox
              id="require-lowercase"
              checked={settings.passwordRequireLowercase}
              onCheckedChange={() => handleToggle('passwordRequireLowercase')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="require-numbers">
              {t('settings.security.password.requireNumbers') || 'Require Numbers'}
            </Label>
            <Checkbox
              id="require-numbers"
              checked={settings.passwordRequireNumbers}
              onCheckedChange={() => handleToggle('passwordRequireNumbers')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="require-special">
              {t('settings.security.password.requireSpecial') || 'Require Special Characters'}
            </Label>
            <Checkbox
              id="require-special"
              checked={settings.passwordRequireSpecial}
              onCheckedChange={() => handleToggle('passwordRequireSpecial')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.security.sessions.title') || 'Active Sessions'}</CardTitle>
          <CardDescription>
            {t('settings.security.sessions.description') || 'Manage your active sessions across devices'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.security.sessions.device') || 'Device'}</TableHead>
                <TableHead>{t('settings.security.sessions.location') || 'Location'}</TableHead>
                <TableHead>{t('settings.security.sessions.lastActive') || 'Last Active'}</TableHead>
                <TableHead>{t('settings.security.sessions.status') || 'Status'}</TableHead>
                <TableHead className="text-right">{t('settings.security.sessions.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.device}</TableCell>
                  <TableCell>{session.location}</TableCell>
                  <TableCell>{session.lastActive}</TableCell>
                  <TableCell>
                    {session.current ? (
                      <Badge variant="default">{t('settings.security.sessions.current') || 'Current'}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('settings.security.sessions.active') || 'Active'}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!session.current && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => endSession(session.id)}
                      >
                        {t('settings.security.sessions.end') || 'End Session'}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 flex justify-end">
            <Button variant="destructive" onClick={endAllSessions}>
              {t('settings.security.sessions.endAll') || 'End All Other Sessions'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={resetToDefaults}>
          {t('settings.security.reset') || 'Reset to Defaults'}
        </Button>
        <Button onClick={saveSettings}>
          {t('settings.security.save') || 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}