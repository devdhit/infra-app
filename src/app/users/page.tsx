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
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useBulkDeleteUsers } from "@/hooks/management"
import { useTenants } from "@/hooks/management"
import { useRoles } from "@/hooks/management"
import type { UserWithRole, CreateUserData, UpdateUserData } from "@/types/management"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { UsersTable } from "@/components/users/users-table"
import { UserForm } from "@/components/users/user-form"
import { ConfirmDialog } from "@/components/users/confirm-dialog"
import { BulkDeleteDialog } from "@/components/users/bulk-delete-dialog"
import { Plus, Users as UsersIcon, UserCog, Shield, UserX } from "lucide-react"
import { LoadingLayout } from '@/components/ui/loading-layout'
import logger from '@/lib/logger'
import { PageHeader } from "@/components/management/page-header"
import { StatCard } from "@/components/management/stat-card"
import { SearchBar } from "@/components/management/search-bar"
import { FilterDropdown } from "@/components/management/filter-dropdown"
import { EmptyState } from "@/components/management/empty-state"

const Page = () => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [bulkDeleteUserIds, setBulkDeleteUserIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch users and tenants
  const { data: usersResponse, refetch: refetchUsers } = useUsers();
  const { data: tenantsResponse } = useTenants();
  
  // Memoize data arrays to prevent useMemo dependency issues
  const usersData = useMemo(() => usersResponse?.data || [], [usersResponse?.data]);
  const tenantsData = useMemo(() => tenantsResponse?.data || [], [tenantsResponse?.data]);
  
  // User mutations
  const createUserMutation = useCreateUser();
  const [updateUserId, setUpdateUserId] = useState<string | null>(null);
  const updateUserMutation = useUpdateUser(updateUserId || '');
  const deleteUserMutation = useDeleteUser();
  const bulkDeleteUsersMutation = useBulkDeleteUsers();
  
  // Check permissions
  const { canViewUsers, canCreateUsers, canEditUsers, canDeleteUsers, isLoading: isUserLoading } = usePermissions();
  
  const [canView, setCanView] = useState<boolean | null>(null);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [canEdit, setCanEdit] = useState<boolean | null>(null);
  const [canDelete, setCanDelete] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const viewResult = await canViewUsers();
        setCanView(viewResult);
        logger.debug('Users page - canView:', viewResult);
        
        const createResult = await canCreateUsers();
        setCanCreate(createResult);
        logger.debug('Users page - canCreate:', createResult);
        
        const editResult = await canEditUsers();
        setCanEdit(editResult);
        logger.debug('Users page - canEdit:', editResult);
        
        const deleteResult = await canDeleteUsers();
        setCanDelete(deleteResult);
        logger.debug('Users page - canDelete:', deleteResult);
      } catch (error) {
        logger.error('Error checking permissions:', error);
        setCanView(false);
        setCanCreate(false);
        setCanEdit(false);
        setCanDelete(false);
      }
    };
    
    checkPermissions();
  }, [canViewUsers, canCreateUsers, canEditUsers, canDeleteUsers]);
  
  // Update isDeleting state based on hook loading states
  useEffect(() => {
    setIsDeleting(deleteUserMutation.isLoading || bulkDeleteUsersMutation.isLoading);
  }, [deleteUserMutation.isLoading, bulkDeleteUsersMutation.isLoading]);
  
  // Get the user to delete for confirmation dialog
  const userToDelete = usersData?.find((user: UserWithRole) => user.id === deleteUserId) || null;
  
  // Memoize users and tenants arrays
  const users = useMemo(() => usersData || [], [usersData]);
  const tenants = useMemo(() => tenantsData || [], [tenantsData]);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Fetch roles for filtering
  const { data: rolesResponse } = useRoles();
  const roles = Array.isArray(rolesResponse?.data) ? rolesResponse.data : [];
  
  // Filtered users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user: UserWithRole) => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === 'all' || user.role?.id === roleFilter;
      
      // Status filter (locked/active)
      const isLocked = user.lockedAt != null;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && !isLocked) ||
        (statusFilter === 'locked' && isLocked);
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u: UserWithRole) => !u.lockedAt).length;
    const locked = users.filter((u: UserWithRole) => u.lockedAt).length;
    const admins = users.filter((u: UserWithRole) => u.role?.name === 'admin').length;
    
    return { total, active, locked, admins };
  }, [users]);
  
  const handleEdit = (user: UserWithRole | null) => {
    setEditingUser(user);
    if (user) {
      setUpdateUserId(user.id);
    } else {
      setUpdateUserId(null);
    }
    setIsDialogOpen(true);
  };
  
  // Wrapper for UsersTable that expects old User type
  const handleEditWrapper = (user: import('@/types/users').User) => {
    handleEdit(user as unknown as UserWithRole);
  };
  
  const handleDelete = (id: string | string[]) => {
    if (typeof id === 'string') {
      // Single user deletion
      setDeleteUserId(id);
      setIsDeleteConfirmOpen(true);
    } else if (Array.isArray(id) && id.length > 0) {
      // Bulk user deletion
      setBulkDeleteUserIds(id);
      setIsBulkDeleteConfirmOpen(true);
    }
  };
  
  const confirmDelete = async () => {
    if (!deleteUserId) return;
    
    try {
      await deleteUserMutation.mutate(deleteUserId);
      toast.success(t('users.delete.success') || 'User deleted successfully');
      setIsDeleteConfirmOpen(false);
      setDeleteUserId(null);
      refetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage || t('users.delete.error'));
    }
  };
  
  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteUsersMutation.mutate(bulkDeleteUserIds);
      toast.success(t('users.bulkDelete.success') || 'Users deleted successfully');
      setIsBulkDeleteConfirmOpen(false);
      setBulkDeleteUserIds([]);
      refetchUsers();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete users';
      toast.error(errorMessage || t('users.bulkDelete.error'));
    }
  };
  
  const handleSubmit = async (data: CreateUserData | UpdateUserData) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        try {
          if (!updateUserId) {
            setUpdateUserId(editingUser.id);
          }
          await updateUserMutation.mutate(data as UpdateUserData);
          toast.success(t('users.update.success') || 'User updated successfully');
          setIsDialogOpen(false);
          setEditingUser(null);
          setUpdateUserId(null);
          refetchUsers();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
          toast.error(errorMessage || t('users.update.error'));
        }
      } else {
        try {
          await createUserMutation.mutate(data as CreateUserData);
          toast.success(t('users.create.success') || 'User created successfully');
          setIsDialogOpen(false);
          refetchUsers();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
          toast.error(errorMessage || t('users.create.error'));
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 
        (editingUser ? 'Failed to update user' : 'Failed to create user');
      toast.error(errorMessage || (editingUser 
        ? t('users.update.error') 
        : t('users.create.error')));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset editing state when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingUser(null);
      setDeleteUserId(null);
      setUpdateUserId(null);
    }
  };

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

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title={t('nav.users') || 'Users'}
        description={t('users.description') || 'Manage user accounts, roles, and permissions'}
        icon={UsersIcon}
        actions={
          <>
            {canCreate && (
              <Button onClick={() => handleEdit(null)} disabled={isUserLoading}>
                <Plus className="mr-2 h-4 w-4" />
                {t('users.button.add') || 'Add User'}
              </Button>
            )}
          </>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.total}
          description="All registered users"
          icon={UsersIcon}
        />
        <StatCard
          title="Active Users"
          value={stats.active}
          description="Currently active accounts"
          icon={UserCog}
          className="border-green-200 dark:border-green-900"
        />
        <StatCard
          title="Admin Users"
          value={stats.admins}
          description="Users with admin access"
          icon={Shield}
          className="border-blue-200 dark:border-blue-900"
        />
        <StatCard
          title="Locked Users"
          value={stats.locked}
          description="Accounts currently locked"
          icon={UserX}
          className="border-red-200 dark:border-red-900"
        />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>{t('users.title') || 'All Users'}</CardTitle>
              <CardDescription>
                {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <SearchBar
                placeholder="Search by name or email..."
                onSearch={setSearchQuery}
                className="w-full md:w-[300px]"
              />
              <FilterDropdown
                options={[
                  { label: 'All Roles', value: 'all' },
                  ...roles.map((role: { id: string; name: string }) => ({ label: role.name, value: role.id }))
                ]}
                value={roleFilter}
                onValueChange={setRoleFilter}
                placeholder="Filter by role"
              />
              <FilterDropdown
                options={[
                  { label: 'All Status', value: 'all' },
                  { label: 'Active', value: 'active' },
                  { label: 'Locked', value: 'locked' }
                ]}
                value={statusFilter}
                onValueChange={setStatusFilter}
                placeholder="Filter by status"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title={searchQuery || roleFilter !== 'all' || statusFilter !== 'all' ? 'No users found' : 'No users yet'}
              description={
                searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first user'
              }
              actionLabel={canCreate && !searchQuery && roleFilter === 'all' && statusFilter === 'all' ? 'Add User' : undefined}
              onAction={canCreate ? () => handleEdit(null) : undefined}
            />
          ) : (
            <UsersTable
              users={filteredUsers as any as import('@/types/users').User[]}
              tenants={tenants as unknown as { id: string; name: string }[]}
              onEdit={canEdit ? handleEditWrapper : undefined}
              onDelete={canDelete ? handleDelete : undefined}
              isDeleting={isDeleting}
              deletingUserId={deleteUserId}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserForm
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        editingUser={editingUser as unknown as import('@/types/users').UserCreateUpdate | null}
        tenants={tenants as unknown as Array<{ id: string; name: string; createdAt: string; updatedAt: string }>}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
      
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={t('users.delete.confirmTitle') || 'Delete User'}
        description={t('users.delete.confirmDescription', 'Are you sure you want to delete user {0}?', userToDelete?.name || 'this user') || 
                    `Are you sure you want to delete user ${userToDelete?.name || 'this user'}? This action cannot be undone.`}
        confirmText={t('common.delete') || 'Delete'}
        cancelText={t('common.cancel') || 'Cancel'}
        onConfirm={confirmDelete}
        isLoading={false}
      />
      
      <BulkDeleteDialog
        title={t('users.title') || 'Users'}
        count={bulkDeleteUserIds.length}
        isOpen={isBulkDeleteConfirmOpen}
        isDeleting={isDeleting}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={confirmBulkDelete}
      />
    </div>
  )
}

export default Page;