'use client'

import { useState } from 'react'
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
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/use-translation"
import { User, Tenant } from "@/hooks/useApi"

// Define the interface directly in this file to avoid import issues
interface UserFormValues {
  id?: string;
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'user';
  tenantId?: string;
}

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingUser: User | null;
  tenants: Tenant[];
  onSubmit: (data: UserFormValues) => void;
  isSubmitting: boolean;
}

export function UserForm({ 
  open, 
  onOpenChange, 
  editingUser, 
  tenants, 
  onSubmit, 
  isSubmitting 
}: UserFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    email: editingUser?.email || '',
    name: editingUser?.name || '',
    password: '',
    role: editingUser?.role as 'admin' | 'user' || 'user',
    tenantId: editingUser?.tenantId || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = t('users.form.emailRequired') || 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('users.form.emailInvalid') || 'Email is invalid'
    }
    
    if (!formData.name) {
      newErrors.name = t('users.form.nameRequired') || 'Name is required'
    }
    
    if (!editingUser && !formData.password) {
      newErrors.password = t('users.form.passwordRequired') || 'Password is required'
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = t('users.form.passwordMinLength') || 'Password must be at least 6 characters'
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
      tenantId: formData.tenantId || undefined,
    })
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

  const resetForm = () => {
    setFormData({
      email: editingUser?.email || '',
      name: editingUser?.name || '',
      password: '',
      role: editingUser?.role as 'admin' | 'user' || 'user',
      tenantId: editingUser?.tenantId || '',
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
      <DialogContent className="sm:max-w-[425px]">
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
                    placeholder={t('users.form.passwordPlaceholder') || "Leave blank to keep current password"}
                    disabled={isSubmitting}
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
                    <SelectItem value="user">{t('users.roles.user') || 'User'}</SelectItem>
                    <SelectItem value="admin">{t('users.roles.admin') || 'Administrator'}</SelectItem>
                  </SelectContent>
                </Select>
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
                    <SelectValue placeholder={t('users.form.selectTenant') || "Select a tenant"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  {t('common.saving') || 'Saving...'}
                </div>
              ) : editingUser ? (
                t('common.update') || 'Update'
              ) : (
                t('common.create') || 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}