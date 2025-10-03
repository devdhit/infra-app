'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCurrentUser, useUpdateUser, useTenants, useRoles } from "@/hooks/useApi"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import { UserCreateUpdate } from "@/types/users"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { usePermissions } from "@/hooks/use-permissions"
import logger from '@/lib/logger'
import { Card } from "@/components/ui/card"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { t } = useTranslation()
  const { data: currentUser } = useCurrentUser()
  const { data: tenantsData } = useTenants()
  const { data: rolesData } = useRoles()
  const { updateUser: updateUserData, isLoading: isUpdating } = useUpdateUser(currentUser?.id || 'undefined')
  
  // Wrapper function to only call updateUser when we have a valid user ID
  const updateUser = async (data: Partial<UserCreateUpdate>) => {
    if (!currentUser?.id || currentUser.id === 'undefined') {
      throw new Error('No user ID available');
    }
    return updateUserData(data);
  }
  const { canEditUsers } = usePermissions()
  
  // Check if user can edit (only admins can edit profiles)
  const [canEdit, setCanEdit] = useState(false);
  
  useEffect(() => {
    const checkEditPermission = async () => {
      if (canEditUsers && typeof canEditUsers === 'function') {
        try {
          const result = await canEditUsers();
          setCanEdit(result);
        } catch (error) {
          setCanEdit(false);
        }
      } else {
        setCanEdit(false);
      }
    };
    
    checkEditPermission();
  }, [canEditUsers, currentUser]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    roleId: '',
    tenantId: '',
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isEditing, setIsEditing] = useState(false)

  // Initialize form data with current user data
  useEffect(() => {
    if (currentUser && open) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        password: '',
        confirmPassword: '',
        roleId: currentUser.role?.id || '',
        tenantId: currentUser.tenantId || '',
      })
      setIsEditing(false) // Reset to view mode when dialog opens
    }
  }, [currentUser, open])

  // Get user initials for avatar
  const userInitials = currentUser?.name 
    ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() 
    : 'U'

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = t('users.form.nameRequired') || 'Name is required'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('users.form.emailRequired') || 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('users.form.emailInvalid') || 'Invalid email format'
    }
    
    if (formData.password && formData.password.length < 6) {
      newErrors.password = t('users.form.passwordLength') || 'Password must be at least 6 characters'
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('profile.form.passwordMismatch') || 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      const updateData: Partial<UserCreateUpdate> = {
        name: formData.name,
        email: formData.email,
      }
      
      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password
      }
      
      // Only include role/tenant if user has permission to edit them
      if (canEdit && currentUser?.role?.name === 'admin') {
        updateData.roleId = formData.roleId || undefined
        updateData.tenantId = formData.tenantId || undefined
      }
      
      await updateUser(updateData)
      toast.success(t('profile.updateSuccess') || 'Profile updated successfully')
      setIsEditing(false)
    } catch (error: any) {
      logger.error('Error updating profile:', error)
      toast.error(error.message || t('profile.updateError') || 'Failed to update profile')
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        password: '',
        confirmPassword: '',
        roleId: currentUser.role?.id || '',
        tenantId: currentUser.tenantId || '',
      })
    }
    setErrors({})
    setIsEditing(false)
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form when closing
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        password: '',
        confirmPassword: '',
        roleId: currentUser.role?.id || '',
        tenantId: currentUser.tenantId || '',
      })
    }
    setErrors({})
    setIsEditing(false)
  }

  if (!currentUser) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <div className="flex items-center justify-center h-24">
            <p>{t('profile.loading') || 'Loading profile...'}</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('profile.title') || 'User Profile'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info Section */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <Avatar className="h-20 w-20 border-2 border-muted">
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-semibold">{currentUser.name}</h3>
              <p className="text-muted-foreground">{currentUser.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  {currentUser.role?.name || 'User'}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('profile.memberSince') || 'Member since'}{' '}
                {currentUser.createdAt 
                  ? new Date(currentUser.createdAt).toLocaleDateString() 
                  : 'Unknown'}
              </p>
            </div>
          </div>
          
          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('users.form.name') || 'Name'}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={errors.name ? 'border-red-500' : ''}
                      disabled={isUpdating}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('users.form.email') || 'Email'}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={errors.email ? 'border-red-500' : ''}
                      disabled={isUpdating}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">
                      {t('users.form.newPassword') || 'New Password'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={errors.password ? 'border-red-500' : ''}
                      disabled={isUpdating}
                      placeholder={t('users.form.newPasswordPlaceholder') || 'Leave blank to keep current password'}
                    />
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {t('profile.form.confirmPassword') || 'Confirm Password'}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                      disabled={isUpdating}
                    />
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                  </div>
                  
                  {/* Role and Tenant fields - only visible to admins */}
                  {(canEdit && currentUser?.role?.name === 'admin') && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="role">{t('users.form.role') || 'Role'}</Label>
                        <Select 
                          value={formData.roleId} 
                          onValueChange={(value) => handleInputChange('roleId', value)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('users.form.selectRole') || 'Select a role'} />
                          </SelectTrigger>
                          <SelectContent>
                            {rolesData?.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tenant">{t('users.form.tenant') || 'Tenant'}</Label>
                        <Select 
                          value={formData.tenantId} 
                          onValueChange={(value) => handleInputChange('tenantId', value)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('users.form.selectTenant') || 'Select a tenant'} />
                          </SelectTrigger>
                          <SelectContent>
                            {tenantsData?.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id}>
                                {tenant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    disabled={isUpdating}
                  >
                    {isUpdating && (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    )}
                    {t('common.save') || 'Save'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancel}
                    disabled={isUpdating}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </Button>
                </div>
              </>
            ) : (
              // View mode - display user information in cards
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">{t('users.form.name') || 'Name'}</Label>
                      <p className="font-medium">{currentUser.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('users.form.email') || 'Email'}</Label>
                      <p className="font-medium">{currentUser.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('users.form.role') || 'Role'}</Label>
                      <p className="font-medium">{currentUser.role?.name || 'User'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">{t('profile.memberSince') || 'Member Since'}</Label>
                      <p className="font-medium">
                        {currentUser.createdAt 
                          ? new Date(currentUser.createdAt).toLocaleDateString() 
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </Card>
                
                {/* Only show edit button for admin users */}
                {canEdit && currentUser?.role?.name === 'admin' && (
                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      onClick={() => setIsEditing(true)}
                    >
                      {t('common.edit') || 'Edit'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}