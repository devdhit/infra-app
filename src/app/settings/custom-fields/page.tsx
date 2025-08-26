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
  Trash 
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
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
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

const modelTypes = [
  { value: "PC", label: "PC" },
  { value: "Laptop", label: "Laptop" },
  { value: "Printer", label: "Printer" },
  { value: "License", label: "License" },
  { value: "WarehouseIT", label: "Warehouse" },
];

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean" },
  { value: "select", label: "Select" },
];

export default function CustomFieldsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [modelTypeFilter, setModelTypeFilter] = useState("");
  
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
    },
  });
  
  const handleCreate = () => {
    setEditingField(null);
    form.reset({
      name: "",
      type: "text",
      modelType: "PC",
      required: false,
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
    });
    setIsFormOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/custom-fields/${id}`);
      toast.success('Custom field deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete custom field');
    }
  };
  
  const onSubmit = async (values: any) => {
    try {
      if (editingField) {
        await updateMutation.mutateAsync(values);
        toast.success('Custom field updated successfully');
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Custom field created successfully');
      }
      setIsFormOpen(false);
      refetch();
    } catch (error) {
      toast.error('Failed to save custom field');
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
          <p className="text-muted-foreground">Manage tenant-specific custom fields</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Field
        </Button>
      </div>
      
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
                  <TableCell className="font-medium">{field.name}</TableCell>
                  <TableCell>{field.type}</TableCell>
                  <TableCell>{field.modelType}</TableCell>
                  <TableCell>{field.required ? "Yes" : "No"}</TableCell>
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
                      <Input placeholder="Field name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select field type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingField ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}