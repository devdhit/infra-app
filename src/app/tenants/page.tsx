'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useTenants, useCreateTenant, useDeleteTenant, useUpdateTenant } from "@/hooks/management"
import { useUsers } from "@/hooks/management"
import type { Tenant, CreateTenantData, UpdateTenantData } from "@/types/management"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { TenantsTable } from "@/components/tenants/tenants-table"
import { TenantForm } from "@/components/tenants/tenant-form"
import { ConfirmDialog } from "@/components/tenants/confirm-dialog"
import { BulkDeleteDialog } from "@/components/tenants/bulk-delete-dialog"
import { Plus, Building as BuildingIcon, Users as UsersIcon, Building2, CalendarDays } from "lucide-react"
import { useCurrentUser } from '@/hooks/useApi'
import { LoadingLayout } from '@/components/ui/loading-layout'
import logger from '@/lib/logger'
import { PageHeader } from "@/components/management/page-header"
import { StatCard } from "@/components/management/stat-card"
import { SearchBar } from "@/components/management/search-bar"
import { EmptyState } from "@/components/management/empty-state"

const Page = () => {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [bulkDeleteTenantIds, setBulkDeleteTenantIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  
  // Permission states
  const [canView, setCanView] = useState<boolean | null>(null);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [canEdit, setCanEdit] = useState<boolean | null>(null);
  const [canDelete, setCanDelete] = useState<boolean | null>(null);
  const [canBulkDelete, setCanBulkDelete] = useState<boolean | null>(null);
  
  // Fetch tenants
  const { data: tenantsResponse, isLoading, error, refetch } = useTenants();
  
  // Fetch users to get tenant stats
  const { data: usersResponse } = useUsers();
  
  // Memoize data arrays to prevent useMemo dependency issues
  const tenantsData = useMemo(() => tenantsResponse?.data || [], [tenantsResponse?.data]);
  const usersData = useMemo(() => usersResponse?.data || [], [usersResponse?.data]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtered tenants based on search
  const filteredTenants = useMemo(() => {
    return tenantsData.filter((tenant: Tenant) => {
      const matchesSearch = searchQuery === '' || 
        tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tenant.description && tenant.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [tenantsData, searchQuery]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const total = tenantsData.length;
    const totalUsers = usersData.length;
    const avgUsersPerTenant = total > 0 ? Math.round(totalUsers / total) : 0;
    
    // Get most recent tenant
    const sorted = [...tenantsData].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const newestTenant = sorted[0];
    const daysSinceLastCreated = newestTenant 
      ? Math.floor((Date.now() - new Date(newestTenant.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    return { total, totalUsers, avgUsersPerTenant, daysSinceLastCreated };
  }, [tenantsData, usersData]);
  
  // Tenant mutations
  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant(editingTenant?.id || '');
  const deleteTenantMutation = useDeleteTenant();
  
  // Get permission functions from usePermissions hook
  const { 
    canViewTenants, 
    canCreateTenants, 
    canEditTenants, 
    canDeleteTenants, 
    canBulkDeleteTenants,
    isLoading: isUserLoading 
  } = usePermissions();
  
  // Check permissions
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

  // Listen for tenants updates
  useEffect(() => {
    const handleTenantsUpdated = () => {
      refetch();
    };

    window.addEventListener('tenants-updated', handleTenantsUpdated);
    
    return () => {
      window.removeEventListener('tenants-updated', handleTenantsUpdated);
    };
  }, [refetch]);
  
  // Get the tenant to delete for confirmation dialog
  const tenantToDelete = tenantsData.find((tenant: Tenant) => tenant.id === deleteTenantId) || null;
  
  const handleEdit = (tenant: Tenant | null) => {
    setEditingTenant(tenant);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string | string[]) => {
    if (typeof id === 'string') {
      // Single tenant deletion
      setDeleteTenantId(id);
      setIsDeleteConfirmOpen(true);
    } else if (Array.isArray(id) && id.length > 0) {
      // Bulk tenant deletion
      setBulkDeleteTenantIds(id);
      setIsBulkDeleteConfirmOpen(true);
    }
  };
  
  const confirmDelete = async () => {
    if (!deleteTenantId) return;
    
    try {
      await deleteTenantMutation.mutate(deleteTenantId);
      toast.success(t('tenants.delete.success') || 'Tenant deleted successfully');
      setIsDeleteConfirmOpen(false);
      setDeleteTenantId(null);
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tenant';
      toast.error(errorMessage || t('tenants.delete.error'));
    }
  };
  
  const confirmBulkDelete = async () => {
    try {
      // Delete tenants one by one
      for (const id of bulkDeleteTenantIds) {
        await deleteTenantMutation.mutate(id);
      }
      toast.success(t('tenants.bulkDelete.success') || 'Tenants deleted successfully');
      setIsBulkDeleteConfirmOpen(false);
      setBulkDeleteTenantIds([]);
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tenants';
      toast.error(errorMessage || t('tenants.bulkDelete.error'));
    }
  };
  
  const handleSubmit = async (data: CreateTenantData | UpdateTenantData) => {
    try {
      if (editingTenant) {
        await updateTenantMutation.mutate(data as UpdateTenantData);
        toast.success(t('tenants.update.success') || 'Tenant updated successfully');
        setIsDialogOpen(false);
        setEditingTenant(null);
        refetch();
      } else {
        await createTenantMutation.mutate(data as CreateTenantData);
        toast.success(t('tenants.create.success') || 'Tenant created successfully');
        setIsDialogOpen(false);
        refetch();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
        (editingTenant ? 'Failed to update tenant' : 'Failed to create tenant');
      toast.error(errorMessage || (editingTenant 
        ? t('tenants.update.error') 
        : t('tenants.create.error')));
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
      <LoadingLayout 
        size="md" 
        height="md"
        loadingText={t('common.loadingPermissions')}
      />
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
      <LoadingLayout size="md" height="md" />
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
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title={t('tenants.title') || 'Tenants'}
        description={t('tenants.description') || 'Manage tenant organizations and their configurations'}
        icon={BuildingIcon}
        actions={
          <>
            {canCreate && (
              <Button onClick={() => handleEdit(null)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('tenants.create.button') || 'Add Tenant'}
              </Button>
            )}
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tenants"
          value={stats.total}
          description="Active organizations"
          icon={BuildingIcon}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description="Across all tenants"
          icon={UsersIcon}
          className="border-blue-200 dark:border-blue-900"
        />
        <StatCard
          title="Avg Users/Tenant"
          value={stats.avgUsersPerTenant}
          description="Average user count"
          icon={Building2}
          className="border-purple-200 dark:border-purple-900"
        />
        <StatCard
          title="Last Created"
          value={stats.daysSinceLastCreated === 0 ? 'Today' : `${stats.daysSinceLastCreated}d ago`}
          description="Most recent tenant"
          icon={CalendarDays}
          className="border-green-200 dark:border-green-900"
        />
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t('tenants.list.title') || 'All Tenants'}</CardTitle>
              <CardDescription>
                {filteredTenants.length} {filteredTenants.length === 1 ? 'tenant' : 'tenants'} found
              </CardDescription>
            </div>
            <SearchBar
              placeholder="Search by name or description..."
              onSearch={setSearchQuery}
              className="w-full md:w-[300px]"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredTenants.length === 0 ? (
            <EmptyState
              icon={BuildingIcon}
              title={searchQuery ? 'No tenants found' : 'No tenants yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating your first tenant organization'
              }
              actionLabel={canCreate && !searchQuery ? 'Add Tenant' : undefined}
              onAction={canCreate ? () => handleEdit(null) : undefined}
            />
          ) : (
            <TenantsTable 
              tenants={filteredTenants}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={(canDelete || canBulkDelete) ? handleDelete : undefined}
              isDeleting={deleteTenantMutation.isLoading}
              deletingTenantId={deleteTenantId}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {(canCreate || canEdit) && (
        <TenantForm
          open={isDialogOpen}
          onOpenChange={handleDialogOpenChange}
          editingTenant={editingTenant}
          onSubmit={handleSubmit}
          isSubmitting={createTenantMutation.isLoading || updateTenantMutation.isLoading}
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
        isLoading={deleteTenantMutation.isLoading}
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