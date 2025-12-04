'use client'

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/hooks/use-translation"
import { AlertTriangle } from "lucide-react"

interface DuplicateNoticeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  duplicateInfo?: {
    barcode: string
    assetType: string
    dept: string
    message: string
  }
  onConfirm: () => void
  onCancel: () => void
}

export function DuplicateNoticeDialog({ 
  isOpen, 
  onOpenChange, 
  duplicateInfo,
  onConfirm,
  onCancel
}: DuplicateNoticeDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            {t('assets.duplicate.title', 'Duplicate Asset Found')}
          </DialogTitle>
          <DialogDescription>
            {t('assets.duplicate.description', 'A duplicate asset was detected in the system.')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="rounded-md bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  {t('assets.duplicate.warning', 'Warning')}
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {duplicateInfo?.message || 
                      t('assets.duplicate.defaultMessage', 
                        'The barcode you entered already exists in another asset type.')}
                  </p>
                  <p className="mt-2 font-medium">
                    {t('assets.duplicate.proceedWarning', 
                      'If you proceed, the duplicate asset will be automatically deleted.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {duplicateInfo && (
            <div className="grid gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">
                  {t('assets.duplicate.barcode', 'Barcode')}:
                </div>
                <div className="text-sm">{duplicateInfo.barcode}</div>
                
                <div className="text-sm font-medium">
                  {t('assets.duplicate.assetType', 'Asset Type')}:
                </div>
                <div className="text-sm capitalize">{duplicateInfo.assetType}</div>
                
                <div className="text-sm font-medium">
                  {t('assets.duplicate.department', 'Department')}:
                </div>
                <div className="text-sm">{duplicateInfo.dept}</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={onConfirm}>
            {t('assets.duplicate.proceed', 'Proceed Anyway')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}