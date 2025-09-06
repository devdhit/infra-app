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
import { useUsers, useCreateUser, useDeleteUser, useTenants, useBulkDeleteUsers } from "@/hooks/useApi"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { UsersTable } from "@/components/users/users-table"
import { UserForm } from "@/components/users/user-form"
import { UserFormValues, User, UserRole } from "@/types/users"
import { api } from "@/lib/api"
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Users as UsersIcon } from "lucide-react"
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
  const { data: users = [], isLoading, isError, error, refetch } = useUsers()
  const { data: tenants = [] } = useTenants()
  const createUserMutation = useCreateUser()
  // Manage the ID for delete operations in state
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  // Create the delete mutation with a placeholder ID
  const deleteMutation = useDeleteUser(deleteUserId || 'placeholder')
  const bulkDeleteMutation = useBulkDeleteUsers()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
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
        // Only check permissions if the hook is ready and user data is fully loaded
        if (typeof window !== 'undefined' && userRole && !isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          const viewPermission = await canViewUsers()
          const createPermission = await canCreateUsers()
          const editPermission = await canEditUsers()
          const deletePermission = await canDeleteUsers()
          const bulkDeletePermission = await canBulkDeleteUsers()
          
          setCanView(viewPermission)
          setCanCreate(createPermission)
          setCanEdit(editPermission)
          setCanDelete(deletePermission)
          setCanBulkDelete(bulkDeletePermission)
        } else {
          // If user data is not ready, use default values
          setCanView(true) // Allow viewing by default
          setCanCreate(false)
          setCanEdit(false)
          setCanDelete(false)
          setCanBulkDelete(false)
        }
      } catch (error) {
        console.error('Error checking permissions:', error)
        // Default to denying access if there's an error
        setCanView(false)
      }
    }
    
    // Add a small delay to ensure user data is fully loaded
    const timer = setTimeout(() => {
      checkPermissions()
    }, 150)
    
    return () => clearTimeout(timer)
  }, [userRole, canViewUsers, canCreateUsers, canEditUsers, canDeleteUsers, canBulkDeleteUsers, currentUser, isUserLoading])

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
      console.error('Error checking edit permissions:', error)
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
              await deleteMutation.mutateAsync(deleteUserId || '')
              toast.success(t('users.delete.success') || 'User deleted successfully')
              refetch()
            } catch (error: any) {
              toast.error(error.message || t('users.delete.error') || 'Failed to delete user')
            }
          }
        }
      } else {
        // If user data is not ready, allow the action by default
        setDeleteUserId(id)
        if (window.confirm(t('users.delete.confirm') || 'Are you sure you want to delete this user?')) {
          try {
            await deleteMutation.mutateAsync(deleteUserId || '')
            toast.success(t('users.delete.success') || 'User deleted successfully')
            refetch()
          } catch (error: any) {
            toast.error(error.message || t('users.delete.error') || 'Failed to delete user')
          }
        }
      }
    } catch (error) {
      console.error('Error checking delete permissions:', error)
      // Allow the action by default if there's an error
      setDeleteUserId(id)
      if (window.confirm(t('users.delete.confirm') || 'Are you sure you want to delete this user?')) {
        try {
          await deleteMutation.mutateAsync(deleteUserId || '')
          toast.success(t('users.delete.success') || 'User deleted successfully')
          refetch()
        } catch (error: any) {
          toast.error(error.message || t('users.delete.error') || 'Failed to delete user')
        }
      }
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
        // Update existing user
        try {
          // Use the API client directly to make the PUT request with proper authentication
          await api.put<User, Partial<UserFormValues>>(`/users/${editingUser.id}`, {
            email: data.email,
            name: data.name,
            role: data.role,
            tenantId: data.tenantId,
            ...(data.password ? { password: data.password } : {})
          });
          
          toast.success(t('users.update.success') || 'User updated successfully')
          setIsDialogOpen(false)
          setEditingUser(null) // Clear the editing user state
          // Invalidate the users query to force a refresh
          await queryClient.invalidateQueries({ queryKey: ['users'] })
          // Also invalidate the specific user query
          await queryClient.invalidateQueries({ queryKey: ['users', editingUser.id] })
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
            role: data.role as UserRole, // Cast to UserRole type
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
          <p className="text-red-500">{error?.message || t('users.error.loading') || 'Failed to load users'}</p>
          <Button onClick={() => refetch()} className="mt-4">
            {t('common.retry') || 'Retry'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          <UsersIcon className="h-8 w-8 mr-3 text-blue-500" />
          {t('users.title') || 'Users'}
        </h1>
        <p className="text-muted-foreground">{t('users.description') || 'Manage system users'}</p>
      </div>

      <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{t('users.list.title') || 'User List'}</CardTitle>
              <CardDescription>
                {t('users.list.description') || 'A list of all users in the system'}
              </CardDescription>
            </div>
            {canCreate && (
              <Button onClick={() => handleEdit(null)} className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('users.button') || 'Add User'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <UsersTable 
            users={users} 
            tenants={tenants}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete || canBulkDelete ? handleDelete : undefined}
            isDeleting={deleteMutation.isPending}
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
        isSubmitting={createUserMutation.isPending || (editingUser ? false : false /* update mutation */)}
      />
    </div>
  )
}