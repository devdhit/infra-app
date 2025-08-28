'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash,
  Info,
  HelpCircle
} from "lucide-react";
import { 
  useApiQuery, 
  useApiMutation, 
  useApiUpdate, 
  useApiDelete 
} from "@/hooks/useApi";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import apiClient from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";

const modelTypes = [
  { value: "PC", label: "PC" },
  { value: "Laptop", label: "Laptop" },
  { value: "Printer", label: "Printer" },
  { value: "License", label: "License" },
  { value: "WarehouseIT", label: "Warehouse" },
];

const fieldTypes = [
  { value: "text", label: "Text", description: "Single line of text" },
  { value: "textarea", label: "Text Area", description: "Multi-line text" },
  { value: "number", label: "Number", description: "Numeric values" },
  { value: "date", label: "Date", description: "Date values" },
  { value: "boolean", label: "Boolean", description: "True/False values" },
  { value: "select", label: "Select", description: "Dropdown selection" },
];

export default function CustomFieldsPage() {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [modelTypeFilter, setModelTypeFilter] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  
  const { data: customFields, refetch } = useApiQuery<any>(
    ['custom-fields', modelTypeFilter], 
    `/custom-fields${modelTypeFilter ? `?modelType=${modelTypeFilter}` : ''}`
  );
  
  const createMutation = useApiMutation('/custom-fields');
  const updateMutation = useApiUpdate(`/custom-fields/${editingField?.id}`);
  const deleteMutation = useApiDelete(`/custom-fields/${editingField?.id}`);
  
  const form = useForm({
    defaultValues: {
      name: "",
      type: "text",
      modelType: "PC",
      required: false,
      description: "",
    },
  });
  
  const handleCreate = () => {
    setEditingField(null);
    form.reset({
      name: "",
      type: "text",
      modelType: "PC",
      required: false,
      description: "",
    });
    setIsFormOpen(true);
  };
  
  const handleEdit = (field: any) => {
    setEditingField(field);
    form.reset({
      name: field.name,
      type: field.type,
      modelType: field.modelType,
      required: field.required,
      description: field.description || "",
    });
    setIsFormOpen(true);
  };
  
  const onSubmit = async (values: any) => {
    try {
      if (editingField) {
        await updateMutation.mutateAsync(values);
        toast.success('Custom field updated successfully');
        // Invalidate asset queries to refresh asset lists with updated custom fields
        // Map modelType to assetType for query invalidation
        const assetTypeMap: Record<string, string> = {
          PC: "pc",
          Laptop: "laptop",
          Printer: "printer",
          License: "license",
          WarehouseIT: "warehouse"
        };
        
        const assetType = assetTypeMap[values.modelType] || values.modelType.toLowerCase();
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
        queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Custom field created successfully');
        // Invalidate asset queries to refresh asset lists with new custom fields
        // Map modelType to assetType for query invalidation
        const assetTypeMap: Record<string, string> = {
          PC: "pc",
          Laptop: "laptop",
          Printer: "printer",
          License: "license",
          WarehouseIT: "warehouse"
        };
        
        const assetType = assetTypeMap[values.modelType] || values.modelType.toLowerCase();
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
        queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      }
      setIsFormOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save custom field');
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      // Get the field to know which model type to invalidate
      const fieldToDelete = customFields?.find((field: any) => field.id === id);
      
      await apiClient.delete(`/custom-fields/${id}`);
      toast.success('Custom field deleted successfully');
      refetch();
      
      // Invalidate asset queries to refresh asset lists after custom field deletion
      if (fieldToDelete) {
        // Map modelType to assetType for query invalidation
        const assetTypeMap: Record<string, string> = {
          PC: "pc",
          Laptop: "laptop",
          Printer: "printer",
          License: "license",
          WarehouseIT: "warehouse"
        };
        
        const assetType = assetTypeMap[fieldToDelete.modelType] || fieldToDelete.modelType.toLowerCase();
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
        queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete custom field');
    }
  };
  
  const filteredFields = modelTypeFilter
    ? customFields?.filter((field: any) => field.modelType === modelTypeFilter)
    : customFields || [];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Custom Fields</h1>
          <p className="text-muted-foreground">Manage tenant-specific custom fields for different asset types</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHelp(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Field
          </Button>
        </div>
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Custom Fields</AlertTitle>
        <AlertDescription>
          Custom fields allow you to add additional properties to your assets. 
          They will appear in asset forms and can be used for filtering and reporting.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Custom Fields</CardTitle>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Model Type: {modelTypeFilter || "All"} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setModelTypeFilter("")}>
                    All Models
                  </DropdownMenuItem>
                  {modelTypes.map((model) => (
                    <DropdownMenuItem 
                      key={model.value} 
                      onSelect={() => setModelTypeFilter(model.value)}
                    >
                      {model.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <CardDescription>
            Create custom fields for different asset types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model Type</TableHead>
                <TableHead>Required</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFields.map((field: any) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">
                    <div>{field.name}</div>
                    {field.description && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {field.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{field.type}</Badge>
                  </TableCell>
                  <TableCell>{field.modelType}</TableCell>
                  <TableCell>
                    {field.required ? (
                      <Badge variant="default">Required</Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(field)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(field.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredFields.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No custom fields found</p>
              <Button variant="link" onClick={handleCreate} className="mt-2">
                Create your first custom field
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? "Edit Custom Field" : "Add Custom Field"}
            </DialogTitle>
            <DialogDescription>
              {editingField 
                ? "Modify the properties of this custom field" 
                : "Create a new custom field for your assets"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Field name (e.g., warranty_date)" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Must start with a letter or underscore and contain only letters, numbers, and underscores
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this field is used for..." 
                        {...field} 
                        className="resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description to help users understand the purpose of this field
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Type
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="ml-2 h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select the type of data this field will hold</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <span>{type.label}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {type.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="modelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modelTypes.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Required</FormLabel>
                      <FormDescription>
                        If checked, this field must be filled when creating or updating assets
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      Saving...
                    </div>
                  ) : (
                    editingField ? "Update" : "Create"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Custom Fields Help</DialogTitle>
            <DialogDescription>
              Learn how to use custom fields effectively
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">What are Custom Fields?</h3>
              <p className="text-muted-foreground mt-1">
                Custom fields allow you to add additional properties to your assets beyond the standard fields. 
                They can be used to track specific information relevant to your organization.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Field Types</h3>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li><strong>Text</strong> - Single line of text for short descriptions</li>
                <li><strong>Text Area</strong> - Multi-line text for longer descriptions</li>
                <li><strong>Number</strong> - Numeric values for quantities, costs, etc.</li>
                <li><strong>Date</strong> - Date values for warranties, purchase dates, etc.</li>
                <li><strong>Boolean</strong> - True/False values for yes/no questions</li>
                <li><strong>Select</strong> - Dropdown selection for predefined options</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Best Practices</h3>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li>Use descriptive field names that clearly indicate their purpose</li>
                <li>Choose the appropriate field type for your data</li>
                <li>Mark fields as required only when necessary</li>
                <li>Group related custom fields by model type</li>
                <li>Regularly review and clean up unused custom fields</li>
                <li>Add descriptions to help other users understand the purpose of each field</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">Usage</h3>
              <p className="text-muted-foreground mt-1">
                Once created, custom fields will automatically appear in the asset forms for their respective model types. 
                They can be used for filtering, reporting, and displaying additional information about your assets.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowHelp(false)}>Got it</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}