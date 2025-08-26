'use client'

import { Button } from "@/components/ui/button";
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

interface AssetFormField {
  name: string;
  label: string;
  type: "text" | "number" | "email" | "date" | "textarea" | "select";
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

interface AssetFormProps {
  assetType: string;
  fields: AssetFormField[];
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

// Generate Zod schema based on form fields
const generateSchema = (fields: AssetFormField[]) => {
  const schemaFields: Record<string, any> = {};
  
  fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny = z.string();
    
    if (field.required) {
      fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
    }
    
    if (field.type === "email") {
      fieldSchema = (fieldSchema as z.ZodString).email("Invalid email address");
    }
    
    if (field.type === "number") {
      fieldSchema = z.coerce.number();
    }
    
    schemaFields[field.name] = field.required ? fieldSchema : fieldSchema.optional();
  });
  
  return z.object(schemaFields);
};

export function AssetForm({ assetType, fields, initialData, onSuccess, onCancel }: AssetFormProps) {
  const isEditing = !!initialData;
  const Schema = generateSchema(fields);
  const form = useForm<z.infer<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: initialData || {},
  });
  
  const createMutation = useCreateAsset(assetType);
  const updateMutation = useUpdateAsset(assetType, initialData?.id || "");
  
  const onSubmit = async (values: z.infer<typeof Schema>) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(values);
        toast.success(`${assetType} updated successfully`);
      } else {
        await createMutation.mutateAsync(values);
        toast.success(`${assetType} created successfully`);
      }
      onSuccess();
    } catch (error) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} ${assetType}`);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        value={formField.value as string || ""}
                        onChange={formField.onChange}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
                      />
                    ) : field.type === "select" ? (
                      <Select 
                        onValueChange={formField.onChange} 
                        defaultValue={formField.value as string || ""}
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
                    ) : (
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formField.value as string || ""}
                        onChange={formField.onChange}
                        onBlur={formField.onBlur}
                        name={formField.name}
                        ref={formField.ref}
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
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              "Saving..."
            ) : isEditing ? (
              "Update"
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}