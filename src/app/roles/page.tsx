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
import { useRoles, useCreateRole, useUpdateRole, useBulkDeleteRoles } from "@/hooks/useRoles"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"
import { RolesTable } from "@/components/roles/roles-table"
import { RoleForm } from "@/components/roles/role-form"
import { ConfirmDialog } from "@/components/roles/confirm-dialog"
import { RoleFormValues, Role } from "@/types/roles"
import { Plus, Shield } from "lucide-react"
import { useCurrentUser } from '@/hooks/useApi'
import { api } from '@/lib/api'

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
  
  const { data: roles = [], isLoading, isError, error, refetch } = useRoles()
  const createRoleMutation = useCreateRole()
  // We'll manage the ID for update operations in state
  const [updateRoleId, setUpdateRoleId] = useState<string | null>(null)
  const updateRoleMutation = useUpdateRole(updateRoleId || 'placeholder')
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
          console.log('Checking roles page permissions:', {
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
            console.log('Roles page permission results:', {
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
    
    checkPermissions();
    
    return () => {
      isCancelledRef.current = true;
      // Reset the permission checking flag when component unmounts
      isCheckingPermissions.current = false;
    };
  }, [userRole, canViewRoles, canCreateRoles, canEditRoles, canDeleteRoles, canBulkDeleteRoles, currentUser, isUserLoading]);

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

  const handleEdit = async (role: Role | null) => {
    try {
      // Only check permissions if user data is fully loaded
      if (!isUserLoading && currentUser && currentUser.role?.id && currentUser.tenantId) {
        // For debugging in development only
        if (process.env.NODE_ENV === 'development') {
          console.log('Checking edit permissions for role:', {
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
          console.log('Edit permission check results:', {
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
        console.error('Error checking edit permissions:', error)
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
        console.error('Error checking delete permissions:', error)
      }
      toast.error(t('common.error') || 'An error occurred while checking permissions')
    }
  }

  const confirmDelete = async () => {
    if (!roleToDelete) return
    
    try {
      // Instead of creating a new hook (which violates React rules), 
      // we'll use the api client directly for the delete operation
      await api.delete<void>(`/roles/${roleToDelete}`)
      toast.success(t('roles.delete.success') || 'Role deleted successfully')
      refetch()
    } catch (error: any) {
      // Log errors only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting role:', error)
      }
      toast.error(error.message || t('roles.delete.error') || 'Failed to delete role')
    } finally {
      setIsDeleteConfirmOpen(false)
      setRoleToDelete(null)
    }
  }

  const confirmBulkDelete = async () => {
    try {
      // Trigger the bulk delete mutation with the correct payload
      await bulkDeleteRolesMutation.mutateAsync({ ids: rolesToBulkDelete })
      toast.success(t('roles.bulkDelete.success', '{0} roles deleted successfully', rolesToBulkDelete.length.toString()) || 
                   `${rolesToBulkDelete.length} roles deleted successfully`)
      refetch()
    } catch (error: any) {
      // Error is handled by the mutation hook
      // Log errors only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error bulk deleting roles:', error)
      }
    } finally {
      setIsBulkDeleteConfirmOpen(false)
      setRolesToBulkDelete([])
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
          // Ensure the update role ID is set correctly
          if (!updateRoleId) {
            setUpdateRoleId(editingRole.id)
          }
          // Trigger the update mutation
          await updateRoleMutation.mutateAsync(data)
          toast.success(t('roles.update.success') || 'Role updated successfully')
          setIsDialogOpen(false)
          setEditingRole(null)
          setUpdateRoleId(null)
        } catch (error: any) {
          // Log errors only in development
          if (process.env.NODE_ENV === 'development') {
            console.error('Error updating role:', error)
          }
          // Error is handled by the mutation hook
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
          // Log errors only in development
          if (process.env.NODE_ENV === 'development') {
            console.error('Error creating role:', error)
          }
          // Error is handled by the mutation hook
        }
      }
    } catch (error: any) {
      // Log errors only in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error submitting role form:', error)
      }
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
            onDelete={(canDelete || canBulkDelete) ? handleDelete : undefined}
            isDeleting={bulkDeleteRolesMutation.isPending}
            deletingRoleId={null}
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
      
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title={t('roles.delete.confirmTitle') || 'Delete Role'}
        description={t('roles.delete.confirmDescription') || 'Are you sure you want to delete this role? This action cannot be undone.'}
        confirmText={t('common.delete') || 'Delete'}
        cancelText={t('common.cancel') || 'Cancel'}
        onConfirm={confirmDelete}
        isLoading={false}
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
        isLoading={bulkDeleteRolesMutation.isPending}
      />
    </div>
  )
}