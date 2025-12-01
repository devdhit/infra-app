'use client'

import { useState, useEffect, useRef } from 'react'
import { AssetList } from "@/components/assets/asset-list";
import { AssetListSkeleton } from "@/components/assets/asset-list-skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { LoadingLayout } from "@/components/ui/loading-layout";
import { getAssetTypes } from "@/config/asset-types";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentUser } from '@/hooks/useApi';
import { Suspense } from "react";
import logger from '@/lib/logger';

export default function ITPurchasingPage() {
  const { t, loading } = useTranslation();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const isComponentMounted = useRef(true);
  
  // Asset-specific permissions
  const { 
    canViewITPurchasing, 
    canCreateITPurchasing, 
    canEditITPurchasing, 
    canDeleteITPurchasing, 
    canBulkDeleteITPurchasing 
  } = usePermissions();
  
  // Permission states
  const [canView, setCanView] = useState<boolean | null>(null);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [canEdit, setCanEdit] = useState<boolean | null>(null);
  const [canDelete, setCanDelete] = useState<boolean | null>(null);
  const [canBulkDelete, setCanBulkDelete] = useState<boolean | null>(null);
  
  // Ref to track if permission check is in progress
  const isCheckingPermissions = useRef(false);

  // Clean up ref on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false;
    };
  }, []);

  // Check permissions
  useEffect(() => {
    const isCancelledRef = { current: false };
    
    const checkPermissions = async () => {
      if (isCheckingPermissions.current) {
        return;
      }
      
      try {
        isCheckingPermissions.current = true;
        
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          const [
            viewPermission,
            createPermission,
            editPermission,
            deletePermission,
            bulkDeletePermission
          ] = await Promise.all([
            canViewITPurchasing(),
            canCreateITPurchasing(),
            canEditITPurchasing(),
            canDeleteITPurchasing(),
            canBulkDeleteITPurchasing()
          ]);
          
          if (!isCancelledRef.current) {
            setCanView(viewPermission);
            setCanCreate(createPermission);
            setCanEdit(editPermission);
            setCanDelete(deletePermission);
            setCanBulkDelete(bulkDeletePermission);
          }
        } else if (!isUserLoading && (!currentUser || !currentUser.role?.id || !currentUser.tenantId)) {
          if (!isCancelledRef.current) {
            setCanView(false);
            setCanCreate(false);
            setCanEdit(false);
            setCanDelete(false);
            setCanBulkDelete(false);
          }
        }
      } catch (error) {
        logger.error('Error checking permissions:', error);
        if (!isCancelledRef.current) {
          setCanView(false);
          setCanCreate(false);
          setCanEdit(false);
          setCanDelete(false);
          setCanBulkDelete(false);
        }
      } finally {
        isCheckingPermissions.current = false;
      }
    };
    
    checkPermissions();
    
    return () => {
      isCancelledRef.current = true;
      isCheckingPermissions.current = false;
    };
  }, [canViewITPurchasing, canCreateITPurchasing, canEditITPurchasing, canDeleteITPurchasing, canBulkDeleteITPurchasing, currentUser, isUserLoading]);

  // Get asset types configuration
  const assetTypes = getAssetTypes(t);
  const itPurchasingType = assetTypes.find(type => type.key === "it-purchasing");
  
  if (!itPurchasingType) {
    return <div>Asset type not found</div>;
  }

  // Show loading state while checking permissions
  if (canView === null || isUserLoading || loading) {
    return (
      <LoadingLayout size="md" height="md" />
    );
  }

  // If user doesn't have view permission, show unauthorized message
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-center">
          <p className="text-red-500">{t('common.unauthorized') || 'You do not have permission to view this page'}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<AssetListSkeleton />}>
      <AssetList
        key="it-purchasing"
        assetType="it-purchasing"
        title={t('assets.itPurchasing.title') || "IT Purchasing"}
        columns={itPurchasingType.columns}
        formFields={itPurchasingType.formFields}
        canView={canView}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canBulkDelete={canBulkDelete}
      />
    </Suspense>
  );
}
