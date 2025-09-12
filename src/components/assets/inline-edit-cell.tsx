'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useUpdateAsset, useUpdateAssetCustomFields } from "@/hooks/useApi"
import { toast } from "sonner"
import { Asset, AssetFormField } from "@/types/assets"
import { useTranslation } from "@/hooks/use-translation"
import { Badge } from "@/components/ui/badge"
import { Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getModelType, isCustomField, createUpdateData } from "@/lib/custom-fields"

interface InlineEditCellProps {
  asset: Asset
  assetType: string
  field: AssetFormField
  value: any
  onUpdate: (newValue: any) => void
  isCustomField?: boolean
  customFieldsData?: any[]
}

export function InlineEditCell({ asset, assetType, field, value, onUpdate, isCustomField: propIsCustomField, customFieldsData }: InlineEditCellProps) {
  const { t } = useTranslation()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Map assetType to modelType for custom fields
  const modelType = getModelType(assetType);

  // Determine if this is a custom field - prioritize the prop if provided, otherwise use the utility function
  const isCustom = propIsCustomField !== undefined ? propIsCustomField : isCustomField(field.name, asset, customFieldsData);
  
  // Always call both hooks to comply with React's rules of hooks
  const updateCustomFieldsMutation = useUpdateAssetCustomFields(modelType, asset.id)
  const updateAssetMutation = useUpdateAsset(assetType, asset.id)

  // Use the appropriate mutation based on whether this is a custom field
  const updateMutation = isCustom ? updateCustomFieldsMutation : updateAssetMutation
  
  // Focus the input when editing starts
  useEffect(() => {
    if (isEditing) {
      // Use setTimeout to ensure the input is rendered before focusing
      setTimeout(() => {
        if (field.type === 'textarea' && textareaRef.current) {
          textareaRef.current.focus()
        } else if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 0)
    }
  }, [isEditing, field.type])
  
  const handleEdit = () => {
    setEditValue(value || '')
    setIsEditing(true)
  }
  
  const handleCancel = () => {
    setEditValue(value || '')
    setIsEditing(false)
  }
  
  const handleSave = async () => {
    try {
      // Process the value based on field type
      let processedValue = editValue
      
      if (field.type === 'number') {
        processedValue = editValue === '' ? null : Number(editValue)
      } else if (field.type === 'date' && editValue) {
        // Convert to ISO string for API
        const dateValue = new Date(editValue)
        if (dateValue.toString() !== 'Invalid Date') {
          processedValue = dateValue.toISOString()
        } else {
          processedValue = null
        }
      } else if (field.type === 'boolean') {
        processedValue = editValue === true || editValue === 'true'
      } else if (editValue === '') {
        processedValue = null
      }
      
      // Create update data using utility function
      const updateData = createUpdateData(field.name, processedValue, isCustom, asset);
      
      // Send the update to the server
      // Check which type of mutation we have
      if ('updateAssetCustomFields' in updateMutation) {
        await updateMutation.updateAssetCustomFields(updateData);
      } else if ('updateAsset' in updateMutation) {
        await updateMutation.updateAsset(updateData);
      }
      
      // Exit edit mode first for better UX
      setIsEditing(false)
      
      // Show success message
      toast.success(t('assets.update.success', '{0} updated successfully', field.label))
      
      // This critical step allows the parent component to update its state
      // which will then trigger React Query cache updates
      onUpdate(processedValue)
      
      // Force refresh the data after a short delay to ensure the server has processed the update
      // Since we're removing React Query, we'll rely on the parent component to handle refresh
      setTimeout(() => {
        // The parent component should handle data refresh
      }, 100);
    } catch (error: any) {
      console.error("Inline edit error:", error)
      let message = t('assets.update.error', 'Failed to update {0}', field.label)
      
      if (error.message) {
        message = error.message
      }
      
      toast.error(message)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && field.type !== 'textarea') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }
  
  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{field.label}</h3>
              {isCustom && (
                <Badge variant="secondary" className="text-xs">
                  Custom Field
                </Badge>
              )}
            </div>
            
            <div className="mb-4">
              {field.type === 'textarea' ? (
                <Textarea
                  ref={textareaRef}
                  value={editValue || ''}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[120px] w-full"
                  placeholder={field.placeholder}
                />
              ) : field.type === 'select' ? (
                <Select 
                  value={editValue || ''} 
                  onValueChange={setEditValue}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'boolean' ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={Boolean(editValue)}
                    onChange={(e) => setEditValue(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    {field.placeholder || "Check to enable"}
                  </span>
                </div>
              ) : (
                <Input
                  ref={inputRef}
                  type={field.type}
                  value={editValue || ''}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-12 text-lg"
                  placeholder={field.placeholder}
                />
              )}
            </div>
            
            {field.description && (
              <div className="flex items-start mb-4">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{field.description}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={updateMutation.isLoading}
              >
                {t('common.cancel', "Cancel")}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    {t('common.saving', "Saving...")}
                  </div>
                ) : (
                  t('common.save', "Save")
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      className="cursor-pointer hover:bg-muted p-2 rounded min-h-[40px] flex items-center group"
      onClick={handleEdit}
    >
      <div className="flex-1">
        {field.render ? field.render(value) : 
         field.type === 'boolean' ? (value ? 'Yes' : 'No') : 
         String(value || '')}
      </div>
      {isCustom && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Custom
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Custom Field</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}