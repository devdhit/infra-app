'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { X } from "lucide-react";
import { ReactNode } from "react";

interface AssetDialogProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

export function AssetDialog({
  title,
  description,
  isOpen,
  onClose,
  children,
  footer,
  size = "md",
  showCloseButton = true,
}: AssetDialogProps) {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: "sm:max-w-[425px]",
    md: "sm:max-w-[600px]",
    lg: "sm:max-w-[800px]",
    xl: "sm:max-w-[1000px]",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${sizeClasses[size]} max-h-[80vh] overflow-y-auto`} showCloseButton={false}>
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>{title}</DialogTitle>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6 p-0"
                aria-label={t('common.close', "Close")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}