'use client'

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Trash, AlertCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BulkDeleteDialogProps {
  title: string;
  count: number;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  error?: string;
}

export function BulkDeleteDialog({
  title,
  count,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
  error
}: BulkDeleteDialogProps) {
  const { t } = useTranslation();

  const footer = (
    <>
      <Button
        type="button"
        variant="destructive"
        onClick={onConfirm}
        disabled={isDeleting}
      >
        {isDeleting ? t('common.deleting', "Deleting...") : t('common.delete', "Delete")}
      </Button>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash className="h-5 w-5 text-destructive" />
            {t('common.bulkDelete', "Bulk Delete")}
          </DialogTitle>
          <DialogDescription>
            {t('bulkDelete.confirmation', 
              `Are you sure you want to delete {0} {1}? This action cannot be undone.`,
              count.toString(), 
              title.toLowerCase()
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center items-center w-12 h-12 rounded-full bg-destructive/10 mx-auto">
          <Trash className="h-6 w-6 text-destructive" />
        </div>
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-sm">{t('bulkDelete.warning', "Important")}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {t('bulkDelete.warningDescription', 
                  "This action will permanently delete {0} {1} and cannot be undone. Please ensure you want to proceed.",
                  count.toString(),
                  title.toLowerCase()
                )}
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error', "Error")}</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <DialogFooter className="mt-6">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}