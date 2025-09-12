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
// FIX: Remove unused imports
import { useUsers, useCreateUser, useTenants, useBulkDeleteUsers, useDeleteUser, useUpdateUser } from "@/hooks/useApi"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { UsersTable } from "@/components/users/users-table"
import { UserForm } from "@/components/users/user-form"
import { ConfirmDialog } from "@/components/users/confirm-dialog"
import { BulkDeleteDialog } from "@/components/users/bulk-delete-dialog"
import { User, UserCreateUpdate } from "@/types/users"
import { Plus} from "lucide-react"
import { useCurrentUser } from '@/hooks/useApi'
import logger from '@/lib/logger'

const Page = () => {
  const { t } = useTranslation();
  const { data: currentUser } = useCurrentUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [bulkDeleteUserIds, setBulkDeleteUserIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  
  // Fetch users and tenants
  const { data: usersData, refetch: refetchUsers } = useUsers();
  const { data: tenantsData } = useTenants();
  
  // User mutations
  const { createUser } = useCreateUser();
  const { updateUser } = useUpdateUser(editingUser?.id || '');
  const { deleteUser } = useDeleteUser(deleteUserId || '');
  const { bulkDeleteUsers } = useBulkDeleteUsers();
  
  // Check permissions
  const { canViewUsers, canCreateUsers, canEditUsers, canDeleteUsers, canBulkDeleteUsers, isLoading: isUserLoading } = usePermissions();
  
  const [canView, setCanView] = useState<boolean | null>(null);
  const [canCreate, setCanCreate] = useState<boolean | null>(null);
  const [canEdit, setCanEdit] = useState<boolean | null>(null);
  const [canDelete, setCanDelete] = useState<boolean | null>(null);
  const [canBulkDelete, setCanBulkDelete] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const viewResult = await canViewUsers();
        setCanView(viewResult);
        
        const createResult = await canCreateUsers();
        setCanCreate(createResult);
        
        const editResult = await canEditUsers();
        setCanEdit(editResult);
        
        const deleteResult = await canDeleteUsers();
        setCanDelete(deleteResult);
        
        const bulkDeleteResult = await canBulkDeleteUsers();
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
  }, [canViewUsers, canCreateUsers, canEditUsers, canDeleteUsers, canBulkDeleteUsers]);
  
  // Get the user to delete for confirmation dialog
  const userToDelete = usersData?.find(user => user.id === deleteUserId) || null;
  
  const users = usersData || [];
  const tenants = tenantsData || [];
  
  const handleEdit = (user: User | null) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string | string[]) => {
    if (typeof id === 'string') {
      setDeleteUserId(id);
      setIsDeleteConfirmOpen(true);
    }
  };
  
  const confirmDelete = async () => {
    if (!deleteUserId) return;
    
    try {
      await deleteUser();
      toast.success(t('users.delete.success') || 'User deleted successfully');
      setIsDeleteConfirmOpen(false);
      setDeleteUserId(null);
      refetchUsers();
    } catch (error: any) {
      toast.error(error.message || t('users.delete.error') || 'Failed to delete user');
    }
  };
  
  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteUsers(bulkDeleteUserIds);
      toast.success(t('users.bulkDelete.success') || 'Users deleted successfully');
      setIsBulkDeleteConfirmOpen(false);
      setBulkDeleteUserIds([]);
      refetchUsers();
    } catch (error: any) {
      toast.error(error.message || t('users.bulkDelete.error') || 'Failed to delete users');
    }
  };
  
  const handleSubmit = async (data: Partial<UserCreateUpdate>) => {
    try {
      if (editingUser) {
        try {
          await updateUser(data);
          toast.success(t('users.update.success') || 'User updated successfully');
          setIsDialogOpen(false);
          setEditingUser(null);
          refetchUsers();
        } catch (error: any) {
          toast.error(error.message || t('users.update.error') || 'Failed to update user');
        }
      } else {
        try {
          await createUser(data);
          toast.success(t('users.create.success') || 'User created successfully');
          setIsDialogOpen(false);
          refetchUsers();
        } catch (error: any) {
          toast.error(error.message || t('users.create.error') || 'Failed to create user');
        }
      }
    } catch (error: any) {
      toast.error(error.message || (editingUser 
        ? t('users.update.error') || 'Failed to update user' 
        : t('users.create.error') || 'Failed to create user'));
    }
  };

  // Reset editing state when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingUser(null);
      setDeleteUserId(null);
    }
  };

  // Show loading state while checking permissions
  if (canView === null || isUserLoading) {
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
    return (
      <div className="flex items-center justify-center h-52">
        <div className="text-center">
          <p className="text-red-500">{t('common.unauthorized') || 'You do not have permission to view this page'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('nav.users')}</h1>
          <p className="text-muted-foreground">
            {t('users.description') || 'Manage user accounts and permissions'}
          </p>
        </div>
        {(canCreate || (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId)) && (
          <Button onClick={() => handleEdit(null)} disabled={isUserLoading}>
            <Plus className="mr-2 h-4 w-4" />
            {t('users.button.add') || 'Add User'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.title') || 'Users'}</CardTitle>
          <CardDescription>
            {t('users.subtitle') || 'View and manage user accounts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersTable
            users={users}
            tenants={tenants}
            onEdit={canEdit || (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) ? handleEdit : undefined}
            onDelete={(canDelete || canBulkDelete || (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId)) ? handleDelete : undefined}
            isDeleting={false}
            deletingUserId={deleteUserId}
          />
        </CardContent>
      </Card>

      <UserForm
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        editingUser={editingUser}
        tenants={tenants}
        onSubmit={handleSubmit}
        isSubmitting={false}
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
        isDeleting={false}
        onClose={() => setIsBulkDeleteConfirmOpen(false)}
        onConfirm={confirmBulkDelete}
      />
    </div>
  )
}

export default Page;
