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
import { toast } from "sonner"
import { TenantsTable } from "@/components/tenants/tenants-table"
import { TenantForm } from "@/components/tenants/tenant-form"
import { TenantFormValues } from "@/components/tenants/types"
import { Tenant } from "@/hooks/useApi"

export default function TenantsPage() {
  const { t } = useTranslation()
  const { data: tenants = [], isLoading, isError, error, refetch } = useTenants()
  const createTenantMutation = useCreateTenant()
  const updateTenantMutation = useUpdateTenant('')
  const deleteMutation = useDeleteTenant('')
  const bulkDeleteMutation = useBulkDeleteTenants()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null)

  const handleEdit = (tenant: Tenant | null) => {
    setEditingTenant(tenant)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    // Check if it's a bulk delete (comma-separated IDs)
    if (id.includes(',')) {
      // Handle bulk delete
      const ids = id.split(',')
      if (window.confirm(t('tenants.bulkDelete.confirm', 'Are you sure you want to delete {0} tenants?', ids.length.toString()) || 
          `Are you sure you want to delete ${ids.length} tenants?`)) {
        bulkDeleteMutation.mutate({ ids }, {
          onSuccess: () => {
            toast.success(t('tenants.bulkDelete.success', '{0} tenants deleted successfully', ids.length.toString()) || 
                         `${ids.length} tenants deleted successfully`)
            refetch()
          },
          onError: (error: any) => {
            toast.error(error.message || t('tenants.bulkDelete.error') || 'Failed to delete tenants')
          }
        })
      }
    } else {
      // Handle single delete
      setDeleteTenantId(id)
      if (window.confirm(t('tenants.delete.confirm') || 'Are you sure you want to delete this tenant? This action cannot be undone.')) {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            toast.success(t('tenants.delete.success') || 'Tenant deleted successfully')
            refetch()
          },
          onError: (error: any) => {
            toast.error(error.message || t('tenants.delete.error') || 'Failed to delete tenant')
          }
        })
      }
    }
  }

  const handleSubmit = async (data: TenantFormValues) => {
    try {
      if (editingTenant) {
        // Update existing tenant
        await updateTenantMutation.mutateAsync({
          id: editingTenant.id,
          name: data.name,
          description: data.description,
        }, {
          onSuccess: () => {
            toast.success(t('tenants.update.success') || 'Tenant updated successfully')
            setIsDialogOpen(false)
            refetch()
          },
          onError: (error: any) => {
            toast.error(error.message || t('tenants.update.error') || 'Failed to update tenant')
          }
        })
      } else {
        // Create new tenant
        await createTenantMutation.mutateAsync({
          name: data.name,
          description: data.description,
        }, {
          onSuccess: () => {
            toast.success(t('tenants.create.success') || 'Tenant created successfully')
            setIsDialogOpen(false)
            refetch()
          },
          onError: (error: any) => {
            toast.error(error.message || t('tenants.create.error') || 'Failed to create tenant')
          }
        })
      }
    } catch (error: any) {
      toast.error(error.message || (editingTenant 
        ? t('tenants.update.error') || 'Failed to update tenant' 
        : t('tenants.create.error') || 'Failed to create tenant'))
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
          </div>
        </CardHeader>
        <CardContent>
          <TenantsTable 
            tenants={tenants}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending || bulkDeleteMutation.isPending}
            deletingTenantId={deleteTenantId}
          />
        </CardContent>
      </Card>

      <TenantForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingTenant={editingTenant}
        onSubmit={handleSubmit}
        isSubmitting={createTenantMutation.isPending || updateTenantMutation.isPending}
      />
    </div>
  )
}