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
import { Asset, AssetColumn } from "@/types/assets";
import { formatDate } from "@/lib/utils";

interface AssetDetailProps {
  asset: Asset | null;
  title: string;
  columns: AssetColumn[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function AssetDetailDialog({
  asset,
  title,
  columns,
  isOpen,
  onClose,
  onEdit,
}: AssetDetailProps) {
  const { t } = useTranslation();

  if (!asset) return null;

  // Helper function to format displayed values
  const formatValue = (key: string, value: any): React.ReactNode => {
    // Handle date fields
    if (key.toLowerCase().includes('date') && value) {
      return formatDate(value);
    }
    
    // Handle status fields
    if (key === 'status' && value) {
      const statusClass = {
        active: "bg-green-100 text-green-800",
        inactive: "bg-gray-100 text-gray-800",
        maintenance: "bg-yellow-100 text-yellow-800",
        retired: "bg-red-100 text-red-800"
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[value as keyof typeof statusClass] || ""}`}>
          {t(`assets.status.${value}`) || value}
        </span>
      );
    }
    
    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    // Handle objects (like nested data)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return JSON.stringify(value);
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // Default handling
    return value || '-';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('assets.view.title', title) || `${title} Details`}</DialogTitle>
          <DialogDescription>
            {t('assets.view.description') || 'View the complete details of this asset.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {columns.map((column) => (
            <div key={column.key} className="grid grid-cols-4 items-center gap-4">
              <div className="text-sm font-medium">
                {t(`assets.pc.${column.key}`) || column.label}
              </div>
              <div className="col-span-3 text-sm">
                {column.render 
                  ? column.render(asset[column.key]) 
                  : formatValue(column.key, asset[column.key])}
              </div>
            </div>
          ))}
          
          {/* Display ID for reference */}
          <div className="grid grid-cols-4 items-center gap-4 border-t pt-4 mt-2">
            <div className="text-sm font-medium">ID</div>
            <div className="col-span-3 text-sm text-muted-foreground text-xs">
              {asset.id}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
          <Button onClick={onEdit}>{t('common.edit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}