'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useTranslation } from "@/hooks/use-translation"
import { api } from "@/lib/api"
import { Loader2, Download } from "lucide-react"
import { useState, useCallback } from "react"

interface ExcelExportDialogProps {
  assetType: string
  title: string
  isOpen: boolean
  onClose: () => void
}

export function ExcelExportDialog({
  assetType,
  title,
  isOpen,
  onClose
}: ExcelExportDialogProps) {
  const { t } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = useCallback(async () => {
    setIsExporting(true)

    try {
      const response = await api.get<any>(`/assets/excel/export?assetType=${assetType}`, {
        responseType: 'blob'
      })

      // Create a blob URL and trigger download
      const blob = new Blob([response], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${assetType}-export.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success(t('assets.excel.export.success', '{0} export completed', title))
    } catch (error: any) {
      console.error('Export error:', error)
      const message = error.message || t('assets.excel.export.error', 'Failed to export assets')
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }, [assetType, title, t])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('assets.excel.export.title', 'Export {0}', title)}</DialogTitle>
          <DialogDescription>
            {t('assets.excel.export.description', 'Export all {0} data to an Excel file', title.toLowerCase())}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">{t('assets.excel.export.data', 'Export Data')}</h3>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('assets.excel.export.info', 'This will export all {0} data to an Excel file with proper formatting.', title.toLowerCase())}
              </p>
              
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('assets.excel.export.exporting', 'Exporting...')}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t('assets.excel.export.button', 'Export Data')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}