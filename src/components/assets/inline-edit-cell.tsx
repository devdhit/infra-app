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
import { useCurrentUser } from "@/contexts/current-user-context"
import { toast } from "sonner"
import { Asset, AssetFormField } from "@/types/assets"
import { useTranslation } from "@/hooks/use-translation"
import { Badge } from "@/components/ui/badge"
import { Info, Check, X, Edit3, Save } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getModelType, isCustomField, createUpdateData } from "@/lib/custom-fields"
import { cn } from "@/lib/utils"
// Import the Dialog components for a more consistent popup experience
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import logger from '@/lib/logger'
import { useDuplicateCheck } from "@/hooks/useDuplicateCheck"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)
  const [duplicateInfo, setDuplicateInfo] = useState<{barcode: string, assetType: string, dept: string} | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Map assetType to modelType for custom fields
  const modelType = getModelType(assetType);

  // Determine if this is a custom field - prioritize the prop if provided, otherwise use the utility function
  const isCustom = propIsCustomField !== undefined ? propIsCustomField : isCustomField(field.name, asset, customFieldsData);
  
  // Get current user for tenant ID
  const { data: currentUser } = useCurrentUser();
  
  // Duplicate check hook
  const { checkForDuplicate } = useDuplicateCheck();
  
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
      
      // Check for duplicates if this is a barcode field being edited
      const isBarcodeField = (
        assetType === 'pc' && (
          field.name === 'cpuBarcode' || 
          field.name === 'cpuSapBarcode' || 
          field.name === 'monitorBarcode' || 
          field.name === 'monitorSapBarcode' || 
          field.name === 'upsBarcode' || 
          field.name === 'upsSapBarcode'
        )
      ) || (
        assetType === 'warehouse' && (
          field.name === 'barcode' || 
          field.name === 'sapCode'
        )
      );
      
      if (isBarcodeField && processedValue) {
        const tenantId = currentUser?.tenantId;
        if (tenantId) {
          const checkAssetType = assetType === 'pc' ? 'pc' : 'warehouse';
          const result = await checkForDuplicate(tenantId, processedValue, checkAssetType);
          
          if (result.isDuplicate) {
            setDuplicateInfo({
              barcode: processedValue,
              assetType: result.duplicateInfo?.type || (assetType === 'pc' ? 'warehouse' : 'pc'),
              dept: result.duplicateInfo?.dept || 'Unknown'
            });
            setShowDuplicateWarning(true);
            return; // Don't save yet, show warning first
          }
        }
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
      
      // Call onUpdate to notify parent component of the change
      // Use a more aggressive delay to ensure cache operations complete
      setTimeout(() => {
        onUpdate(processedValue)
      }, 100); // Reduced delay for faster UI updates
    } catch (error: any) {
      logger.error("Inline edit error:", error)
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
      <>
        {/* Duplicate Warning Dialog */}
        <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                {t('assets.duplicate.title', 'Duplicate Asset Found')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <Alert variant="destructive" className="border-yellow-200 bg-yellow-50 text-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <AlertTitle>{t('assets.duplicate.warning', 'Warning')}</AlertTitle>
                <AlertDescription className="text-yellow-700">
                  {t('assets.duplicate.inlineEditMessage', 'The barcode you entered already exists in another asset type.')}
                  <br />
                  <strong>{t('assets.duplicate.proceedWarning', 'If you proceed, the duplicate asset will be automatically deleted.')}</strong>
                </AlertDescription>
              </Alert>
              
              {duplicateInfo && (
                <div className="grid gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm font-medium">
                      {t('assets.duplicate.barcode', 'Barcode')}:
                    </div>
                    <div className="text-sm">{duplicateInfo.barcode}</div>
                    
                    <div className="text-sm font-medium">
                      {t('assets.duplicate.assetType', 'Asset Type')}:
                    </div>
                    <div className="text-sm capitalize">{duplicateInfo.assetType}</div>
                    
                    <div className="text-sm font-medium">
                      {t('assets.duplicate.department', 'Department')}:
                    </div>
                    <div className="text-sm">{duplicateInfo.dept}</div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={() => setShowDuplicateWarning(false)}
                className="transition-all hover:shadow-md"
              >
                <X className="mr-2 h-4 w-4" />
                {t('common.cancel', "Cancel")}
              </Button>
              <Button 
                onClick={async () => {
                  setShowDuplicateWarning(false);
                  // Proceed with saving and bypass duplicate check
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
                    
                    // Add bypass flag to bypass duplicate checking
                    // This will cause the backend to delete any duplicate assets before updating
                    const updateDataWithBypass = {
                      ...updateData,
                      bypassDuplicateCheck: true
                    };
                    
                    // Send the update to the server
                    if ('updateAssetCustomFields' in updateMutation) {
                      await updateMutation.updateAssetCustomFields(updateDataWithBypass);
                    } else if ('updateAsset' in updateMutation) {
                      await updateMutation.updateAsset(updateDataWithBypass);
                    }
                    
                    // Exit edit mode
                    setIsEditing(false)
                    
                    // Show success message
                    toast.success(t('assets.update.success', '{0} updated successfully', field.label))
                    
                    // Call onUpdate to notify parent component of the change
                    setTimeout(() => {
                      onUpdate(processedValue)
                    }, 100);
                  } catch (error: any) {
                    logger.error("Inline edit error:", error)
                    let message = t('assets.update.error', 'Failed to update {0}', field.label)
                    
                    if (error.message) {
                      message = error.message
                    }
                    
                    toast.error(message)
                  }
                }}
                className="transition-all hover:shadow-md"
              >
                <Save className="mr-2 h-4 w-4" />
                {t('assets.duplicate.proceed', 'Proceed Anyway')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Main Edit Dialog */}
        <Dialog open={isEditing && !showDuplicateWarning} onOpenChange={(open) => {
          if (!open) {
            handleCancel()
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-primary" />
                {field.label}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {isCustom && (
                <div className="flex justify-end">
                  <Badge variant="secondary" className="text-xs">
                    Custom Field
                  </Badge>
                </div>
              )}
              
              <div className="space-y-4">
                {field.type === 'textarea' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {field.label}
                    </label>
                    <Textarea
                      ref={textareaRef}
                      value={editValue || ''}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[120px] transition-all focus:ring-2 focus:ring-primary/30"
                      placeholder={field.placeholder}
                    />
                  </div>
                ) : field.type === 'select' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {field.label}
                    </label>
                    <Select 
                      value={editValue || ''} 
                      onValueChange={setEditValue}
                    >
                      <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/30">
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
                  </div>
                ) : field.type === 'boolean' ? (
                  <div className="flex items-center space-x-2 p-3 rounded-lg border bg-muted/50 transition-all hover:bg-muted/80">
                    <input
                      type="checkbox"
                      checked={Boolean(editValue)}
                      onChange={(e) => setEditValue(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <span className="text-sm text-foreground font-medium">
                      {field.label}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {field.label}
                    </label>
                    <Input
                      ref={inputRef}
                      type={field.type}
                      value={editValue || ''}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="h-12 text-lg transition-all focus:ring-2 focus:ring-primary/30"
                      placeholder={field.placeholder}
                    />
                  </div>
                )}
                
                {field.description && (
                  <div className="flex items-start p-3 rounded-lg bg-muted/30 border">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 mr-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{field.description}</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={updateMutation.isLoading}
                className="transition-all hover:shadow-md"
              >
                <X className="mr-2 h-4 w-4" />
                {t('common.cancel', "Cancel")}
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateMutation.isLoading}
                className="transition-all hover:shadow-md"
              >
                {updateMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    {t('common.saving', "Saving...")}
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('common.save', "Save")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }
  
  return (
    <div 
      className={cn(
        "cursor-pointer p-2 rounded-lg min-h-[40px] flex items-center group transition-all duration-200",
        "hover:bg-muted/80 border border-transparent hover:border-border",
        "focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary"
      )}
      onClick={handleEdit}
    >
      <div className="flex-1">
        {field.render ? field.render(value) : 
         field.type === 'boolean' ? (
          <div className="flex items-center">
            <span className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-full mr-2",
              value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}>
              {value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </span>
            <span>{value ? 'Yes' : 'No'}</span>
          </div>
         ) : 
         field.type === 'textarea' ? (
          <div className="whitespace-pre-wrap break-words max-h-32 overflow-y-auto p-1 rounded bg-muted/30">
            {String(value || '')}
          </div>
        ) : (
          <div className="truncate">
            {String(value || '')}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-200",
                  "hover:bg-primary hover:text-primary-foreground"
                )}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit {field.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}