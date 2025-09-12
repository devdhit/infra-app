'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, FileSpreadsheet, FileJson } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"

interface DashboardExportProps {
  onExport: (format: 'csv' | 'excel' | 'pdf' | 'json') => void
}

export function DashboardExport({ onExport }: DashboardExportProps) {
  const { t } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: 'csv' | 'excel' | 'pdf' | 'json') => {
    setIsExporting(true)
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1500))
      onExport(format)
      toast.success(t('settings.dataManagement.export.success', 'Data exported successfully') || `Data exported as ${format.toUpperCase()}`)
    } catch (error) {
      toast.error(t('settings.dataManagement.export.error', 'Failed to export data') || 'Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting} className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('common.export')}</span>
          <span className="sm:hidden">{t('common.export')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          {t('settings.dataManagement.export.excel') || 'Excel (.xlsx)'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="h-4 w-4 mr-2" />
          {t('settings.dataManagement.export.csv') || 'CSV (.csv)'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          <FileJson className="h-4 w-4 mr-2" />
          {t('settings.dataManagement.export.json') || 'JSON (.json)'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}