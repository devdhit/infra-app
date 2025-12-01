'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useRoles, useCreateRole, useUpdateRole, useBulkDeleteRoles, useDeleteRole } from "@/hooks/management"
import { useUsers } from "@/hooks/management"
import type { Role, CreateRoleData, UpdateRoleData } from "@/types/management"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { RolesTable } from "@/components/roles/roles-table"
import { RoleForm } from "@/components/roles/role-form"
import { ConfirmDialog } from "@/components/roles/confirm-dialog"
import { Plus, Shield, Users as UsersIcon, ShieldCheck, ShieldAlert } from "lucide-react"
import { useCurrentUser } from '@/hooks/useApi'
import { LoadingLayout } from '@/components/ui/loading-layout'
import logger from '@/lib/logger'
import { PageHeader } from "@/components/management/page-header"
import { StatCard } from "@/components/management/stat-card"
import { SearchBar } from "@/components/management/search-bar"
import { EmptyState } from "@/components/management/empty-state"

export default function RolesPage() {
  const { t } = useTranslation()
  const { 
    userRole,
    canViewRoles, 
    canCreateRoles, 
    canEditRoles, 
    canDeleteRoles,
    canBulkDeleteRoles
  } = usePermissions()
  
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
  const isComponentMounted = useRef(true)
  
  // Clean up ref on unmount
  useEffect(() => {
    return () => {
      isComponentMounted.current = false
    }
  }, [])
  
  const { data: rolesResponse = null, isLoading, error, refetch } = useRoles()
  
  // Fetch users to get role assignment stats
  const { data: usersResponse } = useUsers()
  
  // Memoize data arrays to prevent useMemo dependency issues
  const roles = useMemo(() => Array.isArray(rolesResponse?.data) ? rolesResponse.data : [], [rolesResponse?.data]);
  const usersData = useMemo(() => usersResponse?.data || [], [usersResponse?.data]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filtered roles based on search
  const filteredRoles = useMemo(() => {
    return roles.filter((role: Role) => {
      const matchesSearch = searchQuery === '' || 
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [roles, searchQuery]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const total = roles.length;
    const adminRoles = roles.filter((r: Role) => r.name === 'admin').length;
    const customRoles = roles.filter((r: Role) => r.name !== 'admin' && r.name !== 'user').length;
    
    // Count users per role
    type RoleUserCount = { roleId: string; roleName: string; userCount: number };
    const roleUserCounts: RoleUserCount[] = roles.map((role: Role) => ({
      roleId: role.id,
      roleName: role.name,
      userCount: usersData.filter((u: { roleId: string | null }) => u.roleId === role.id).length
    }));
    
    // Find most used role
    const mostUsedRole = roleUserCounts.reduce((max: RoleUserCount, current: RoleUserCount) => 
      current.userCount > max.userCount ? current : max, 
      { roleId: '', roleName: 'None', userCount: 0 }
    );
    
    return { total, adminRoles, customRoles, mostUsedRole: mostUsedRole.roleName };
  }, [roles, usersData]);
  
  // Determine if there's an error
  const isError = !!error
  
  const createRoleMutation = useCreateRole()
  const [updateRoleId, setUpdateRoleId] = useState<string | null>(null)
  const updateRoleMutation = useUpdateRole(updateRoleId || '')
  const deleteRoleMutation = useDeleteRole()
  const bulkDeleteRolesMutation = useBulkDeleteRoles()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  
  // Confirmation dialog states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false)
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null)
  const [rolesToBulkDelete, setRolesToBulkDelete] = useState<string[]>([])
  
  // Permission states
  const [canView, setCanView] = useState<boolean | null>(null); // null means still checking
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
        return;
      }
      
      try {
        isCheckingPermissions.current = true;
        
        // For debugging in development only
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Checking roles page permissions:', {
            isUserLoading,
            currentUser: currentUser ? {
              id: currentUser.id,
              email: currentUser.email,
              roleId: currentUser.role?.id,
              roleName: currentUser.role?.name,
              tenantId: currentUser.tenantId
            } : null
          });
        }
        
        // Only check permissions if user data is fully loaded
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          // Check all permissions in parallel for better performance
          const [
            viewPermission,
            createPermission,
            editPermission,
            deletePermission,
            bulkDeletePermission
          ] = await Promise.all([
            canViewRoles(),
            canCreateRoles(),
            canEditRoles(),
            canDeleteRoles(),
            canBulkDeleteRoles()
          ]);
          
          // For debugging in development only
          if (process.env.NODE_ENV === 'development') {
            logger.debug('Roles page permission results:', {
              viewPermission,
              createPermission,
              editPermission,
              deletePermission,
              bulkDeletePermission
            });
          }
          
          // Only update state if component is still mounted
          if (!isCancelledRef.current) {
            setCanView(viewPermission);
            setCanCreate(createPermission);
            setCanEdit(editPermission);
            setCanDelete(deletePermission);
            setCanBulkDelete(bulkDeletePermission);
          }
        } else if (!isUserLoading && (!currentUser || !currentUser.role?.id || !currentUser.tenantId)) {
          // User data loaded but incomplete
          if (!isCancelledRef.current) {
            setCanView(false);
            setCanCreate(false);
            setCanEdit(false);
            setCanDelete(false);
            setCanBulkDelete(false);
          }
        }
        // If still loading, do nothing
      } catch (error) {
        // Log errors only in development
        if (process.env.NODE_ENV === 'development') {
          logger.error('Error checking permissions:', error);
        }
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
      }
    };
    
    checkPermissions();
    
    return () => {
      isCancelledRef.current = true;
      // Reset the permission checking flag when component unmounts
      isCheckingPermissions.current = false;
    };
  }, [userRole, canViewRoles, canCreateRoles, canEditRoles, canDeleteRoles, canBulkDeleteRoles, currentUser, isUserLoading]);

  // Listen for roles updates
  useEffect(() => {
    const handleRolesUpdated = () => {
      refetch();
    };

    window.addEventListener('roles-updated', handleRolesUpdated);
    
    return () => {
      window.removeEventListener('roles-updated', handleRolesUpdated);
    };
  }, [refetch]);

  // Show loading state while checking permissions
  if (canView === null || isUserLoading) {
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
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-center">
          <p className="text-red-500">{t('common.unauthorized') || 'You do not have permission to view this page'}</p>
        </div>
      </div>
    )
  }

  const handleEdit = async (role: Role | null) => {
    try {
      // Only check permissions if user data is fully loaded
      if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
        // For debugging in development only
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Checking edit permissions for role:', {
            roleId: currentUser.role.id,
            roleName: currentUser.role.name,
            tenantId: currentUser.tenantId,
            role: role ? role.name : 'new role'
          });
        }
        
        const hasEditPermission = await canEditRoles()
        const hasCreatePermission = await canCreateRoles()
        
        // For debugging in development only
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Edit permission check results:', {
            hasEditPermission,
            hasCreatePermission
          });
        }
        
        if (role && !hasEditPermission) {
          toast.error(t('roles.edit.unauthorized') || 'You do not have permission to edit roles')
          return
        }
        if (!role && !hasCreatePermission) {
          toast.error(t('roles.create.unauthorized') || 'You do not have permission to create roles')
          return
        }
      }
      setEditingRole(role)
      // Set the update role ID when editing an existing role
      if (role) {
        setUpdateRoleId(role.id)
      } else {
        setUpdateRoleId(null)
      }
      setIsDialogOpen(true)
    } catch (error) {
      // Log errors only in development
      if (process.env.NODE_ENV === 'development') {
        logger.error('Error checking edit permissions:', error)
      }
      // Allow the action by default if there's an error
      setEditingRole(role)
      // Set the update role ID when editing an existing role
      if (role) {
        setUpdateRoleId(role.id)
      } else {
        setUpdateRoleId(null)
      }
      setIsDialogOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // Only check permissions if user data is fully loaded
      if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
        // Check if it's a bulk delete operation (comma-separated IDs)
        if (id.includes(',')) {
          const hasBulkDeletePermission = await canBulkDeleteRoles()
          
          if (!hasBulkDeletePermission) {
            toast.error(t('roles.bulkDelete.unauthorized') || 'You do not have permission to bulk delete roles')
            return
          }
          
          // Handle bulk delete
          const rolesArray = id.split(',')
          setRolesToBulkDelete(rolesArray)
          setIsBulkDeleteConfirmOpen(true)
        } else {
          const hasDeletePermission = await canDeleteRoles()
          
          if (!hasDeletePermission) {
            toast.error(t('roles.delete.unauthorized') || 'You do not have permission to delete roles')
            return
          }
          
          // Handle single delete
          setRoleToDelete(id)
          setIsDeleteConfirmOpen(true)
        }
      } else {
        // If user data is not fully loaded, assume single delete for now
        // In a real app, you might want to handle this differently
        setRoleToDelete(id)
        setIsDeleteConfirmOpen(true)
      }
    } catch (error) {
      // Log errors only in development
      if (process.env.NODE_ENV === 'development') {
        logger.error('Error checking delete permissions:', error)
      }
      toast.error(t('common.error') || 'An error occurred while checking permissions')
    }
  }

  const confirmDelete = async () => {
    if (!roleToDelete) return
    
    try {
      await deleteRoleMutation.mutate(roleToDelete)
      toast.success(t('roles.delete.success') || 'Role deleted successfully')
      refetch()
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Error deleting role:', error)
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete role'
      toast.error(errorMessage || t('roles.delete.error'))
    } finally {
      setIsDeleteConfirmOpen(false)
      setRoleToDelete(null)
    }
  }

  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteRolesMutation.mutate(rolesToBulkDelete)
      toast.success(t('roles.bulkDelete.success', '{0} roles deleted successfully', rolesToBulkDelete.length.toString()) || 
                   `${rolesToBulkDelete.length} roles deleted successfully`)
      refetch()
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Error bulk deleting roles:', error)
      }
    } finally {
      setIsBulkDeleteConfirmOpen(false)
      setRolesToBulkDelete([])
    }
  }

  const handleSubmit = async (data: CreateRoleData | UpdateRoleData) => {
    try {
      if (editingRole) {
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          const hasEditPermission = await canEditRoles()
          if (!hasEditPermission) {
            toast.error(t('roles.update.unauthorized') || 'You do not have permission to update roles')
            return
          }
        }
        
        try {
          if (!updateRoleId) {
            setUpdateRoleId(editingRole.id)
          }
          await updateRoleMutation.mutate(data as UpdateRoleData)
          toast.success(t('roles.update.success') || 'Role updated successfully')
          setIsDialogOpen(false)
          setEditingRole(null)
          setUpdateRoleId(null)
          refetch()
        } catch (error: unknown) {
          if (process.env.NODE_ENV === 'development') {
            logger.error('Error updating role:', error)
          }
        }
      } else {
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          const hasCreatePermission = await canCreateRoles()
          if (!hasCreatePermission) {
            toast.error(t('roles.create.unauthorized') || 'You do not have permission to create roles')
            return
          }
        }
        try {
          await createRoleMutation.mutate(data as CreateRoleData)
          toast.success(t('roles.create.success') || 'Role created successfully')
          setIsDialogOpen(false)
          refetch()
        } catch (error: unknown) {
          if (process.env.NODE_ENV === 'development') {
            logger.error('Error creating role:', error)
          }
        }
      }
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        logger.error('Error submitting role form:', error)
      }
      const errorMessage = error instanceof Error ? error.message : 
        (editingRole ? 'Failed to update role' : 'Failed to create role')
      toast.error(errorMessage || (editingRole 
        ? t('roles.update.error') 
        : t('roles.create.error')))
    }
  }

  // Reset editing state when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingRole(null)
      // Reset the IDs when closing the dialog
      setUpdateRoleId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-center">
          <p className="text-red-500">{error?.message || t('roles.error.loading') || 'Failed to load roles'}</p>
          <Button onClick={() => refetch()} className="mt-4">
            {t('common.retry') || 'Retry'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title={t('roles.title') || 'Roles'}
        description={t('roles.description') || 'Manage roles, permissions, and access control'}
        icon={Shield}
        actions={
          <>
            {canCreate && (
              <Button onClick={() => handleEdit(null)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('roles.button') || 'Add Role'}
              </Button>
            )}
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Roles"
          value={stats.total}
          description="System-wide roles"
          icon={Shield}
        />
        <StatCard
          title="Admin Roles"
          value={stats.adminRoles}
          description="Administrative access"
          icon={ShieldCheck}
          className="border-red-200 dark:border-red-900"
        />
        <StatCard
          title="Custom Roles"
          value={stats.customRoles}
          description="User-defined roles"
          icon={ShieldAlert}
          className="border-blue-200 dark:border-blue-900"
        />
        <StatCard
          title="Most Used"
          value={stats.mostUsedRole}
          description="Most assigned role"
          icon={UsersIcon}
          className="border-green-200 dark:border-green-900"
        />
      </div>

      {/* Search and Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t('roles.list.title') || 'All Roles'}</CardTitle>
              <CardDescription>
                {filteredRoles.length} {filteredRoles.length === 1 ? 'role' : 'roles'} found
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
          {filteredRoles.length === 0 ? (
            <EmptyState
              icon={Shield}
              title={searchQuery ? 'No roles found' : 'No roles yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search query'
                  : 'Get started by creating your first role with custom permissions'
              }
              actionLabel={canCreate && !searchQuery ? 'Add Role' : undefined}
              onAction={canCreate ? () => handleEdit(null) : undefined}
            />
          ) : (
            <RolesTable 
              roles={filteredRoles}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={(canDelete || canBulkDelete) ? handleDelete : undefined}
              isDeleting={bulkDeleteRolesMutation.isLoading || deleteRoleMutation.isLoading}
              deletingRoleId={roleToDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <RoleForm 
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        editingRole={editingRole as unknown as import('@/types/roles').Role | null}
        onSubmit={handleSubmit}
        isSubmitting={editingRole ? updateRoleMutation.isLoading : createRoleMutation.isLoading}
      />
      
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={t('roles.delete.confirmTitle') || 'Delete Role'}
        description={t('roles.delete.confirmDescription') || 'Are you sure you want to delete this role? This action cannot be undone.'}
        confirmText={t('common.delete') || 'Delete'}
        cancelText={t('common.cancel') || 'Cancel'}
        onConfirm={confirmDelete}
        isLoading={deleteRoleMutation.isLoading}
      />
      
      <ConfirmDialog
        open={isBulkDeleteConfirmOpen}
        onOpenChange={setIsBulkDeleteConfirmOpen}
        title={t('roles.bulkDelete.confirmTitle') || 'Delete Roles'}
        description={t('roles.bulkDelete.confirmDescription', 'Are you sure you want to delete {0} roles?', rolesToBulkDelete.length.toString()) || 
                    `Are you sure you want to delete ${rolesToBulkDelete.length} roles? This action cannot be undone.`}
        confirmText={t('common.delete') || 'Delete'}
        cancelText={t('common.cancel') || 'Cancel'}
        onConfirm={confirmBulkDelete}
        isLoading={bulkDeleteRolesMutation.isLoading}
      />
    </div>
  )
}