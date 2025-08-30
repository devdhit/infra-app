'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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

interface BackupSchedule {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  time: string
  enabled: boolean
}

interface DataRetention {
  assetType: string
  retentionPeriod: number // in days
  autoArchive: boolean
}

export default function DataManagementSettingsPage() {
  const { t } = useTranslation()
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([
    {
      id: '1',
      name: 'Daily Backup',
      frequency: 'daily',
      time: '02:00',
      enabled: true
    },
    {
      id: '2',
      name: 'Weekly Backup',
      frequency: 'weekly',
      time: '03:00',
      enabled: true
    }
  ])
  
  const [dataRetention, setDataRetention] = useState<DataRetention[]>([
    { assetType: 'PC', retentionPeriod: 365, autoArchive: true },
    { assetType: 'Laptop', retentionPeriod: 365, autoArchive: true },
    { assetType: 'Printer', retentionPeriod: 365, autoArchive: true },
    { assetType: 'License', retentionPeriod: 730, autoArchive: true },
    { assetType: 'Warehouse', retentionPeriod: 365, autoArchive: true }
  ])

  const handleBackupToggle = (id: string) => {
    setBackupSchedules(prev => 
      prev.map(schedule => 
        schedule.id === id 
          ? { ...schedule, enabled: !schedule.enabled } 
          : schedule
      )
    )
  }

  const handleRetentionChange = (assetType: string, field: keyof DataRetention, value: any) => {
    setDataRetention(prev => 
      prev.map(retention => 
        retention.assetType === assetType 
          ? { ...retention, [field]: value } 
          : retention
      )
    )
  }

  const addBackupSchedule = () => {
    const newSchedule: BackupSchedule = {
      id: Date.now().toString(),
      name: `Backup ${backupSchedules.length + 1}`,
      frequency: 'daily',
      time: '00:00',
      enabled: false
    }
    setBackupSchedules(prev => [...prev, newSchedule])
    toast.success(t('settings.dataManagement.backupAdded') || 'Backup schedule added')
  }

  const saveSettings = () => {
    // In a real application, this would send the settings to the server
    toast.success(t('settings.dataManagement.saveSuccess') || 'Data management settings saved successfully')
  }

  const resetToDefaults = () => {
    setBackupSchedules([
      {
        id: '1',
        name: 'Daily Backup',
        frequency: 'daily',
        time: '02:00',
        enabled: true
      },
      {
        id: '2',
        name: 'Weekly Backup',
        frequency: 'weekly',
        time: '03:00',
        enabled: true
      }
    ])
    
    setDataRetention([
      { assetType: 'PC', retentionPeriod: 365, autoArchive: true },
      { assetType: 'Laptop', retentionPeriod: 365, autoArchive: true },
      { assetType: 'Printer', retentionPeriod: 365, autoArchive: true },
      { assetType: 'License', retentionPeriod: 730, autoArchive: true },
      { assetType: 'Warehouse', retentionPeriod: 365, autoArchive: true }
    ])
    
    toast.success(t('settings.dataManagement.resetSuccess') || 'Settings reset to defaults')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.dataManagement.title') || 'Data Management'}</h1>
        <p className="text-muted-foreground">
          {t('settings.dataManagement.description') || 'Manage your data backup, retention, and export settings'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.dataManagement.backup.title') || 'Backup Schedules'}</CardTitle>
          <CardDescription>
            {t('settings.dataManagement.backup.description') || 'Configure automated backup schedules for your data'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.dataManagement.backup.name') || 'Name'}</TableHead>
                <TableHead>{t('settings.dataManagement.backup.frequency') || 'Frequency'}</TableHead>
                <TableHead>{t('settings.dataManagement.backup.time') || 'Time'}</TableHead>
                <TableHead>{t('settings.dataManagement.backup.status') || 'Status'}</TableHead>
                <TableHead className="text-right">{t('settings.dataManagement.backup.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backupSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t(`settings.dataManagement.backup.frequencies.${schedule.frequency}`) || schedule.frequency}
                    </Badge>
                  </TableCell>
                  <TableCell>{schedule.time}</TableCell>
                  <TableCell>
                    {schedule.enabled ? (
                      <Badge variant="default">{t('settings.dataManagement.backup.enabled') || 'Enabled'}</Badge>
                    ) : (
                      <Badge variant="destructive">{t('settings.dataManagement.backup.disabled') || 'Disabled'}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Switch
                        checked={schedule.enabled}
                        onCheckedChange={() => handleBackupToggle(schedule.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="mt-4 flex justify-end">
            <Button onClick={addBackupSchedule}>
              {t('settings.dataManagement.backup.add') || 'Add Backup Schedule'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.dataManagement.retention.title') || 'Data Retention'}</CardTitle>
          <CardDescription>
            {t('settings.dataManagement.retention.description') || 'Configure how long different types of data are retained'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.dataManagement.retention.assetType') || 'Asset Type'}</TableHead>
                <TableHead>{t('settings.dataManagement.retention.period') || 'Retention Period (Days)'}</TableHead>
                <TableHead>{t('settings.dataManagement.retention.autoArchive') || 'Auto Archive'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataRetention.map((retention) => (
                <TableRow key={retention.assetType}>
                  <TableCell className="font-medium">{retention.assetType}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      max="3650"
                      value={retention.retentionPeriod}
                      onChange={(e) => handleRetentionChange(retention.assetType, 'retentionPeriod', parseInt(e.target.value) || 365)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={retention.autoArchive}
                      onCheckedChange={(checked) => handleRetentionChange(retention.assetType, 'autoArchive', checked)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.dataManagement.export.title') || 'Data Export'}</CardTitle>
          <CardDescription>
            {t('settings.dataManagement.export.description') || 'Export your data in various formats'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              {t('settings.dataManagement.export.json') || 'Export as JSON'}
            </Button>
            <Button variant="outline">
              {t('settings.dataManagement.export.csv') || 'Export as CSV'}
            </Button>
            <Button variant="outline">
              {t('settings.dataManagement.export.excel') || 'Export as Excel'}
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">{t('settings.dataManagement.export.options') || 'Export Options'}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="include-audit">
                  {t('settings.dataManagement.export.includeAudit') || 'Include Audit Trail'}
                </Label>
                <Switch id="include-audit" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="include-custom">
                  {t('settings.dataManagement.export.includeCustom') || 'Include Custom Fields'}
                </Label>
                <Switch id="include-custom" />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="include-history">
                  {t('settings.dataManagement.export.includeHistory') || 'Include Change History'}
                </Label>
                <Switch id="include-history" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={resetToDefaults}>
          {t('settings.dataManagement.reset') || 'Reset to Defaults'}
        </Button>
        <Button onClick={saveSettings}>
          {t('settings.dataManagement.save') || 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}