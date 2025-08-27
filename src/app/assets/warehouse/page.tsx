'use client'

import { AssetList } from "@/components/assets/asset-list";
import { useTranslation } from "@/hooks/use-translation";
import { getAssetTypes } from "@/config/asset-types";

export default function WarehouseAssetsPage() {
  const { t, loading } = useTranslation();
  
  // Get asset types configuration
  const assetTypes = getAssetTypes(t);
  const warehouseAssetType = assetTypes.find(type => type.key === "warehouse");
  
  if (!warehouseAssetType) {
    return <div>Asset type not found</div>;
  }

  // Show loading state while translations are loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AssetList
      assetType="warehouse"
      title={t('assets.warehouse.title') || "Warehouse IT"}
      columns={warehouseAssetType.columns}
      formFields={warehouseAssetType.formFields}
    />
  );
}
