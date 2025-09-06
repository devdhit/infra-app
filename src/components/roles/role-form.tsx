'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslation } from "@/hooks/use-translation"
import { RoleFormProps, RoleFormValues } from "@/types/roles"
import { ResourceType, PermissionAction } from '@/lib/permissions'

const RESOURCE_TYPES: ResourceType[] = ['users', 'tenants', 'assets', 'settings', 'roles']
const ASSET_TYPES: ResourceType[] = ['pc', 'laptop', 'printer', 'license', 'warehouse', 'internet']
const PERMISSION_ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'bulkDelete']

export function RoleForm({ 
  open, 
  onOpenChange, 
  editingRole, 
  onSubmit, 
  isSubmitting 
}: RoleFormProps) {
  const { t } = useTranslation()
  
  // Initialize permissions structure
  const initialPermissions = useMemo(() => ({
    users: [],
    tenants: [],
    assets: [],
    settings: [],
    roles: [],
    pc: [],
    laptop: [],
    printer: [],
    license: [],
    warehouse: [],
    internet: []
  }), [])
  
  const [formData, setFormData] = useState<RoleFormValues>({
    name: '',
    description: '',
    permissions: initialPermissions
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when editingRole changes
  useEffect(() => {
    if (editingRole) {
      setFormData({
        name: editingRole.name,
        description: editingRole.description || '',
        permissions: editingRole.permissions || initialPermissions
      })
    } else {
      // Reset to default values
      setFormData({
        name: '',
        description: '',
        permissions: initialPermissions
      })
    }
  }, [editingRole, initialPermissions])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = t('roles.form.nameRequired') || 'Role name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    onSubmit({
      id: editingRole?.id,
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions
    })
  }

  const handleInputChange = (field: keyof RoleFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }

  const handlePermissionChange = (resource: ResourceType, action: PermissionAction, checked: boolean) => {
    setFormData(prev => {
      const newPermissions = { ...prev.permissions }
      const resourcePermissions = newPermissions[resource] || []
      
      if (checked) {
        // Add action if not already present
        if (!resourcePermissions.includes(action)) {
          newPermissions[resource] = [...resourcePermissions, action]
        }
      } else {
        // Remove action
        newPermissions[resource] = resourcePermissions.filter(a => a !== action)
      }
      
      return { ...prev, permissions: newPermissions }
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: initialPermissions
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
            {editingRole 
              ? t('roles.edit.title') || 'Edit Role' 
              : t('roles.create.title') || 'Create Role'}
          </DialogTitle>
          <DialogDescription>
            {editingRole 
              ? t('roles.edit.description') || 'Edit role details and permissions' 
              : t('roles.create.description') || 'Add a new role to the system'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t('roles.form.name') || 'Name'}
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
              <Label htmlFor="description" className="text-right">
                {t('roles.form.description') || 'Description'}
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder={t('roles.form.descriptionPlaceholder') || 'Enter role description (optional)'}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                {t('roles.form.permissions') || 'Permissions'}
              </Label>
              <div className="col-span-3 space-y-4">
                {RESOURCE_TYPES.map(resource => (
                  <div key={resource} className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2 capitalize">
                      {t(`roles.permissions.${resource}.label`) || resource}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {PERMISSION_ACTIONS.map(action => (
                        <div key={`${resource}-${action}`} className="flex items-center space-x-2">
                          <Checkbox
                            id={`${resource}-${action}`}
                            checked={formData.permissions[resource]?.includes(action) || false}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(resource, action, checked as boolean)
                            }
                            disabled={isSubmitting}
                          />
                          <label 
                            htmlFor={`${resource}-${action}`} 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                          >
                            {t(`roles.permissions.${resource}.${action}`) || action}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Asset-specific permissions section */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2 capitalize">
                    {t('roles.permissions.assets.assetSpecific') || 'Asset-Specific Permissions'}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('roles.permissions.assets.assetSpecificDescription') || 'Configure permissions for specific asset types'}
                  </p>
                  {ASSET_TYPES.map(assetType => (
                    <div key={assetType} className="mb-3 last:mb-0">
                      <h4 className="font-medium text-sm mb-2 capitalize">
                        {t(`assets.${assetType}.title`) || assetType}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-muted">
                        {PERMISSION_ACTIONS.map(action => (
                          <div key={`${assetType}-${action}`} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${assetType}-${action}`}
                              checked={formData.permissions[assetType]?.includes(action) || false}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(assetType, action, checked as boolean)
                              }
                              disabled={isSubmitting}
                            />
                            <label 
                              htmlFor={`${assetType}-${action}`} 
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                            >
                              {t(`roles.permissions.assets.${action}`) || action}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
              {editingRole 
                ? t('common.update') || 'Update' 
                : t('common.create') || 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}