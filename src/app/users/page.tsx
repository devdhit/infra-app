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
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useTenants, useBulkDeleteUsers } from "@/hooks/useApi"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import { UsersTable } from "@/components/users/users-table"
import { UserForm } from "@/components/users/user-form"
import { UserFormValues } from "@/components/users/types"
import { User } from "@/hooks/useApi"

export default function UsersPage() {
  const { t } = useTranslation()
  const { data: users = [], isLoading, isError, error, refetch } = useUsers()
  const { data: tenants = [] } = useTenants()
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser('')
  const deleteMutation = useDeleteUser('')
  const bulkDeleteMutation = useBulkDeleteUsers()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  const handleEdit = (user: User | null) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    // Check if it's a bulk delete (comma-separated IDs)
    if (id.includes(',')) {
      // Handle bulk delete
      const ids = id.split(',')
      if (window.confirm(t('users.bulkDelete.confirm', 'Are you sure you want to delete {0} users?', ids.length.toString()) || 
          `Are you sure you want to delete ${ids.length} users?`)) {
        bulkDeleteMutation.mutate({ ids }, {
          onSuccess: () => {
            toast.success(t('users.bulkDelete.success', '{0} users deleted successfully', ids.length.toString()) || 
                         `${ids.length} users deleted successfully`)
            refetch()
          },
          onError: (error: any) => {
            toast.error(error.message || t('users.bulkDelete.error') || 'Failed to delete users')
          }
        })
      }
    } else {
      // Handle single delete
      setDeleteUserId(id)
      if (window.confirm(t('users.delete.confirm') || 'Are you sure you want to delete this user?')) {
        deleteMutation.mutate(id, {
          onSuccess: () => {
            toast.success(t('users.delete.success') || 'User deleted successfully')
            refetch()
          },
          onError: (error: any) => {
            toast.error(error.message || t('users.delete.error') || 'Failed to delete user')
          }
        })
      }
    }
  }

  const handleSubmit = async (data: UserFormValues) => {
    try {
      if (editingUser) {
        // Update existing user
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          email: data.email,
          name: data.name,
          role: data.role,
          tenantId: data.tenantId,
          ...(data.password ? { password: data.password } : {})
        }, {
          onSuccess: () => {
            toast.success(t('users.update.success') || 'User updated successfully')
            setIsDialogOpen(false)
            refetch()
          },
          onError: (error: any) => {
            toast.error(error.message || t('users.update.error') || 'Failed to update user')
          }
        })
      } else {
        // Create new user
        await createUserMutation.mutateAsync({
          email: data.email,
          name: data.name,
          password: data.password || '',
          role: data.role,
          tenantId: data.tenantId
        }, {
          onSuccess: () => {
            toast.success(t('users.create.success') || 'User created successfully')
            setIsDialogOpen(false)
            refetch()
          },
          onError: (error: any) => {
            toast.error(error.message || t('users.create.error') || 'Failed to create user')
          }
        })
      }
    } catch (error: any) {
      toast.error(error.message || (editingUser 
        ? t('users.update.error') || 'Failed to update user' 
        : t('users.create.error') || 'Failed to create user'))
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
          <p className="text-red-500">{t('users.error.loading') || 'Failed to load users'}</p>
          <p className="text-sm text-muted-foreground mt-2">{error?.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('users.title') || 'Users'}</h1>
        <p className="text-muted-foreground">{t('users.description') || 'Manage system users'}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{t('users.list.title') || 'User List'}</CardTitle>
              <CardDescription>
                {t('users.list.description') || 'A list of all users in the system'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UsersTable 
            users={users}
            tenants={tenants}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending || bulkDeleteMutation.isPending}
            deletingUserId={deleteUserId}
          />
        </CardContent>
      </Card>

      <UserForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingUser={editingUser}
        tenants={tenants}
        onSubmit={handleSubmit}
        isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
      />
    </div>
  )
}