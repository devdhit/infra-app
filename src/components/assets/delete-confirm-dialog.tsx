'use client'

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Trash, AlertCircle } from "lucide-react";
import { AssetDialog } from "./asset-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DeleteConfirmDialogProps {
  title: string;
  description: string;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  error?: string;
}

export function DeleteConfirmDialog({
  title,
  description,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
  error
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();

  const footer = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        disabled={isDeleting}
      >
        {t('common.cancel', "Cancel")}
      </Button>
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
    <AssetDialog
      title={title}
      description={description}
      isOpen={isOpen}
      onClose={onClose}
      footer={footer}
      size="sm"
    >
      <div className="flex justify-center items-center w-12 h-12 rounded-full bg-destructive/10 mx-auto">
        <Trash className="h-6 w-6 text-destructive" />
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
    </AssetDialog>
  );
}