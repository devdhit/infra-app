'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { ResourceType, PermissionAction, COMMON_RESOURCE_TYPES, COMMON_PERMISSION_ACTIONS } from '@/lib/permissions'

// Define common resource types and actions for the UI
const COMMON_RESOURCE_TYPES_ARRAY: ResourceType[] = [...COMMON_RESOURCE_TYPES]
const ASSET_TYPES: ResourceType[] = ['pc', 'laptop', 'printer', 'license', 'warehouse', 'internet', 'fixed-asset', 'it-purchasing']
const COMMON_PERMISSION_ACTIONS_ARRAY: PermissionAction[] = [...COMMON_PERMISSION_ACTIONS]

export function RoleForm({ 
  open, 
  onOpenChange, 
  editingRole, 
  onSubmit, 
  isSubmitting 
}: RoleFormProps) {
  const { t } = useTranslation()
  
  // Initialize permissions structure with all resource types
  const initialPermissions = useMemo(() => {
    const permissions: Record<ResourceType, PermissionAction[]> = {}
    
    // Initialize all common resource types with empty arrays
    COMMON_RESOURCE_TYPES_ARRAY.forEach(resource => {
      permissions[resource] = []
    })
    
    // Also initialize asset types
    ASSET_TYPES.forEach(assetType => {
      if (!permissions[assetType]) {
        permissions[assetType] = []
      }
    })
    
    return permissions
  }, [])
  
  const [formData, setFormData] = useState<RoleFormValues>({
    name: '',
    description: '',
    permissions: initialPermissions
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Update form data when editingRole changes
  useEffect(() => {
    if (editingRole) {
      // Create a complete permissions object with all resource types
      const completePermissions: Record<ResourceType, PermissionAction[]> = { ...initialPermissions }
      
      // Merge editingRole permissions, ensuring all resource types are present
      if (editingRole.permissions) {
        Object.keys(editingRole.permissions).forEach(resource => {
          completePermissions[resource] = Array.isArray(editingRole.permissions[resource]) 
            ? [...editingRole.permissions[resource]] 
            : []
        })
      }
      
      setFormData({
        name: editingRole.name,
        description: editingRole.description || '',
        permissions: completePermissions
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

  // Validate a specific field
  const validateField = useCallback((field: string, value: string) => {
    switch (field) {
      case 'name':
        if (!value.trim()) {
          return t('roles.form.nameRequired') || 'Role name is required'
        }
        if (value.trim().length < 2) {
          return t('roles.form.nameTooShort') || 'Role name must be at least 2 characters'
        }
        if (value.trim().length > 50) {
          return t('roles.form.nameTooLong') || 'Role name must be less than 50 characters'
        }
        return ''
      default:
        return ''
    }
  }, [t])

  // Validate the entire form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}
    
    // Validate name field
    const nameError = validateField('name', formData.name)
    if (nameError) {
      newErrors.name = nameError
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData.name, validateField])

  // Handle field blur for validation
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field as keyof RoleFormValues] as string)
    setErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Mark all fields as touched
    const allFields = ['name']
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}))
    
    if (!validateForm()) return
    
    onSubmit({
      id: editingRole?.id,
      name: formData.name.trim(),
      description: formData.description.trim(),
      permissions: formData.permissions
    })
  }

  const handleInputChange = (field: keyof RoleFormValues, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Validate field if it has been touched
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({
        ...prev,
        [field]: error
      }))
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

  // Handle select all/none for a resource
  const handleSelectAllForResource = (resource: ResourceType, selectAll: boolean) => {
    setFormData(prev => {
      const newPermissions = { ...prev.permissions }
      
      if (selectAll) {
        // Select all actions
        newPermissions[resource] = [...COMMON_PERMISSION_ACTIONS_ARRAY]
      } else {
        // Deselect all actions
        newPermissions[resource] = []
      }
      
      return { ...prev, permissions: newPermissions }
    })
  }

  // Check if all actions are selected for a resource
  const areAllActionsSelected = (resource: ResourceType) => {
    const resourcePermissions = formData.permissions[resource] || []
    return COMMON_PERMISSION_ACTIONS_ARRAY.every(action => resourcePermissions.includes(action))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: initialPermissions
    })
    setErrors({})
    setTouched({})
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen)
      if (!isOpen) {
        resetForm()
      }
    }}>
      <DialogContent className="sm:max-w-[800px] max-h-[60vh] overflow-y-auto">
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
                  onBlur={() => handleBlur('name')}
                  className={errors.name ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.name && touched.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                <p className="text-sm text-muted-foreground mt-1">
                  {t('roles.form.nameHelp') || 'Enter a unique name for this role'}
                </p>
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
                  onBlur={() => handleBlur('description')}
                  disabled={isSubmitting}
                  rows={3}
                  placeholder={t('roles.form.descriptionPlaceholder') || 'Enter role description (optional)'}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t('roles.form.descriptionHelp') || 'Describe the purpose of this role'}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                {t('roles.form.permissions') || 'Permissions'}
              </Label>
              <div className="col-span-3 space-y-4">
                {COMMON_RESOURCE_TYPES_ARRAY.map(resource => (
                  <div key={resource} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium capitalize">
                        {t(`roles.permissions.${resource}.label`) || resource}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`select-all-${resource}`}
                          checked={areAllActionsSelected(resource)}
                          onCheckedChange={(checked) => 
                            handleSelectAllForResource(resource, checked as boolean)
                          }
                          disabled={isSubmitting}
                        />
                        <label 
                          htmlFor={`select-all-${resource}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {t('roles.form.selectAll') || 'Select all'}
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {COMMON_PERMISSION_ACTIONS_ARRAY.map(action => (
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium capitalize">
                      {t('roles.permissions.assets.assetSpecific') || 'Asset-Specific Permissions'}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t('roles.permissions.assets.assetSpecificDescription') || 'Configure permissions for specific asset types'}
                  </p>
                  {ASSET_TYPES.map(assetType => (
                    <div key={assetType} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm capitalize">
                          {t(`assets.${assetType}.title`) || t(`nav.${assetType}`) || assetType}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`select-all-${assetType}`}
                            checked={areAllActionsSelected(assetType)}
                            onCheckedChange={(checked) => 
                              handleSelectAllForResource(assetType, checked as boolean)
                            }
                            disabled={isSubmitting}
                          />
                          <label 
                            htmlFor={`select-all-${assetType}`} 
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {t('roles.form.selectAll') || 'Select all'}
                          </label>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-muted">
                        {COMMON_PERMISSION_ACTIONS_ARRAY.map(action => (
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
                              {t(`roles.permissions.${assetType}.${action}`) || t(`roles.permissions.assets.${action}`) || action}
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