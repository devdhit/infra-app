'use client'

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useCreateAsset, 
  useUpdateAsset,
  useCustomFields
} from "@/hooks/useApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Asset, AssetFormField } from "@/types/assets";
import { useEffect, useMemo } from "react";
import { ApiError, ValidationError } from "@/lib/api";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AssetFormSkeleton } from "./asset-form-skeleton";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getModelType } from "@/lib/custom-fields";

interface AssetFormProps {
  assetType: string;
  title: string;
  fields: AssetFormField[];
  initialData?: Asset;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Generate Zod schema based on all form fields
const generateSchema = (allFields: AssetFormField[]) => {
  const schemaFields: Record<string, any> = {};
  
  // Add all fields
  allFields.forEach(field => {
    // Create base schema based on field type
    let fieldSchema: z.ZodTypeAny;
    
    switch (field.type) {
      case "boolean":
        fieldSchema = z.boolean().nullable();
        break;
        
      case "email":
        fieldSchema = z.string().email("Please enter a valid email address").or(z.literal("")).nullable();
        break;
        
      case "number":
        fieldSchema = z.union([
          z.number(), 
          z.string().regex(/^-?\d+\.?\d*$/, "Please enter a valid number").or(z.literal(""))
        ]).nullable();
        break;
        
      case "url":
        fieldSchema = z.string().url("Please enter a valid URL").or(z.literal("")).nullable();
        break;
        
      case "date":
        fieldSchema = z.string().refine(val => {
          if (!val) return true; // Allow empty values for optional date fields
          const date = new Date(val);
          return date.toString() !== 'Invalid Date';
        }, {
          message: "Please enter a valid date"
        }).or(z.literal("")).nullable();
        break;
        
      case "text":
      case "textarea":
        fieldSchema = z.string().nullable();
        
        // Add length validation for text fields
        if (field.minLength) {
          fieldSchema = fieldSchema.refine(
            val => !val || (typeof val === 'string' && val.length >= field.minLength!),
            {
              message: `Must be at least ${field.minLength} characters`
            }
          );
        }
        if (field.maxLength) {
          fieldSchema = fieldSchema.refine(
            val => !val || (typeof val === 'string' && val.length <= field.maxLength!),
            {
              message: `Must be no more than ${field.maxLength} characters`
            }
          );
        }
        // Add pattern validation
        if (field.pattern) {
          const regex = new RegExp(field.pattern);
          fieldSchema = fieldSchema.refine(
            val => !val || (typeof val === 'string' && regex.test(val)),
            {
              message: field.patternMessage || "Invalid format"
            }
          );
        }
        break;
        
      case "select":
        fieldSchema = z.string().nullable();
        break;
        
      default:
        fieldSchema = z.string().nullable();
        break;
    }
    
    // Required field validation
    if (field.required) {
      if (field.type === "number") {
        fieldSchema = fieldSchema.refine(val => {
          // For number fields, check if it's not null/undefined/empty
          return val !== null && val !== undefined && val !== "";
        }, {
          message: `${field.label} is required`
        });
      } else {
        fieldSchema = fieldSchema.refine(val => {
          // For other fields, check if it's not null/undefined/empty
          return val !== null && val !== undefined && val !== "";
        }, {
          message: `${field.label} is required`
        });
      }
    }
    
    // Number-specific validations
    if (field.type === "number" && (field.min !== undefined || field.max !== undefined)) {
      fieldSchema = fieldSchema.refine(
        val => {
          if (val === null || val === undefined || val === "") return true;
          const numVal = typeof val === 'string' ? parseFloat(val) : (typeof val === 'number' ? val : NaN);
          if (typeof numVal !== 'number' || isNaN(numVal)) return true;
          return (field.min === undefined || numVal >= field.min) && 
                 (field.max === undefined || numVal <= field.max);
        },
        {
          message: `Value must be between ${field.min} and ${field.max}`
        }
      );
    }
    
    schemaFields[field.name] = field.required ? fieldSchema : fieldSchema.optional();
  });
  
  return z.object(schemaFields);
};

export function AssetFormDialog({ 
  assetType, 
  title,
  fields, 
  initialData, 
  isOpen,
  onClose,
  onSuccess 
}: AssetFormProps) {
  const { t } = useTranslation();
  const isEditing = !!initialData;
  const router = useRouter();
  
  // Map assetType to modelType for custom fields
  const modelType = getModelType(assetType);
  
  // Fetch custom fields for this asset type
  const { data: customFieldsData, refetch: refetchCustomFields } = useCustomFields(modelType);
  const customFields: AssetFormField[] = customFieldsData?.map((cf: any) => ({
    name: cf.name,
    label: cf.name,
    type: cf.type as any,
    required: cf.required,
    isCustomField: true // Mark as custom field
  })) || [];
  
  // Refetch custom fields when the dialog opens or when assetType changes
  useEffect(() => {
    if (isOpen) {
      refetchCustomFields();
    }
  }, [isOpen, assetType, refetchCustomFields]);
  
  // Combine standard fields with custom fields, removing duplicates
  const allFields = useMemo(() => {
    // Create a Set of standard field names for quick lookup
    const standardFieldNames = new Set(fields.map(f => f.name));
    
    // Filter out custom fields that have the same name as standard fields
    const uniqueCustomFields = customFields.filter(cf => !standardFieldNames.has(cf.name));
    
    // Combine standard fields with unique custom fields
    return [...fields, ...uniqueCustomFields];
  }, [fields, customFields]);
  
  // Generate schema dynamically based on all fields
  const Schema = useMemo(() => generateSchema(allFields), [allFields]);
  
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {},
  });
  
  // Reset form values when initialData changes (e.g., when editing a different asset)
  useEffect(() => {
    if (isOpen) {
      // If editing, reset form with initialData
      if (isEditing && initialData) {
        // Convert any null values to empty strings or undefined to avoid controlled/uncontrolled component warnings
        const formattedData = Object.entries(initialData).reduce((acc, [key, value]) => {
          // Handle date fields - convert ISO string to YYYY-MM-DD format for input[type="date"]
          if (key.toLowerCase().includes('date') && value) {
            try {
              // Ensure we're working with a valid date string
              const dateValue = new Date(value);
              if (!isNaN(dateValue.getTime())) {
                // Format as YYYY-MM-DD for input[type="date"]
                acc[key] = dateValue.toISOString().split('T')[0];
              } else {
                acc[key] = "";
              }
            } catch (e) {
              acc[key] = "";
            }
          } else {
            acc[key] = value === null ? undefined : value;
          }
          return acc;
        }, {} as Record<string, any>);
        
        // Handle custom fields separately
        if (initialData.customFields) {
          // Add custom fields to the form data
          Object.entries(initialData.customFields).forEach(([key, value]) => {
            // Format date values if needed
            if (typeof value === 'string' && value && key.toLowerCase().includes('date')) {
              try {
                const dateValue = new Date(value);
                if (!isNaN(dateValue.getTime())) {
                  formattedData[key] = dateValue.toISOString().split('T')[0];
                } else {
                  formattedData[key] = value;
                }
              } catch (e) {
                formattedData[key] = value;
              }
            } else {
              formattedData[key] = value === null ? undefined : value;
            }
          });
        }
        
        form.reset(formattedData);
      } else {
        // If creating, reset to empty form
        form.reset({});
      }
    }
  }, [form, initialData, isEditing, isOpen]);
  
  const createMutation = useCreateAsset<Asset, z.infer<typeof Schema>>(assetType);
  const updateMutation = useUpdateAsset<Asset, Partial<z.infer<typeof Schema>>>(assetType, initialData?.id || "");
  
  const onSubmit = async (values: z.infer<typeof Schema>) => {
    try {
      // Process values before sending to API
      const processedValues: Record<string, any> = { customFields: {} };
      
      // Get the standard field names from the initial fields prop
      const standardFieldNames = fields.map(f => f.name);
      
      // Process each field, separating standard fields from custom fields
      Object.entries(values).forEach(([key, value]) => {
        // Skip ID field
        if (key === 'id') return;
        
        // Determine if this is a standard field or custom field
        const isStandardField = standardFieldNames.includes(key);
        
        // Process the value
        let processedValue = value;
        
        // Handle date fields
        if (key.toLowerCase().includes('date') && value) {
          try {
            const dateValue = new Date(value as string);
            if (dateValue.toString() !== 'Invalid Date') {
              // Convert to ISO string for API
              processedValue = dateValue.toISOString();
            } else {
              // If invalid date, set to null
              processedValue = null;
            }
          } catch (e) {
            // If any error occurs, set to null
            processedValue = null;
          }
        } else {
          // Convert empty strings to null for optional fields
          processedValue = value === "" || value === undefined ? null : value;
        }
        
        // Store the value in the appropriate place
        if (isStandardField) {
          processedValues[key] = processedValue;
        } else {
          // For custom fields, add to the customFields object
          processedValues.customFields[key] = processedValue;
        }
      });
      
      // If there are no custom fields, delete the empty customFields object
      if (Object.keys(processedValues.customFields).length === 0) {
        delete processedValues.customFields;
      } else if (initialData?.customFields) {
        // If editing, merge with existing custom fields to preserve ones that weren't in the form
        processedValues.customFields = {
          ...initialData.customFields,
          ...processedValues.customFields
        };
      }
      
      if (isEditing) {
        await updateMutation.mutateAsync(processedValues);
        toast.success(t('assets.update.success', `{0} updated successfully`, title));
      } else {
        await createMutation.mutateAsync(processedValues as z.infer<typeof Schema>);
        toast.success(t('assets.create.success', `{0} created successfully`, title));
      }
      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Form submission error:", error);
      
      // Handle validation errors specifically
      if (error instanceof ValidationError) {
        // Set field-specific errors
        Object.entries(error.validationErrors).forEach(([field, message]) => {
          form.setError(field as any, {
            type: "manual",
            message: message
          });
        });
        toast.error(t('forms.validationError', "Please check the form for errors"));
      } else {
        // Handle other API errors
        const apiError = error as ApiError;
        let message = t('assets.form.error', `Failed to {0} {1}`, isEditing ? 'update' : 'create', title);
        
        if (apiError.message) {
          message = apiError.message;
        }
        
        toast.error(message);
      }
    }
  };
  
  // Handle form errors
  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    // Provide more specific error feedback
    const errorCount = Object.keys(errors).length;
    const message = errorCount === 1 
      ? t('forms.singleFieldError', "There is an error in the form. Please check the field marked in red.")
      : t('forms.multipleFieldError', "There are {0} errors in the form. Please check the fields marked in red.", errorCount.toString());
    toast.error(message);
  };
  
  // Show submission state
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  
  // Show skeleton while loading initial data for editing
  if (isEditing && !initialData && isOpen) {
    return <AssetFormSkeleton title={title} fieldCount={allFields.length} />;
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? t('assets.form.edit.title', `Edit {0}`, title) 
              : t('assets.form.create.title', `Create {0}`, title)}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? t('assets.form.edit.description', `Edit the details for this {0}.`, title.toLowerCase()) 
              : t('assets.form.create.description', `Add a new {0} to your inventory.`, title.toLowerCase())}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
            {/* Show general error message if needed */}
            {(createMutation.isError || updateMutation.isError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('common.error', "Error")}</AlertTitle>
                <AlertDescription>
                  {t('assets.form.submitError', "There was an error submitting the form. Please check the details and try again.")}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {allFields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </FormLabel>
                        {field.isCustomField && (
                          <Badge variant="secondary" className="h-5 text-xs">
                            {t('assets.form.customField', "Custom Field")}
                          </Badge>
                        )}
                      </div>
                      <FormControl>
                        {field.type === "textarea" ? (
                          <Textarea 
                            placeholder={field.placeholder}
                            {...formField}
                            value={formField.value as string || ""}
                            disabled={isSubmitting}
                          />
                        ) : field.type === "select" ? (
                          <Select 
                            onValueChange={formField.onChange} 
                            defaultValue={formField.value as string || ""}
                            value={formField.value as string || ""}
                            disabled={isSubmitting}
                          >
                            <SelectTrigger>
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
                        ) : field.type === "date" ? (
                          <Input
                            type="date"
                            placeholder={field.placeholder}
                            {...formField}
                            value={formField.value ? (
                              typeof formField.value === 'string' ? 
                                formField.value : 
                                new Date(formField.value as Date).toISOString().split('T')[0]
                            ) : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Validate date before setting
                              if (value && !isNaN(Date.parse(value))) {
                                formField.onChange(value);
                              } else if (!value) {
                                formField.onChange("");
                              }
                            }}
                            disabled={isSubmitting}
                          />
                        ) : field.type === "number" ? (
                          <Input
                            type="number"
                            placeholder={field.placeholder}
                            {...formField}
                            value={formField.value === null || formField.value === undefined ? "" : String(formField.value)}
                            onChange={(e) => {
                              const value = e.target.value;
                              formField.onChange(value === "" ? null : Number(value));
                            }}
                            disabled={isSubmitting}
                          />
                        ) : field.type === "boolean" ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formField.value as boolean || false}
                              onChange={(e) => formField.onChange(e.target.checked)}
                              disabled={isSubmitting}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-muted-foreground">
                              {field.placeholder || "Check to enable"}
                            </span>
                          </div>
                        ) : (
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            {...formField}
                            value={formField.value as string || ""}
                            disabled={isSubmitting}
                          />
                        )}
                      </FormControl>
                      {field.description && (
                        <FormDescription>{field.description}</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t('common.cancel', "Cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    {t('common.saving', "Saving...")}
                  </div>
                ) : (
                  isEditing 
                    ? t('common.update', "Update") 
                    : t('common.create', "Create")
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}