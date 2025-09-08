'use client'

import { useState, useEffect, useRef } from 'react'
import { AssetList } from "@/components/assets/asset-list";
import { AssetListSkeleton } from "@/components/assets/asset-list-skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { getAssetTypes } from "@/config/asset-types";
import { usePermissions } from "@/hooks/use-permissions";
import { useCurrentUser } from '@/hooks/useApi';
import { Suspense } from "react";

export default function PCAssetsPage() {
  const { t, loading } = useTranslation();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const isComponentMounted = useRef(true);
  
  // Asset-specific permissions
  const { 
    canViewPC, 
    canCreatePC, 
    canEditPC, 
    canDeletePC, 
    canBulkDeletePC 
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
        console.log('Permission check already in progress, skipping');
        return;
      }
      
      try {
        isCheckingPermissions.current = true;
        console.log('=== PC ASSETS PERMISSION CHECKING STARTED ===');
        console.log('User loading state:', isUserLoading);
        console.log('Current user data:', currentUser);
        
        // Only check permissions if user data is fully loaded
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          console.log('User data fully loaded, checking permissions for user:', {
            email: currentUser.email,
            role: currentUser.role.name,
            roleId: currentUser.role.id,
            tenantId: currentUser.tenantId
          });
          
          // Check all permissions in parallel for better performance
          console.log('Starting parallel permission checks...');
          const startTime = Date.now();
          const [
            viewPermission,
            createPermission,
            editPermission,
            deletePermission,
            bulkDeletePermission
          ] = await Promise.all([
            canViewPC(),
            canCreatePC(),
            canEditPC(),
            canDeletePC(),
            canBulkDeletePC()
          ]);
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log('Permission results:', { 
            viewPermission, 
            createPermission, 
            editPermission, 
            deletePermission,
            bulkDeletePermission,
            duration: `${duration}ms`
          });
          
          // Only update state if component is still mounted
          if (!isCancelledRef.current) {
            console.log('Updating permission states...');
            setCanView(viewPermission);
            setCanCreate(createPermission);
            setCanEdit(editPermission);
            setCanDelete(deletePermission);
            setCanBulkDelete(bulkDeletePermission);
            console.log('Permission states updated:', {
              canView: viewPermission,
              canCreate: createPermission,
              canEdit: editPermission,
              canDelete: deletePermission,
              canBulkDelete: bulkDeletePermission
            });
          } else {
            console.log('Component was unmounted, skipping state update');
          }
        } else if (!isUserLoading && (!currentUser || !currentUser.role?.id || !currentUser.tenantId)) {
          // User data loaded but incomplete
          console.log('User data loaded but incomplete, denying permissions');
          console.log('Current user state:', { currentUser, hasRole: !!currentUser?.role?.id, hasTenant: !!currentUser?.tenantId });
          if (!isCancelledRef.current) {
            setCanView(false);
            setCanCreate(false);
            setCanEdit(false);
            setCanDelete(false);
            setCanBulkDelete(false);
          }
        } else {
          console.log('Still loading user data or user data not available yet');
        }
        // If still loading, do nothing
      } catch (error) {
        console.error('Error checking permissions:', error);
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
        console.log('=== PC ASSETS PERMISSION CHECKING FINISHED ===');
      }
    };
    
    checkPermissions();
    
    return () => {
      console.log('Cleaning up permission checking');
      isCancelledRef.current = true;
      // Reset the permission checking flag when component unmounts
      isCheckingPermissions.current = false;
    };
  }, [canViewPC, canCreatePC, canEditPC, canDeletePC, canBulkDeletePC, currentUser, isUserLoading]);

  // Get asset types configuration
  const assetTypes = getAssetTypes(t);
  const pcAssetType = assetTypes.find(type => type.key === "pc");
  
  if (!pcAssetType) {
    return <div>Asset type not found</div>;
  }

  // Show loading state while checking permissions
  if (canView === null || isUserLoading || loading) {
    console.log('Showing loading state:', { canView, isUserLoading, loading });
    return (
      <div className="flex items-center justify-center h-52">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user doesn't have view permission, show unauthorized message
  if (!canView) {
    console.log('Showing unauthorized message. Permission state:', { canView, isUserLoading });
    console.log('User data at time of denial:', currentUser);
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
        assetType="pc"
        title={t('assets.pc.title') || "PC"}
        columns={pcAssetType.columns}
        formFields={pcAssetType.formFields}
        canView={canView}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canBulkDelete={canBulkDelete}
      />
    </Suspense>
  );
}