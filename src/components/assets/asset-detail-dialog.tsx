'use client'

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Asset, AssetColumn } from "@/types/assets";
import { formatDate } from "@/lib/utils";
import { AssetDialog } from "./asset-dialog";
import { Calendar, Hash, Tag, User, Building, MapPin, Info } from "lucide-react";
import { AssetDetailSkeleton } from "./asset-detail-skeleton";

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

  // Show skeleton while loading
  if (!asset && isOpen) {
    return <AssetDetailSkeleton title={title} fieldCount={columns.length} />;
  }

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
        retired: "bg-red-100 text-red-800",
        available: "bg-green-100 text-green-800",
        in_use: "bg-blue-100 text-blue-800",
        low_stock: "bg-yellow-100 text-yellow-800",
        out_of_stock: "bg-red-100 text-red-800",
        expired: "bg-red-100 text-red-800"
      };
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[value as keyof typeof statusClass] || ""}`}>
          {t(`assets.status.${value}`, value)}
        </span>
      );
    }
    
    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? t('common.yes', 'Yes') : t('common.no', 'No');
    }
    
    // Handle objects (like nested data)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return JSON.stringify(value, null, 2);
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // Default handling
    return value || '-';
  };

  // Helper function to get icon for a field
  const getFieldIcon = (key: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      date: <Calendar className="h-4 w-4" />,
      barcode: <Hash className="h-4 w-4" />,
      sap: <Tag className="h-4 w-4" />,
      user: <User className="h-4 w-4" />,
      dept: <Building className="h-4 w-4" />,
      location: <MapPin className="h-4 w-4" />,
      note: <Info className="h-4 w-4" />,
      default: <Info className="h-4 w-4" />
    };

    // Find matching icon based on key
    for (const [pattern, icon] of Object.entries(iconMap)) {
      if (pattern !== 'default' && key.toLowerCase().includes(pattern)) {
        return icon;
      }
    }
    
    return iconMap.default;
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>
        {t('common.close', "Close")}
      </Button>
      <Button onClick={onEdit}>
        {t('common.edit', "Edit")}
      </Button>
    </>
  );

  return (
    <AssetDialog
      title={t('assets.view.title', `{0} Details`, title)}
      description={t('assets.view.description', 'View the complete details of this asset.')}
      isOpen={isOpen}
      onClose={onClose}
      footer={footer}
      size="lg"
    >
      <div className="space-y-6">
        {/* Asset Information Section */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">{t('assets.view.assetInfo', 'Asset Information')}</h3>
          </div>
          <div className="p-4">
            <div className="grid gap-4">
              {columns.map((column) => (
                <div key={column.key} className="flex items-start gap-3 py-2">
                  <div className="mt-0.5 text-muted-foreground">
                    {getFieldIcon(column.key)}
                  </div>
                  <div className="grid gap-1 flex-1">
                    <div className="text-sm font-medium leading-none text-muted-foreground">
                      {t(`assets.${column.key}`, column.label)}
                    </div>
                    <div className="text-sm">
                      {column.render 
                        ? column.render(asset[column.key]) 
                        : formatValue(column.key, asset[column.key])}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* System Information Section */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold">{t('assets.view.systemInfo', 'System Information')}</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 py-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div className="grid gap-1">
                  <div className="text-sm font-medium leading-none text-muted-foreground">
                    ID
                  </div>
                  <div className="text-sm font-mono text-xs break-all">
                    {asset.id}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="grid gap-1">
                  <div className="text-sm font-medium leading-none text-muted-foreground">
                    {t('assets.view.createdAt', 'Created At')}
                  </div>
                  <div className="text-sm">
                    {asset.createdAt ? formatDate(asset.createdAt) : '-'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="grid gap-1">
                  <div className="text-sm font-medium leading-none text-muted-foreground">
                    {t('assets.view.updatedAt', 'Updated At')}
                  </div>
                  <div className="text-sm">
                    {asset.updatedAt ? formatDate(asset.updatedAt) : '-'}
                  </div>
                </div>
              </div>
              {asset.tenantId && (
                <div className="flex items-center gap-3 py-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div className="grid gap-1">
                    <div className="text-sm font-medium leading-none text-muted-foreground">
                      {t('assets.view.tenantId', 'Tenant ID')}
                    </div>
                    <div className="text-sm font-mono text-xs break-all">
                      {asset.tenantId}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AssetDialog>
  );
}