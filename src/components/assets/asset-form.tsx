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
  useUpdateAsset 
} from "@/hooks/useApi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";
import { Asset, AssetFormField } from "@/types/assets";
import { useEffect } from "react";

interface AssetFormProps {
  assetType: string;
  title: string;
  fields: AssetFormField[];
  initialData?: Asset;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Generate Zod schema based on form fields
const generateSchema = (fields: AssetFormField[]) => {
  const schemaFields: Record<string, any> = {};
  
  fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny = z.string().or(z.number()).or(z.date()).or(z.boolean()).nullable();
    
    if (field.required) {
      fieldSchema = fieldSchema.refine(val => val !== null && val !== undefined && val !== "", {
        message: `${field.label} is required`
      });
    }
    
    if (field.type === "email") {
      fieldSchema = z.string().email("Invalid email address").or(z.number()).or(z.date()).or(z.boolean()).nullable();
    }
    
    if (field.type === "number") {
      fieldSchema = z.coerce.number().nullable();
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
  
  // Generate schema dynamically based on fields
  const Schema = generateSchema(fields);
  
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
          // Handle date fields
          if (key.toLowerCase().includes('date') && value) {
            acc[key] = new Date(value).toISOString().split('T')[0];
          } else {
            acc[key] = value === null ? undefined : value;
          }
          return acc;
        }, {} as Record<string, any>);
        
        form.reset(formattedData);
      } else {
        // If creating, reset to empty form
        form.reset({});
      }
    }
  }, [form, initialData, isEditing, isOpen]);
  
  const createMutation = useCreateAsset(assetType);
  const updateMutation = useUpdateAsset(assetType, initialData?.id || "");
  
  const onSubmit = async (values: z.infer<typeof Schema>) => {
    try {
      // Process values before sending to API
      const processedValues = Object.entries(values).reduce((acc, [key, value]) => {
        // Handle date fields
        if (key.toLowerCase().includes('date') && value) {
          acc[key] = new Date(value as string).toISOString();
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);
      
      if (isEditing) {
        await updateMutation.mutateAsync({
          ...processedValues,
          id: initialData?.id // Ensure ID is included for updates
        });
        toast.success(t('assets.update.success', title) || `${title} updated successfully`);
      } else {
        await createMutation.mutateAsync(processedValues);
        toast.success(t('assets.create.success', title) || `${title} created successfully`);
      }
      form.reset();
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(t('assets.form.error', isEditing ? 'update' : 'create', title, error.message) || 
        `Failed to ${isEditing ? 'update' : 'create'} ${title}: ${error.message}`);
    }
  };
  
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
              ? t('assets.form.edit.title', title) || `Edit ${title}` 
              : t('assets.form.create.title', title) || `Create ${title}`}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? t('assets.form.edit.description', title) || `Edit the details for this ${title.toLowerCase()}.` 
              : t('assets.form.create.description', title) || `Add a new ${title.toLowerCase()} to your inventory.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {fields.map((field) => (
                <FormField
                  key={field.name}
                  control={form.control}
                  name={field.name}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                      <FormControl>
                        {field.type === "textarea" ? (
                          <Textarea 
                            placeholder={field.placeholder}
                            {...formField}
                            value={formField.value as string || ""}
                          />
                        ) : field.type === "select" ? (
                          <Select 
                            onValueChange={formField.onChange} 
                            defaultValue={formField.value as string || ""}
                            value={formField.value as string || ""}
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
                          />
                        ) : (
                          <Input
                            type={field.type}
                            placeholder={field.placeholder}
                            {...formField}
                            value={formField.value as string || ""}
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
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? t('common.saving') || "Saving..." 
                  : isEditing 
                    ? t('common.update') || "Update" 
                    : t('common.create') || "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}