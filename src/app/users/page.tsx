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
// FIX: Remove unused imports
import { useUsers, useCreateUser, useTenants, useBulkDeleteUsers } from "@/hooks/useApi"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { UsersTable } from "@/components/users/users-table"
import { UserForm } from "@/components/users/user-form"
import { UserFormValues, User } from "@/types/users"
import { useQueryClient } from '@tanstack/react-query'
import { Plus} from "lucide-react"
import { useCurrentUser } from '@/hooks/useApi'

export default function UsersPage() {
  const { t } = useTranslation()
  const { 
    userRole,
    canViewUsers, 
    canCreateUsers, 
    canEditUsers, 
    canDeleteUsers, 
    canBulkDeleteUsers 
  } = usePermissions()
  
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
  
  const queryClient = useQueryClient()
  const { data: users = [], refetch } = useUsers()
  const { data: tenants = [] } = useTenants()
  const createUserMutation = useCreateUser()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  // Manage the ID for delete operations in state
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const bulkDeleteMutation = useBulkDeleteUsers()
  
  // State for update user ID
  const [updateUserId, setUpdateUserId] = useState<string | null>(null)
  
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
        return;
      }
      
      try {
        isCheckingPermissions.current = true;
        
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
            canViewUsers(),
            canCreateUsers(),
            canEditUsers(),
            canDeleteUsers(),
            canBulkDeleteUsers()
          ]);
          
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
          console.error('Error checking permissions:', error);
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
    
    // Check permissions when dependencies change
    checkPermissions();
    
    return () => {
      isCancelledRef.current = true;
      // Reset the permission checking flag when component unmounts
      isCheckingPermissions.current = false;
    };
  }, [userRole, canViewUsers, canCreateUsers, canEditUsers, canDeleteUsers, canBulkDeleteUsers, currentUser, isUserLoading]);

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

  const handleEdit = async (user: User | null) => {
    try {
      // Only check permissions if user data is fully loaded
      if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
        const hasEditPermission = await canEditUsers()
        const hasCreatePermission = await canCreateUsers()
        
        if (user && !hasEditPermission) {
          toast.error(t('users.edit.unauthorized') || 'You do not have permission to edit users')
          return
        }
        if (!user && !hasCreatePermission) {
          toast.error(t('users.create.unauthorized') || 'You do not have permission to create users')
          return
        }
      }
      setEditingUser(user)
      setIsDialogOpen(true)
    } catch (error) {
      // Log errors only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking edit permissions:', error)
      }
      // Allow the action by default if there's an error
      setEditingUser(user)
      setIsDialogOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // Only check permissions if user data is fully loaded
      if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
        const hasDeletePermission = await canDeleteUsers()
        const hasBulkDeletePermission = await canBulkDeleteUsers()
        
        // Check if it's a bulk delete (comma-separated IDs)
        if (id.includes(',')) {
          if (!hasBulkDeletePermission) {
            toast.error(t('users.bulkDelete.unauthorized') || 'You do not have permission to bulk delete users')
            return
          }
          // Handle bulk delete
          const ids = id.split(',')
          if (window.confirm(t('users.bulkDelete.confirm', 'Are you sure you want to delete {0} users?', ids.length.toString()) || 
              `Are you sure you want to delete ${ids.length} users?`)) {
            try {
              await bulkDeleteMutation.mutateAsync({ ids })
              toast.success(t('users.bulkDelete.success', '{0} users deleted successfully', ids.length.toString()) || 
                           `${ids.length} users deleted successfully`)
              refetch()
            } catch (error: any) {
              toast.error(error.message || t('users.bulkDelete.error') || 'Failed to delete users')
            }
          }
        } else {
          if (!hasDeletePermission) {
            toast.error(t('users.delete.unauthorized') || 'You do not have permission to delete users')
            return
          }
          // Handle single delete
          setDeleteUserId(id)
          if (window.confirm(t('users.delete.confirm') || 'Are you sure you want to delete this user?')) {
            try {
              // Instead of calling the hook directly, we'll use the API client directly
              const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              if (!response.ok) {
                throw new Error('Failed to delete user');
              }
              
              toast.success(t('users.delete.success') || 'User deleted successfully')
              refetch()
            } catch (error: any) {
              toast.error(error.message || t('users.delete.error') || 'Failed to delete user')
            }
          }
        }
      }
    } catch (error) {
      // Log errors only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking delete permissions:', error)
      }
      toast.error(t('common.error') || 'An error occurred while checking permissions')
    }
  }

  const handleSubmit = async (data: UserFormValues) => {
    try {
      if (editingUser) {
        // Only check permissions if user data is fully loaded
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          const hasEditPermission = await canEditUsers()
          if (!hasEditPermission) {
            toast.error(t('users.update.unauthorized') || 'You do not have permission to update users')
            return
          }
        }
        // Update existing user using mutation
        try {
          setUpdateUserId(editingUser.id)
          // Instead of calling the hook directly, we'll use the API client directly
          const response = await fetch(`/api/users/${editingUser.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: data.email,
              name: data.name,
              role: data.role,
              tenantId: data.tenantId,
              ...(data.password ? { password: data.password } : {})
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update user');
          }
          
          toast.success(t('users.update.success') || 'User updated successfully')
          setIsDialogOpen(false)
          setEditingUser(null) // Clear the editing user state
          setUpdateUserId(null) // Clear the update user ID
          refetch(); // Refresh the user list
        } catch (error: any) {
          toast.error(error.message || t('users.update.error') || 'Failed to update user')
        }
      } else {
        // Only check permissions if user data is fully loaded
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          const hasCreatePermission = await canCreateUsers()
          if (!hasCreatePermission) {
            toast.error(t('users.create.unauthorized') || 'You do not have permission to create users')
            return
          }
        }
        // Create new user
        try {
          await createUserMutation.mutateAsync({
            email: data.email,
            name: data.name,
            password: data.password || '',
            role: data.role,
            tenantId: data.tenantId
          })
          toast.success(t('users.create.success') || 'User created successfully')
          setIsDialogOpen(false)
          // Invalidate the users query to force a refresh
          await queryClient.invalidateQueries({ queryKey: ['users'] })
        } catch (error: any) {
          toast.error(error.message || t('users.create.error') || 'Failed to create user')
        }
      }
    } catch (error: any) {
      toast.error(error.message || (editingUser 
        ? t('users.update.error') || 'Failed to update user' 
        : t('users.create.error') || 'Failed to create user'))
    }
  }

  // Reset editing state when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingUser(null)
      // Reset the delete user ID when closing the dialog
      setDeleteUserId(null)
      // Reset the update user ID when closing the dialog
      setUpdateUserId(null)
    }
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
            onDelete={canDelete || canBulkDelete || (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) ? handleDelete : undefined}
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
        isSubmitting={createUserMutation.isPending || (editingUser && updateUserId ? true : false)}
      />
    </div>
  )
}