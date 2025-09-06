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
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from "@/hooks/useRoles"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { RolesTable } from "@/components/roles/roles-table"
import { RoleForm } from "@/components/roles/role-form"
import { RoleFormValues, Role } from "@/types/roles"
import { Plus, Shield } from "lucide-react"
import { useCurrentUser } from '@/hooks/useApi'

export default function RolesPage() {
  const { t } = useTranslation()
  const { 
    userRole,
    canViewRoles, 
    canCreateRoles, 
    canEditRoles, 
    canDeleteRoles 
  } = usePermissions()
  
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser()
  
  const { data: roles = [], isLoading, isError, error, refetch } = useRoles()
  const createRoleMutation = useCreateRole()
  // We'll manage the ID for update and delete operations in state
  const [updateRoleId, setUpdateRoleId] = useState<string | null>(null)
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)
  
  // Create the update and delete mutations with placeholder IDs
  // We'll update the actual IDs when needed
  const updateRoleMutation = useUpdateRole(updateRoleId || 'placeholder')
  const deleteRoleMutation = useDeleteRole(deleteRoleId || 'placeholder')
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  
  // Permission states
  const [canView, setCanView] = useState<boolean>(false);
  const [canCreate, setCanCreate] = useState<boolean>(false)
  const [canEdit, setCanEdit] = useState<boolean>(false)
  const [canDelete, setCanDelete] = useState<boolean>(false)

  // Check permissions
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Only check permissions if the hook is ready and user data is fully loaded
        if (typeof window !== 'undefined' && userRole && !isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          setCanView(await canViewRoles())
          setCanCreate(await canCreateRoles())
          setCanEdit(await canEditRoles())
          setCanDelete(await canDeleteRoles())
        } else {
          // If user data is not ready, use default values
          setCanView(true) // Allow viewing by default
          setCanCreate(false)
          setCanEdit(false)
          setCanDelete(false)
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
  }, [userRole, canViewRoles, canCreateRoles, canEditRoles, canDeleteRoles, currentUser, isUserLoading])

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
        const hasEditPermission = await canEditRoles()
        const hasCreatePermission = await canCreateRoles()
        
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
      setIsDialogOpen(true)
    } catch (error) {
      console.error('Error checking edit permissions:', error)
      // Allow the action by default if there's an error
      setEditingRole(role)
      setIsDialogOpen(true)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      // Only check permissions if user data is fully loaded
      if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
        const hasDeletePermission = await canDeleteRoles()
        
        if (!hasDeletePermission) {
          toast.error(t('roles.delete.unauthorized') || 'You do not have permission to delete roles')
          return
        }
      }
      
      setDeleteRoleId(id)
      if (window.confirm(t('roles.delete.confirm') || 'Are you sure you want to delete this role?')) {
        try {
          // Trigger the delete mutation
          await deleteRoleMutation.mutateAsync()
          toast.success(t('roles.delete.success') || 'Role deleted successfully')
          refetch()
        } catch (error: any) {
          // Error is handled by the mutation hook
          console.error('Error deleting role:', error)
        }
      }
    } catch (error) {
      console.error('Error checking delete permissions:', error)
      // Allow the action by default if there's an error
      setDeleteRoleId(id)
      if (window.confirm(t('roles.delete.confirm') || 'Are you sure you want to delete this role?')) {
        try {
          // Trigger the delete mutation
          await deleteRoleMutation.mutateAsync()
          toast.success(t('roles.delete.success') || 'Role deleted successfully')
          refetch()
        } catch (error: any) {
          // Error is handled by the mutation hook
          console.error('Error deleting role:', error)
        }
      }
    }
  }

  const handleSubmit = async (data: RoleFormValues) => {
    try {
      if (editingRole) {
        // Only check permissions if user data is fully loaded
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          const hasEditPermission = await canEditRoles()
          if (!hasEditPermission) {
            toast.error(t('roles.update.unauthorized') || 'You do not have permission to update roles')
            return
          }
        }
        
        try {
          // Set the update role ID
          setUpdateRoleId(editingRole.id)
          // Trigger the update mutation
          await updateRoleMutation.mutateAsync(data)
          toast.success(t('roles.update.success') || 'Role updated successfully')
          setIsDialogOpen(false)
          setEditingRole(null)
        } catch (error: any) {
          // Error is handled by the mutation hook
          console.error('Error updating role:', error)
        }
      } else {
        // Only check permissions if user data is fully loaded
        if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
          const hasCreatePermission = await canCreateRoles()
          if (!hasCreatePermission) {
            toast.error(t('roles.create.unauthorized') || 'You do not have permission to create roles')
            return
          }
        }
        // Create new role
        try {
          await createRoleMutation.mutateAsync(data)
          toast.success(t('roles.create.success') || 'Role created successfully')
          setIsDialogOpen(false)
        } catch (error: any) {
          // Error is handled by the mutation hook
          console.error('Error creating role:', error)
        }
      }
    } catch (error: any) {
      console.error('Error submitting role form:', error)
      toast.error(error.message || (editingRole 
        ? t('roles.update.error') || 'Failed to update role' 
        : t('roles.create.error') || 'Failed to create role'))
    }
  }

  // Reset editing state when dialog is closed
  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open)
    if (!open) {
      setEditingRole(null)
      // Reset the IDs when closing the dialog
      setUpdateRoleId(null)
      setDeleteRoleId(null)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          <Shield className="h-8 w-8 mr-3 text-blue-500" />
          {t('roles.title') || 'Roles'}
        </h1>
        <p className="text-muted-foreground">{t('roles.description') || 'Manage system roles and permissions'}</p>
      </div>

      <Card className="hover:shadow-md transition-all duration-300 hover:-translate-y-1 border-t-4 border-t-blue-500">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>{t('roles.list.title') || 'Role List'}</CardTitle>
              <CardDescription>
                {t('roles.list.description') || 'A list of all roles in the system'}
              </CardDescription>
            </div>
            {canCreate && (
              <Button onClick={() => handleEdit(null)} className="rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                {t('roles.button') || 'Add Role'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <RolesTable 
            roles={roles}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            isDeleting={deleteRoleMutation.isPending}
            deletingRoleId={deleteRoleId}
          />
        </CardContent>
      </Card>

      <RoleForm 
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        editingRole={editingRole}
        onSubmit={handleSubmit}
        isSubmitting={editingRole ? updateRoleMutation.isPending : createRoleMutation.isPending}
      />
    </div>
  )
}