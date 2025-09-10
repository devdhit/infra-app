'use client'

import { useState, useEffect, useRef } from 'react'
import { AssetList } from "@/components/assets/asset-list";
import { AssetListSkeleton } from "@/components/assets/asset-list-skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { getAssetTypes } from "@/config/asset-types";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentUser } from '@/hooks/useApi';
import { Suspense } from "react";
import logger from '@/lib/logger';

export default function WarehouseAssetsPage() {
  const { t, loading } = useTranslation();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const isComponentMounted = useRef(true);
  
  // Asset-specific permissions
  const { 
    canViewWarehouse, 
    canCreateWarehouse, 
    canEditWarehouse, 
    canDeleteWarehouse, 
    canBulkDeleteWarehouse 
  } = usePermissions();
  
  // Permission states
  const [canView, setCanView] = useState<boolean | null>(null); // null means still checking
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
      // Prevent multiple simultaneous permission checks
      if (isCheckingPermissions.current) {
        logger.debug('Permission check already in progress, skipping');
        return;
      }
      
      try {
        isCheckingPermissions.current = true;
        logger.debug('=== WAREHOUSE ASSETS PERMISSION CHECKING STARTED ===');
        logger.debug('User loading state:', isUserLoading);
        logger.debug('Current user data:', currentUser);
        
        // Only check permissions if user data is fully loaded
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          logger.debug('User data fully loaded, checking permissions for user:', {
            email: currentUser.email,
            role: currentUser.role.name,
            roleId: currentUser.role.id,
            tenantId: currentUser.tenantId
          });
          
          // Check all permissions in parallel for better performance
          logger.debug('Starting parallel permission checks...');
          const startTime = Date.now();
          const [
            viewPermission,
            createPermission,
            editPermission,
            deletePermission,
            bulkDeletePermission
          ] = await Promise.all([
            canViewWarehouse(),
            canCreateWarehouse(),
            canEditWarehouse(),
            canDeleteWarehouse(),
            canBulkDeleteWarehouse()
          ]);
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          logger.debug('Permission results:', { 
            viewPermission, 
            createPermission, 
            editPermission, 
            deletePermission,
            bulkDeletePermission,
            duration: `${duration}ms`
          });
          
          // Only update state if component is still mounted
          if (!isCancelledRef.current) {
            logger.debug('Updating permission states...');
            setCanView(viewPermission);
            setCanCreate(createPermission);
            setCanEdit(editPermission);
            setCanDelete(deletePermission);
            setCanBulkDelete(bulkDeletePermission);
            logger.debug('Permission states updated:', {
              canView: viewPermission,
              canCreate: createPermission,
              canEdit: editPermission,
              canDelete: deletePermission,
              canBulkDelete: bulkDeletePermission
            });
          } else {
            logger.debug('Component was unmounted, skipping state update');
          }
        } else if (!isUserLoading && (!currentUser || !currentUser.role?.id || !currentUser.tenantId)) {
          // User data loaded but incomplete
          logger.debug('User data loaded but incomplete, denying permissions');
          logger.debug('Current user state:', { currentUser, hasRole: !!currentUser?.role?.id, hasTenant: !!currentUser?.tenantId });
          if (!isCancelledRef.current) {
            setCanView(false);
            setCanCreate(false);
            setCanEdit(false);
            setCanDelete(false);
            setCanBulkDelete(false);
          }
        } else {
          logger.debug('Still loading user data or user data not available yet');
        }
        // If still loading, do nothing
      } catch (error) {
        logger.error('Error checking permissions:', error);
        // Deny access if there's an error
        if (!isCancelledRef.current) {
          setCanView(false);
          setCanCreate(false);
          setCanEdit(false);
          setCanDelete(false);
          setCanBulkDelete(false);
        }
      } finally {
        isCheckingPermissions.current = false;
        logger.debug('=== WAREHOUSE ASSETS PERMISSION CHECKING FINISHED ===');
      }
    };
    
    checkPermissions();
    
    return () => {
      logger.debug('Cleaning up permission checking');
      isCancelledRef.current = true;
      // Reset the permission checking flag when component unmounts
      isCheckingPermissions.current = false;
    };
  }, [canViewWarehouse, canCreateWarehouse, canEditWarehouse, canDeleteWarehouse, canBulkDeleteWarehouse, currentUser, isUserLoading]);

  // Get asset types configuration
  const assetTypes = getAssetTypes(t);
  const warehouseAssetType = assetTypes.find(type => type.key === "warehouse");
  
  if (!warehouseAssetType) {
    return <div>Asset type not found</div>;
  }

  // Show loading state while checking permissions
  if (canView === null || isUserLoading || loading) {
    logger.debug('Showing loading state:', { canView, isUserLoading, loading });
    return (
      <div className="flex items-center justify-center h-52">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user doesn't have view permission, show unauthorized message
  if (!canView) {
    logger.debug('Showing unauthorized message. Permission state:', { canView, isUserLoading });
    logger.debug('User data at time of denial:', currentUser);
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-center">
          <p className="text-red-500">{t('common.unauthorized') || 'You do not have permission to view this page'}</p>
        </div>
      </div>
    );
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
        key="warehouse" // Add key prop to ensure proper re-rendering when switching asset types
        assetType="warehouse"
        title={t('assets.warehouse.title') || "Warehouse"}
        columns={warehouseAssetType.columns}
        formFields={warehouseAssetType.formFields}
        canView={canView}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canBulkDelete={canBulkDelete}
      />
    </Suspense>
  );
}