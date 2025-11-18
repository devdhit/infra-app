'use client'

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { Asset, AssetColumn } from "@/types/assets";
import { formatDisplayDate, formatDate } from "@/lib/utils";
import { AssetDialog } from "./asset-dialog";
import { Calendar, Hash, Tag, User, Building, MapPin, Info } from "lucide-react";
import { AssetDetailSkeleton } from "./asset-detail-skeleton";
import { useAsset } from "@/hooks/useApi";
import { useEffect } from "react";
import { isCustomField, getFieldValue } from "@/lib/custom-fields";

interface AssetDetailProps {
  asset: Asset | null;
  title: string;
  columns: (AssetColumn & { originalKey?: string; isCustomField?: boolean })[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  assetType?: string;
}

export function AssetDetailDialog({
  asset,
  title,
  columns,
  isOpen,
  onClose,
  onEdit,
  assetType
}: AssetDetailProps) {
  const { t } = useTranslation();
  
  // If assetType and asset id are provided, we can refetch the asset when the dialog opens
  // This ensures we always have the latest data, including custom fields
  const { data: refreshedAsset, refetch } = useAsset<Asset>(
    assetType || '',
    asset?.id || ''
  );
  
  // Refetch when the dialog opens and asset changes
  useEffect(() => {
    if (isOpen && asset?.id && assetType) {
      refetch();
    }
  }, [isOpen, asset?.id, assetType, refetch]);
  
  // Use the refreshed asset data if available, otherwise fall back to the original asset
  const displayAsset = refreshedAsset || asset;

  // Show skeleton while loading
  if (!displayAsset && isOpen) {
    return <AssetDetailSkeleton title={title} fieldCount={columns.length} />;
  }

  if (!displayAsset) return null;

  // Handle edit action with automatic closing
  const handleEdit = () => {
    onEdit();
    // Close the dialog after a short delay to allow the edit dialog to open
    setTimeout(() => {
      onClose();
    }, 100);
  };

  // Helper function to format displayed values
  const formatValue = (key: string, value: any): React.ReactNode => {
    // Handle undefined or null values
    if (value === undefined || value === null) {
      return '-';
    }
    
    // Handle date fields
    if (key.toLowerCase().includes('date') && value) {
      try {
        return formatDisplayDate(value);
      } catch (e) {
        return value;
      }
    }
    
    // Handle status fields
    if (key === 'status' && typeof value === 'string') {
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass[value.toLowerCase() as keyof typeof statusClass] || ""}`}>
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
      if ('name' in value) {
        return value.name;
      }
      return JSON.stringify(value);
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // Default handling
    return String(value);
  };

  // Helper function to get icon for a field
  const getFieldIcon = (key: string) => {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('date') || keyLower.includes('created') || keyLower.includes('updated')) {
      return <Calendar className="h-4 w-4" />;
    }
    
    if (keyLower.includes('barcode') || keyLower.includes('code') || keyLower.includes('id')) {
      return <Hash className="h-4 w-4" />;
    }
    
    if (keyLower.includes('sap')) {
      return <Tag className="h-4 w-4" />;
    }
    
    if (keyLower.includes('user') || keyLower.includes('name')) {
      return <User className="h-4 w-4" />;
    }
    
    if (keyLower.includes('dept')) {
      return <Building className="h-4 w-4" />;
    }
    
    if (keyLower.includes('location')) {
      return <MapPin className="h-4 w-4" />;
    }
    
    if (keyLower.includes('note')) {
      return <Info className="h-4 w-4" />;
    }
    
    // Default icon
    return <Info className="h-4 w-4" />;
  };
  
  const footer = (
    <>
      <Button onClick={handleEdit}>
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
              {columns.map((column) => {
                // Extract the original key and custom field status
                const originalKey = column.originalKey || column.key;
                // Use the utility function to determine if this is a custom field
                const isCustom = isCustomField(originalKey, displayAsset, undefined) || column.isCustomField === true;
                
                // Get the value using the utility function
                const value = getFieldValue(originalKey, displayAsset, isCustom);
                
                // Use the unique key for React
                const uniqueKey = column.key;
                
                return (
                  <div key={uniqueKey} className="flex items-start gap-3 py-2">
                    <div className="mt-0.5 text-muted-foreground">
                      {getFieldIcon(originalKey)}
                    </div>
                    <div className="grid gap-1 flex-1">
                      <div className="text-sm font-medium leading-none text-muted-foreground">
                        {t(`assets.${originalKey}`, column.label)}
                        {isCustom && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-1 py-0.5 rounded">Custom</span>
                        )}
                      </div>
                      <div className="text-sm">
                        {column.render 
                          ? column.render(value) 
                          : formatValue(originalKey, value)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Internet Access Information Section - Only show for PC assets with internet access info */}
        {assetType === 'pc' && displayAsset.internetAccessInfo && (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">{t('assets.pc.internetAccessInfo', 'Internet Access Information')}</h3>
            </div>
            <div className="p-4">
              <div className="grid gap-4">
                {Array.isArray(displayAsset.internetAccessInfo) ? (
                  // Multiple Internet assets
                  displayAsset.internetAccessInfo.map((internetAsset: any, index: number) => (
                    <div key={internetAsset.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{t('assets.pc.internetAccessItem', 'Internet Access {0}', (index + 1).toString())}</h4>
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 py-1">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.internet.userName', 'User Name')}
                            </div>
                            <div className="text-sm">
                              {internetAsset.userName || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-1">
                          <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.internet.department', 'Department')}
                            </div>
                            <div className="text-sm">
                              {internetAsset.dept || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-1">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.internet.ipAddress', 'IP Address')}
                            </div>
                            <div className="text-sm">
                              {internetAsset.ipAddress || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-1">
                          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.internet.internetAccess', 'Internet Access')}
                            </div>
                            <div className="text-sm">
                              {internetAsset.internetAccess || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-1">
                          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.internet.status', 'Status')}
                            </div>
                            <div className="text-sm">
                              {internetAsset.status 
                                ? <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    internetAsset.status === 'working' ? 'bg-green-100 text-green-800' :
                                    internetAsset.status === 'leave' ? 'bg-blue-100 text-blue-800' :
                                    internetAsset.status === 'repair' ? 'bg-yellow-100 text-yellow-800' :
                                    internetAsset.status === '有異動' ? 'bg-purple-100 text-purple-800' : ''
                                  }`}>
                                    {t(`assets.status.${internetAsset.status}`, internetAsset.status)}
                                  </span>
                                : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Single Internet asset
                  <>
                    <div className="flex items-start gap-3 py-1">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.internet.userName', 'User Name')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.internetAccessInfo.userName || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-1">
                      <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.internet.department', 'Department')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.internetAccessInfo.dept || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-1">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.internet.ipAddress', 'IP Address')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.internetAccessInfo.ipAddress || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-1">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.internet.internetAccess', 'Internet Access')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.internetAccessInfo.internetAccess || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-1">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.internet.status', 'Status')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.internetAccessInfo.status 
                            ? <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                displayAsset.internetAccessInfo.status === 'working' ? 'bg-green-100 text-green-800' :
                                displayAsset.internetAccessInfo.status === 'leave' ? 'bg-blue-100 text-blue-800' :
                                displayAsset.internetAccessInfo.status === 'repair' ? 'bg-yellow-100 text-yellow-800' :
                                displayAsset.internetAccessInfo.status === '有異動' ? 'bg-purple-100 text-purple-800' : ''
                              }`}>
                                {t(`assets.status.${displayAsset.internetAccessInfo.status}`, displayAsset.internetAccessInfo.status)}
                              </span>
                            : '-'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Notification for PC assets without internet access */}
        {assetType === 'pc' && displayAsset.userName && !displayAsset.internetAccessInfo && (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">{t('assets.pc.internetAccessInfo', 'Internet Access Information')}</h3>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3 py-2">
                <Info className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="grid gap-1">
                  <div className="text-sm font-medium leading-none">
                    {t('assets.pc.noInternetAccess', 'No Internet Access Found')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t('assets.pc.noInternetAccessMessage', 'The user {0} does not have any associated internet access records.', displayAsset.userName)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* License Information Section - Only show for PC assets with license info */}
        {assetType === 'pc' && displayAsset.licenseInfo && (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">{t('assets.pc.licenseInfo', 'License Information')}</h3>
            </div>
            <div className="p-4">
              <div className="grid gap-4">
                {Array.isArray(displayAsset.licenseInfo) ? (
                  // Multiple License assets
                  displayAsset.licenseInfo.map((licenseAsset: any, index: number) => (
                    <div key={licenseAsset.id} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{t('assets.pc.licenseItem', 'License {0}', (index + 1).toString())}</h4>
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 py-1">
                          <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.license.userName', 'User Name')}
                            </div>
                            <div className="text-sm">
                              {licenseAsset.userName || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-1">
                          <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.license.department', 'Department')}
                            </div>
                            <div className="text-sm">
                              {licenseAsset.dept || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-1">
                          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.license.softwareName', 'Software Name')}
                            </div>
                            <div className="text-sm">
                              {licenseAsset.deviceName || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-1">
                          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.license.productType', 'Product Type')}
                            </div>
                            <div className="text-sm">
                              {licenseAsset.productType || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-1">
                          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.license.licenseKey', 'License Key')}
                            </div>
                            <div className="text-sm">
                              {licenseAsset.productKey || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-1">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.license.ip', 'IP Address')}
                            </div>
                            <div className="text-sm">
                              {licenseAsset.ip || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-1">
                          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="grid gap-1 flex-1">
                            <div className="text-sm font-medium leading-none text-muted-foreground">
                              {t('assets.license.status', 'Status')}
                            </div>
                            <div className="text-sm">
                              {licenseAsset.updateStatus 
                                ? <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    licenseAsset.updateStatus === 'working' ? 'bg-green-100 text-green-800' :
                                    licenseAsset.updateStatus === 'leave' ? 'bg-blue-100 text-blue-800' :
                                    licenseAsset.updateStatus === 'repair' ? 'bg-yellow-100 text-yellow-800' : ''
                                  }`}>
                                    {t(`assets.status.${licenseAsset.updateStatus}`, licenseAsset.updateStatus)}
                                  </span>
                                : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Single License asset
                  <>
                    <div className="flex items-start gap-3 py-1">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.license.userName', 'User Name')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.licenseInfo.userName || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-1">
                      <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.license.department', 'Department')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.licenseInfo.dept || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-1">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.license.softwareName', 'Software Name')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.licenseInfo.deviceName || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-1">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.license.productType', 'Product Type')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.licenseInfo.productType || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-1">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.license.licenseKey', 'License Key')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.licenseInfo.productKey || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-1">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.license.ip', 'IP Address')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.licenseInfo.ip || '-'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 py-1">
                      <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="grid gap-1 flex-1">
                        <div className="text-sm font-medium leading-none text-muted-foreground">
                          {t('assets.license.status', 'Status')}
                        </div>
                        <div className="text-sm">
                          {displayAsset.licenseInfo.updateStatus 
                            ? <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                displayAsset.licenseInfo.updateStatus === 'working' ? 'bg-green-100 text-green-800' :
                                displayAsset.licenseInfo.updateStatus === 'leave' ? 'bg-blue-100 text-blue-800' :
                                displayAsset.licenseInfo.updateStatus === 'repair' ? 'bg-yellow-100 text-yellow-800' : ''
                              }`}>
                                {t(`assets.status.${displayAsset.licenseInfo.updateStatus}`, displayAsset.licenseInfo.updateStatus)}
                              </span>
                            : '-'}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Notification for PC assets without license */}
        {assetType === 'pc' && (displayAsset.userName || displayAsset.customFields?.IP) && !displayAsset.licenseInfo && (
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">{t('assets.pc.licenseInfo', 'License Information')}</h3>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3 py-2">
                <Info className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="grid gap-1">
                  <div className="text-sm font-medium leading-none">
                    {t('assets.pc.noLicense', 'No License Found')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {displayAsset.userName && displayAsset.customFields?.IP
                      ? t('assets.pc.noLicenseMessage', 'The asset (IP: {0}, User: {1}) does not have any associated license records.', displayAsset.customFields.IP, displayAsset.userName)
                      : displayAsset.userName
                      ? t('assets.pc.noLicenseMessageUser', 'The user {0} does not have any associated license records.', displayAsset.userName)
                      : t('assets.pc.noLicenseMessageIP', 'The IP address {0} does not have any associated license records.', displayAsset.customFields?.IP || 'N/A')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    {displayAsset.id}
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
                    {displayAsset.createdAt ? formatDate(displayAsset.createdAt) : '-'}
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
                    {displayAsset.updatedAt ? formatDate(displayAsset.updatedAt) : '-'}
                  </div>
                </div>
              </div>
              {displayAsset.tenantId && (
                <div className="flex items-center gap-3 py-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div className="grid gap-1">
                    <div className="text-sm font-medium leading-none text-muted-foreground">
                      {t('assets.view.tenantId', 'Tenant ID')}
                    </div>
                    <div className="text-sm font-mono text-xs break-all">
                      {displayAsset.tenantId}
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
