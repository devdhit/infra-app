'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant, useBulkDeleteTenants } from "@/hooks/useApi"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { TenantsTable } from "@/components/tenants/tenants-table"
import { TenantForm } from "@/components/tenants/tenant-form"
import { TenantFormValues } from "@/components/tenants/types"
import { Tenant } from "@/hooks/useApi"
import { api } from "@/lib/api"
import { useQueryClient } from '@tanstack/react-query'

export default function TenantsPage() {
  const { t } = useTranslation()
  const { checkPermission } = usePermissions()
  const queryClient = useQueryClient()
  const { data: tenantsData = [], isLoading, isError, error, refetch } = useTenants()
  const createTenantMutation = useCreateTenant()
  const updateTenantMutation = useUpdateTenant('') // Placeholder, will be overridden when used
  const deleteMutation = useDeleteTenant('') // Placeholder, will be overridden when used
  const bulkDeleteMutation = useBulkDeleteTenants()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null)

  // Check permissions
  const canViewTenants = checkPermission('tenants', 'view')
  const canCreateTenants = checkPermission('tenants', 'create')
  const canEditTenants = checkPermission('tenants', 'edit')
  const canDeleteTenants = checkPermission('tenants', 'delete')
  const canBulkDeleteTenants = checkPermission('tenants', 'bulkDelete')

  // If user doesn't have view permission, show unauthorized message
  if (!canViewTenants) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-center">
          <p className="text-red-500">{t('common.unauthorized') || 'You do not have permission to view this page'}</p>
        </div>
      </div>
    )
  }

  const handleEdit = (tenant: Tenant | null) => {
    if (tenant && !canEditTenants) {
      toast.error(t('tenants.edit.unauthorized') || 'You do not have permission to edit tenants')
      return
    }
    if (!tenant && !canCreateTenants) {
      toast.error(t('tenants.create.unauthorized') || 'You do not have permission to create tenants')
      return
    }
    setEditingTenant(tenant)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    // Check if it's a bulk delete (comma-separated IDs)
    if (id.includes(',')) {
      if (!canBulkDeleteTenants) {
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
      if (!canDeleteTenants) {
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
        if (!canEditTenants) {
          toast.error(t('tenants.update.unauthorized') || 'You do not have permission to update tenants')
          return
        }
        // Update existing tenant
        try {
          // Use the API client directly to make the PUT request with proper authentication
          const response = await api.put<Tenant, Partial<TenantFormValues>>(`/tenants/${editingTenant.id}`, {
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
        if (!canCreateTenants) {
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
        <h1 className="text-3xl font-bold">{t('tenants.title') || 'Tenants'}</h1>
        <p className="text-muted-foreground">{t('tenants.description') || 'Manage tenant organizations'}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{t('tenants.list.title') || 'Tenant List'}</CardTitle>
              <CardDescription>
                {t('tenants.list.description') || 'A list of all tenant organizations'}
              </CardDescription>
            </div>
            {canCreateTenants && (
              <Button onClick={() => handleEdit(null)}>
                {t('tenants.create.button') || 'Add Tenant'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <TenantsTable 
            tenants={tenantsData}
            onEdit={canEditTenants ? handleEdit : undefined}
            onDelete={canDeleteTenants || canBulkDeleteTenants ? handleDelete : undefined}
            isDeleting={deleteMutation.isPending || bulkDeleteMutation.isPending}
            deletingTenantId={deleteTenantId}
          />
        </CardContent>
      </Card>

      {(canCreateTenants || canEditTenants) && (
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