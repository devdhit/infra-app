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
import { useTenants, useCreateTenant, useDeleteTenant, useBulkDeleteTenants } from "@/hooks/useApi"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { TenantsTable } from "@/components/tenants/tenants-table"
import { TenantForm } from "@/components/tenants/tenant-form"
import { TenantFormValues } from "@/components/tenants/types"
import { Tenant } from "@/hooks/useApi"
import { api } from "@/lib/api"
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Building as BuildingIcon } from "lucide-react"

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
  
  const queryClient = useQueryClient()
  const { data: tenantsData = [], isLoading, isError, error, refetch } = useTenants()
  const createTenantMutation = useCreateTenant()
  const deleteMutation = useDeleteTenant('') // Placeholder, will be overridden when used
  const bulkDeleteMutation = useBulkDeleteTenants()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null)
  
  // Permission states
  const [canView, setCanView] = useState<boolean>(false)
  const [canCreate, setCanCreate] = useState<boolean>(false)
  const [canEdit, setCanEdit] = useState<boolean>(false)
  const [canDelete, setCanDelete] = useState<boolean>(false)
  const [canBulkDelete, setCanBulkDelete] = useState<boolean>(false)

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Only check permissions if the hook is ready and userRole is available
        if (typeof window !== 'undefined' && userRole) {
          setCanView(await canViewTenants())
          setCanCreate(await canCreateTenants())
          setCanEdit(await canEditTenants())
          setCanDelete(await canDeleteTenants())
          setCanBulkDelete(await canBulkDeleteTenants())
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
        // Default to denying access if there's an error
        setCanView(false)
      }
    }
    
    checkPermissions()
  }, [userRole, canViewTenants, canCreateTenants, canEditTenants, canDeleteTenants, canBulkDeleteTenants])

  // If user doesn't have view permission, show unauthorized message
  if (!canView) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-center">
          <p className="text-red-500">{t('common.unauthorized') || 'You do not have permission to view this page'}</p>
        </div>
      </div>
    )
  }

  const handleEdit = async (tenant: Tenant | null) => {
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
    setEditingTenant(tenant)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const hasDeletePermission = await canDeleteTenants()
    const hasBulkDeletePermission = await canBulkDeleteTenants()
    
    // Check if it's a bulk delete (comma-separated IDs)
    if (id.includes(',')) {
      if (!hasBulkDeletePermission) {
        toast.error(t('tenants.bulkDelete.unauthorized') || 'You do not have permission to bulk delete tenants')
        return
      }
      // Handle bulk delete
      const ids = id.split(',')
      if (window.confirm(t('tenants.bulkDelete.confirm', 'Are you sure you want to delete {0} tenants?', ids.length.toString()) || 
          `Are you sure you want to delete ${ids.length} tenants?`)) {
        try {
          await bulkDeleteMutation.mutateAsync({ ids })
          toast.success(t('tenants.bulkDelete.success', '{0} tenants deleted successfully', ids.length.toString()) || 
                       `${ids.length} tenants deleted successfully`)
          refetch()
        } catch (error: any) {
          toast.error(error.message || t('tenants.bulkDelete.error') || 'Failed to delete tenants')
        }
      }
    } else {
      if (!hasDeletePermission) {
        toast.error(t('tenants.delete.unauthorized') || 'You do not have permission to delete tenants')
        return
      }
      // Handle single delete
      setDeleteTenantId(id)
      if (window.confirm(t('tenants.delete.confirm') || 'Are you sure you want to delete this tenant? This action cannot be undone.')) {
        try {
          await deleteMutation.mutateAsync(id)
          toast.success(t('tenants.delete.success') || 'Tenant deleted successfully')
          refetch()
        } catch (error: any) {
          toast.error(error.message || t('tenants.delete.error') || 'Failed to delete tenant')
        }
      }
    }
  }

  const handleSubmit = async (data: TenantFormValues) => {
    try {
      if (editingTenant) {
        const hasEditPermission = await canEditTenants()
        if (!hasEditPermission) {
          toast.error(t('tenants.update.unauthorized') || 'You do not have permission to update tenants')
          return
        }
        // Update existing tenant
        try {
          // Use the API client directly to make the PUT request with proper authentication
          await api.put<Tenant, Partial<TenantFormValues>>(`/tenants/${editingTenant.id}`, {
            name: data.name,
            description: data.description,
          });
          
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
        const hasCreatePermission = await canCreateTenants()
        if (!hasCreatePermission) {
          toast.error(t('tenants.create.unauthorized') || 'You do not have permission to create tenants')
          return
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
          isSubmitting={createTenantMutation.isPending || (editingTenant ? false : false)} // Simplified for now
        />
      )}
    </div>
  )
}