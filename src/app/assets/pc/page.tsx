'use client'

import { AssetList } from "@/components/assets/asset-list";
import { AssetListSkeleton } from "@/components/assets/asset-list-skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { getAssetTypes } from "@/config/asset-types";
import { Suspense } from "react";

export default function PCAssetsPage() {
  const { t, loading } = useTranslation();
  
  // Get asset types configuration
  const assetTypes = getAssetTypes(t);
  const pcAssetType = assetTypes.find(type => type.key === "pc");
  
  if (!pcAssetType) {
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
    <Suspense fallback={<AssetListSkeleton />}>
      <AssetList
        assetType="pc"
        title={t('assets.pc.title') || "PC"}
        columns={pcAssetType.columns}
        formFields={pcAssetType.formFields}
      />
    </Suspense>
  );
}