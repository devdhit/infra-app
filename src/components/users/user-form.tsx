'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-translation"
import { UserFormProps, UserFormValues } from "@/types/users"
import { useRoles } from '@/hooks/useRoles'

export function UserForm({ 
  open, 
  onOpenChange, 
  editingUser, 
  tenants,
  onSubmit, 
  isSubmitting 
}: UserFormProps) {
  const { t } = useTranslation()
  const { data: roles = [] } = useRoles()
  
  // Use the first available role as default, or 'user' if none available
  const DEFAULT_ROLE = (roles && roles.length > 0 && roles[0]) ? roles[0].name : 'user'
  
  const [formData, setFormData] = useState<UserFormValues>({
    email: editingUser?.email || '',
    name: editingUser?.name || '',
    password: '',
    role: editingUser?.role?.name || DEFAULT_ROLE,
    tenantId: editingUser?.tenantId || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when editingUser changes
  useEffect(() => {
    if (editingUser) {
      setFormData({
        email: editingUser.email || '',
        name: editingUser.name || '',
        password: '',
        role: editingUser.role?.name || DEFAULT_ROLE,
        tenantId: editingUser.tenantId || '',
      })
    } else {
      // Reset to default values
      setFormData({
        email: '',
        name: '',
        password: '',
        role: DEFAULT_ROLE,
        tenantId: '',
      })
    }
  }, [editingUser, DEFAULT_ROLE]);

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
    
    if (!editingUser && !formData.password) {
      newErrors.password = t('users.form.passwordRequired') || 'Password is required'
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = t('users.form.passwordLength') || 'Password must be at least 6 characters'
    }
    
    if (!formData.tenantId) {
      newErrors.tenantId = t('users.form.tenantRequired') || 'Tenant is required'
    }
    
    if (!formData.role) {
      newErrors.role = t('users.form.roleRequired') || 'Role is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    onSubmit({
      id: editingUser?.id,
      email: formData.email,
      name: formData.name,
      password: formData.password || undefined,
      role: formData.role,
      tenantId: formData.tenantId,
    })
  }

  const handleInputChange = (field: keyof UserFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      role: DEFAULT_ROLE,
      tenantId: '',
    })
    setErrors({})
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen)
      if (!isOpen) {
        resetForm()
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingUser 
              ? t('users.edit.title') || 'Edit User' 
              : t('users.create.title') || 'Create User'}
          </DialogTitle>
          <DialogDescription>
            {editingUser 
              ? t('users.edit.description') || 'Edit user details' 
              : t('users.create.description') || 'Add a new user to the system'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t('users.form.name') || 'Name'}
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                {t('users.form.email') || 'Email'}
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>
            {!editingUser && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  {t('users.form.password') || 'Password'}
                </Label>
                <div className="col-span-3">
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={errors.password ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                  />
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>
              </div>
            )}
            {editingUser && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  {t('users.form.newPassword') || 'New Password'}
                </Label>
                <div className="col-span-3">
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={errors.password ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                    placeholder={t('users.form.newPasswordPlaceholder') || 'Leave blank to keep current password'}
                  />
                  {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                {t('users.form.role') || 'Role'}
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleInputChange('role', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles && roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tenant" className="text-right">
                {t('users.form.tenant') || 'Tenant'}
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.tenantId || ''} 
                  onValueChange={(value) => handleInputChange('tenantId', value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('users.form.selectTenant') || 'Select a tenant'} />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant: any) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tenantId && <p className="text-sm text-red-500 mt-1">{errors.tenantId}</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              )}
              {editingUser 
                ? t('common.update') || 'Update' 
                : t('common.create') || 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}