'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTenants, useCreateTenant, useDeleteTenant, useBulkDeleteTenants, useUpdateTenant } from "@/hooks/useApi"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { TenantsTable } from "@/components/tenants/tenants-table"
import { TenantForm } from "@/components/tenants/tenant-form"
import { ConfirmDialog } from "@/components/tenants/confirm-dialog"
import { BulkDeleteDialog } from "@/components/tenants/bulk-delete-dialog"
import { Tenant } from "@/hooks/useApi"
import { Plus, Building as BuildingIcon } from "lucide-react"
import { useCurrentUser } from '@/hooks/useApi'
import logger from '@/lib/logger'

const Page = () => {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [bulkDeleteTenantIds, setBulkDeleteTenantIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  
  // Fetch tenants
  const { data: tenantsData, isLoading, error, refetch } = useTenants();
  
  // Tenant mutations
  const { createTenant } = useCreateTenant();
  const { updateTenant } = useUpdateTenant(editingTenant?.id || '');
  const { deleteTenant } = useDeleteTenant(deleteTenantId || '');
  const { bulkDeleteTenants } = useBulkDeleteTenants();
  
  // Check permissions
  const { canViewTenants, canCreateTenants, canEditTenants, canDeleteTenants, canBulkDeleteTenants, isLoading: isUserLoading } = usePermissions();
  
  const [canView, setCanView] = useState<boolean | null>(null);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [canEdit, setCanEdit] = useState<boolean | null>(null);
  const [canDelete, setCanDelete] = useState<boolean | null>(null);
  const [canBulkDelete, setCanBulkDelete] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const viewResult = await canViewTenants();
        setCanView(viewResult);
        
        const createResult = await canCreateTenants();
        setCanCreate(createResult);
        
        const editResult = await canEditTenants();
        setCanEdit(editResult);
        
        const deleteResult = await canDeleteTenants();
        setCanDelete(deleteResult);
        
        const bulkDeleteResult = await canBulkDeleteTenants();
        setCanBulkDelete(bulkDeleteResult);
      } catch (error) {
        logger.error('Error checking permissions:', error);
        setCanView(false);
        setCanCreate(false);
        setCanEdit(false);
        setCanDelete(false);
        setCanBulkDelete(false);
      }
    };
    
    checkPermissions();
  }, [canViewTenants, canCreateTenants, canEditTenants, canDeleteTenants, canBulkDeleteTenants]);
  
  // Get the tenant to delete for confirmation dialog
  const tenantToDelete = tenantsData?.find(tenant => tenant.id === deleteTenantId) || null;
  
  const handleEdit = (tenant: Tenant | null) => {
    setEditingTenant(tenant);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string | string[]) => {
    if (typeof id === 'string') {
      setDeleteTenantId(id);
      setIsDeleteConfirmOpen(true);
    }
  };
  
  const confirmDelete = async () => {
    if (!deleteTenantId) return;
    
    try {
      await deleteTenant();
      toast.success(t('tenants.delete.success') || 'Tenant deleted successfully');
      setIsDeleteConfirmOpen(false);
      setDeleteTenantId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || t('tenants.delete.error') || 'Failed to delete tenant');
    }
  };
  
  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteTenants(bulkDeleteTenantIds);
      toast.success(t('tenants.bulkDelete.success') || 'Tenants deleted successfully');
      setIsBulkDeleteConfirmOpen(false);
      setBulkDeleteTenantIds([]);
      refetch();
    } catch (error: any) {
      toast.error(error.message || t('tenants.bulkDelete.error') || 'Failed to delete tenants');
    }
  };
  
  const handleSubmit = async (data: Partial<Tenant>) => {
    try {
      if (editingTenant) {
        try {
          await updateTenant(data);
          toast.success(t('tenants.update.success') || 'Tenant updated successfully');
          setIsDialogOpen(false);
          setEditingTenant(null);
          refetch();
        } catch (error: any) {
          toast.error(error.message || t('tenants.update.error') || 'Failed to update tenant');
        }
      } else {
        try {
          await createTenant(data);
          toast.success(t('tenants.create.success') || 'Tenant created successfully');
          setIsDialogOpen(false);
          refetch();
        } catch (error: any) {
          toast.error(error.message || t('tenants.create.error') || 'Failed to create tenant');
        }
      }
    } catch (error: any) {
      toast.error(error.message || (editingTenant 
        ? t('tenants.update.error') || 'Failed to update tenant' 
        : t('tenants.create.error') || 'Failed to create tenant'));
    }
  };

  // Reset editing state when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingTenant(null);
    }
  };

  // Show loading state while checking permissions
  if (canView === null || isUserLoading) {
    logger.debug('Showing loading state:', { canView, isUserLoading });
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-center">
          <p>Loading permissions...</p>
        </div>
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
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-center">
          <p className="text-red-500">{t('tenants.error.loading') || 'Failed to load tenants'}</p>
          <p className="text-sm text-muted-foreground mt-2">{error?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          <BuildingIcon className="h-8 w-8 mr-3 text-blue-500" />
          {t('tenants.title') || 'Tenants'}
        </h1>
        <p className="text-muted-foreground">{t('tenants.description') || 'Manage tenant organizations'}</p>
      </div>

      <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{t('tenants.list.title') || 'Tenant List'}</CardTitle>
              <CardDescription>
                {t('tenants.list.description') || 'A list of all tenant organizations'}
              </CardDescription>
            </div>
            {canCreate && (
              <Button onClick={() => handleEdit(null)} className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('tenants.create.button') || 'Add Tenant'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TenantsTable 
            tenants={tenantsData || []}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={(canDelete || canBulkDelete) ? handleDelete : undefined}
            isDeleting={false}
            deletingTenantId={deleteTenantId}
          />
        </CardContent>
      </Card>

      {(canCreate || canEdit) && (
        <TenantForm
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          editingTenant={editingTenant}
          onSubmit={handleSubmit}
          isSubmitting={false}
        />
      )}
      
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={t('tenants.delete.confirmTitle') || 'Delete Tenant'}
        description={t('tenants.delete.confirmDescription', 'Are you sure you want to delete tenant {0}?', tenantToDelete?.name || 'this tenant') || 
                    `Are you sure you want to delete tenant ${tenantToDelete?.name || 'this tenant'}? This action cannot be undone.`}
        confirmText={t('common.delete') || 'Delete'}
        cancelText={t('common.cancel') || 'Cancel'}
        onConfirm={confirmDelete}
        isLoading={false}
      />
      
      <BulkDeleteDialog
        title={t('tenants.title') || 'Tenants'}
        count={bulkDeleteTenantIds.length}
        isOpen={isBulkDeleteConfirmOpen}
        isDeleting={false}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={confirmBulkDelete}
      />
    </div>
  )
}

export default Page;
