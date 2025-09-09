'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTenants, useCreateTenant, useDeleteTenant, useBulkDeleteTenants } from "@/hooks/useApi"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { TenantsTable } from "@/components/tenants/tenants-table"
import { TenantForm } from "@/components/tenants/tenant-form"
import { ConfirmDialog } from "@/components/tenants/confirm-dialog"
import { BulkDeleteDialog } from "@/components/tenants/bulk-delete-dialog"
import { TenantFormValues } from "@/components/tenants/types"
import { Tenant } from "@/hooks/useApi"
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Building as BuildingIcon } from "lucide-react"
import { useCurrentUser } from '@/hooks/useApi'
import apiClient from '@/lib/api'

export default function TenantsPage() {
  const { t } = useTranslation()
  const { 
    userRole,
    canViewTenants, 
    canCreateTenants, 
    canEditTenants, 
    canDeleteTenants, 
    canBulkDeleteTenants 
  } = usePermissions()
  
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
  const isComponentMounted = useRef(true)
  
  // Clean up ref on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false
    }
  }, [])
  
  const queryClient = useQueryClient()
  const { data: tenantsData = [], isLoading, isError, error, refetch } = useTenants()
  const createTenantMutation = useCreateTenant()
  const deleteMutation = useDeleteTenant('') // Placeholder, will be overridden when used
  const bulkDeleteMutation = useBulkDeleteTenants()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  
  // Manage the ID for delete operations in state
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null)
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null)
  
  // State for bulk delete operations
  const [bulkDeleteTenantIds, setBulkDeleteTenantIds] = useState<string[]>([])
  
  // Confirmation dialog states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  
  // Permission states
  const [canView, setCanView] = useState<boolean | null>(null) // null means still checking
  const [canCreate, setCanCreate] = useState<boolean | null>(null)
  const [canEdit, setCanEdit] = useState<boolean | null>(null)
  const [canDelete, setCanDelete] = useState<boolean | null>(null)
  const [canBulkDelete, setCanBulkDelete] = useState<boolean | null>(null)
  
  // Ref to track if permission check is in progress
  const isCheckingPermissions = useRef(false)

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
        console.log('=== TENANT PERMISSION CHECKING STARTED ===');
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
            canViewTenants(),
            canCreateTenants(),
            canEditTenants(),
            canDeleteTenants(),
            canBulkDeleteTenants()
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
            setCanBulkDelete(false)
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
        console.log('=== TENANT PERMISSION CHECKING FINISHED ===');
      }
    };
    
    checkPermissions();
    
    return () => {
      console.log('Cleaning up permission checking');
      isCancelledRef.current = true;
      // Reset the permission checking flag when component unmounts
      isCheckingPermissions.current = false;
    };
  }, [userRole, canViewTenants, canCreateTenants, canEditTenants, canDeleteTenants, canBulkDeleteTenants, currentUser, isUserLoading]);

  // Show loading state while checking permissions
  if (canView === null || isUserLoading) {
    console.log('Showing loading state:', { canView, isUserLoading });
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
    console.log('Showing unauthorized message. Permission state:', { canView, isUserLoading });
    console.log('User data at time of denial:', currentUser);
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-center">
          <p className="text-red-500">{t('common.unauthorized') || 'You do not have permission to view this page'}</p>
        </div>
      </div>
    )
  }

  const handleEdit = async (tenant: Tenant | null) => {
    try {
      // Only check permissions if user data is fully loaded
      if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
        const hasEditPermission = await canEditTenants()
        const hasCreatePermission = await canCreateTenants()
        
        if (tenant && !hasEditPermission) {
          toast.error(t('tenants.edit.unauthorized') || 'You do not have permission to edit tenants')
          return
        }
        if (!tenant && !hasCreatePermission) {
          toast.error(t('tenants.create.unauthorized') || 'You do not have permission to create tenants')
          return
        }
      }
      setEditingTenant(tenant)
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error checking edit permissions:', error)
      // Allow the action by default if there's an error
      setEditingTenant(tenant)
      setIsDialogOpen(true)
    }
  }

  const handleDelete = async (id: string | string[]) => {
    try {
      // Only check permissions if user data is fully loaded
      if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
        // Check if it's a bulk delete (array of IDs)
        if (Array.isArray(id)) {
          const hasBulkDeletePermission = await canBulkDeleteTenants()
          
          if (!hasBulkDeletePermission) {
            toast.error(t('tenants.bulkDelete.unauthorized') || 'You do not have permission to bulk delete tenants')
            return
          }
          
          // Handle bulk delete
          setBulkDeleteTenantIds(id)
          setIsBulkDeleteConfirmOpen(true)
        } else {
          const hasDeletePermission = await canDeleteTenants()
          
          if (!hasDeletePermission) {
            toast.error(t('tenants.delete.unauthorized') || 'You do not have permission to delete tenants')
            return
          }
          
          // Handle single delete
          setDeleteTenantId(id)
          // Find the tenant to display in the confirmation dialog
          const tenant = tenantsData.find(t => t.id === id)
          setTenantToDelete(tenant || null)
          setIsDeleteConfirmOpen(true)
        }
      }
    } catch (error) {
      console.error('Error in handleDelete:', error)
      toast.error(t('common.error') || 'An error occurred while checking permissions')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTenantId) return
    
    try {
      console.log('Sending delete request for tenant ID:', deleteTenantId);
      await deleteMutation.mutateAsync(deleteTenantId)
      toast.success(t('tenants.delete.success') || 'Tenant deleted successfully')
      refetch()
    } catch (error: any) {
      console.error('Delete error:', error);
      // Provide more specific error messages
      if (error.status === 404) {
        toast.error(t('tenants.delete.notFound') || 'Tenant not found. It may have already been deleted.')
      } else if (error.status === 403) {
        toast.error(t('tenants.delete.forbidden') || 'You do not have permission to delete this tenant.')
      } else if (error.status === 400) {
        toast.error(error.message || t('tenants.delete.hasData') || 'Cannot delete tenant with associated data. Please delete all associated users and assets first.')
      } else {
        toast.error(error.message || t('tenants.delete.error') || 'Failed to delete tenant')
      }
    } finally {
      setIsDeleteConfirmOpen(false)
      setDeleteTenantId(null)
      setTenantToDelete(null)
    }
  }

  const confirmBulkDelete = async () => {
    try {
      console.log('Sending bulk delete request with IDs:', bulkDeleteTenantIds);
      await bulkDeleteMutation.mutateAsync({ ids: bulkDeleteTenantIds })
      toast.success(t('tenants.bulkDelete.success', '{0} tenants deleted successfully', bulkDeleteTenantIds.length.toString()) || 
                   `${bulkDeleteTenantIds.length} tenants deleted successfully`)
      refetch()
    } catch (error: any) {
      console.error('Bulk delete error:', error);
      // Provide more specific error messages for bulk delete
      if (error.status === 404) {
        toast.error(t('tenants.bulkDelete.notFound') || 'One or more tenants not found. They may have already been deleted.')
      } else if (error.status === 403) {
        toast.error(t('tenants.bulkDelete.forbidden') || 'You do not have permission to delete these tenants.')
      } else if (error.status === 400) {
        toast.error(error.message || t('tenants.bulkDelete.hasData') || 'Cannot delete tenants with associated data. Please delete all associated users and assets first.')
      } else {
        toast.error(error.message || t('tenants.bulkDelete.error') || 'Failed to delete tenants')
      }
    } finally {
      setIsBulkDeleteConfirmOpen(false)
      setBulkDeleteTenantIds([])
    }
  }

  const handleSubmit = async (data: TenantFormValues) => {
    try {
      if (editingTenant) {
        // Only check permissions if user data is fully loaded
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          const hasEditPermission = await canEditTenants()
          if (!hasEditPermission) {
            toast.error(t('tenants.update.unauthorized') || 'You do not have permission to update tenants')
            return
          }
        }
        // Update existing tenant using Axios instead of the hook
        try {
          const response = await apiClient.put(`/tenants/${editingTenant.id}`, {
            name: data.name,
            description: data.description,
          });

          if (response.status !== 200) {
            throw new Error(response.data.error || 'Failed to update tenant');
          }          
          toast.success(t('tenants.update.success') || 'Tenant updated successfully')
          setIsDialogOpen(false)
          setEditingTenant(null) // Clear the editing tenant state
          // Invalidate the tenants query to force a refresh
          await queryClient.invalidateQueries({ queryKey: ['tenants'] })
          // Also invalidate the specific tenant query
          await queryClient.invalidateQueries({ queryKey: ['tenants', editingTenant.id] })
        } catch (error: any) {
          toast.error(error.message || t('tenants.update.error') || 'Failed to update tenant')
        }
      } else {
        // Only check permissions if user data is fully loaded
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          const hasCreatePermission = await canCreateTenants()
          if (!hasCreatePermission) {
            toast.error(t('tenants.create.unauthorized') || 'You do not have permission to create tenants')
            return
          }
        }
        // Create new tenant
        try {
          await createTenantMutation.mutateAsync({
            name: data.name,
            description: data.description,
          })
          toast.success(t('tenants.create.success') || 'Tenant created successfully')
          setIsDialogOpen(false)
          // Invalidate the tenants query to force a refresh
          await queryClient.invalidateQueries({ queryKey: ['tenants'] })
        } catch (error: any) {
          toast.error(error.message || t('tenants.create.error') || 'Failed to create tenant')
        }
      }
    } catch (error: any) {
      toast.error(error.message || (editingTenant 
        ? t('tenants.update.error') || 'Failed to update tenant' 
        : t('tenants.create.error') || 'Failed to create tenant'))
    }
  }

  // Reset editing state when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingTenant(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (isError) {
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
            tenants={tenantsData}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete || canBulkDelete ? handleDelete : undefined}
            isDeleting={deleteMutation.isPending || bulkDeleteMutation.isPending}
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
          isSubmitting={createTenantMutation.isPending || (editingTenant ? false : false)}
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
        isDeleting={bulkDeleteMutation.isPending}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={confirmBulkDelete}
      />
    </div>
  )
}