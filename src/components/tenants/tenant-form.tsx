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
import { Textarea } from "@/components/ui/textarea"
import { useTranslation } from "@/hooks/use-translation"
import { Tenant } from "@/hooks/useApi"

// Define the interface directly in this file to avoid import issues
interface TenantFormValues {
  id?: string;
  name: string;
  description?: string;
}

interface TenantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTenant: Tenant | null;
  onSubmit: (data: TenantFormValues) => void;
  isSubmitting: boolean;
}

export function TenantForm({ 
  open, 
  onOpenChange, 
  editingTenant, 
  onSubmit, 
  isSubmitting 
}: TenantFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: editingTenant?.name || '',
    description: editingTenant?.description || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update form data when editingTenant changes
  useEffect(() => {
    setFormData({
      name: editingTenant?.name || '',
      description: editingTenant?.description || '',
    })
  }, [editingTenant])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = t('tenants.form.nameRequired') || 'Name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    onSubmit({
      id: editingTenant?.id,
      name: formData.name,
      description: formData.description || undefined,
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
      name: editingTenant?.name || '',
      description: editingTenant?.description || '',
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
            {editingTenant 
              ? t('tenants.edit.title') || 'Edit Tenant' 
              : t('tenants.create.title') || 'Create Tenant'}
          </DialogTitle>
          <DialogDescription>
            {editingTenant 
              ? t('tenants.edit.description') || 'Edit tenant details' 
              : t('tenants.create.description') || 'Add a new tenant organization'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                {t('tenants.form.name') || 'Name'}
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
                {t('tenants.form.description') || 'Description'}
              </Label>
              <div className="col-span-3">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="min-h-[100px]"
                  disabled={isSubmitting}
                />
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
              ) : editingTenant ? (
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