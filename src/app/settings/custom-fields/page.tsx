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
  useApiUpdate
} from "@/hooks/useApi";
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
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
import { CustomField, CustomFieldFormData, ModelTypeOption, FieldTypeOption } from "@/types/custom-fields";
import { CustomFieldsSkeleton } from "@/components/settings/custom-fields-skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { SettingsLayout } from "@/components/settings/settings-layout";

const modelTypes: ModelTypeOption[] = [
  { value: "PC", label: "PC" },
  { value: "Laptop", label: "Laptop" },
  { value: "Printer", label: "Printer" },
  { value: "License", label: "License" },
  { value: "WarehouseIT", label: "Warehouse" },
];

const fieldTypes: FieldTypeOption[] = [
  { value: "text", label: "Text", description: "Single line of text" },
  { value: "textarea", label: "Text Area", description: "Multi-line text" },
  { value: "number", label: "Number", description: "Numeric values" },
  { value: "date", label: "Date", description: "Date values" },
  { value: "boolean", label: "Boolean", description: "True/False values" },
  { value: "select", label: "Select", description: "Dropdown selection" },
];

// Map modelType to assetType for query invalidation
const assetTypeMap: Record<string, string> = {
  PC: "pc",
  Laptop: "laptop",
  Printer: "printer",
  License: "license",
  WarehouseIT: "warehouse"
};

export default function CustomFieldsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [modelTypeFilter, setModelTypeFilter] = useState<string>("");
  const [showHelp, setShowHelp] = useState(false);
  
  const { data: customFields, isLoading, error, refetch } = useApiQuery<CustomField[]>(
    ['custom-fields', modelTypeFilter], 
    `/custom-fields${modelTypeFilter ? `?modelType=${modelTypeFilter}` : ''}`
  );
  
  const createMutation = useApiMutation<CustomField, CustomFieldFormData>('/custom-fields');
  const updateMutation = useApiUpdate<CustomField, CustomFieldFormData>(`/custom-fields/${editingField?.id}`);
  
  const form = useForm<CustomFieldFormData>({
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
  
  const handleEdit = (field: CustomField) => {
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
  
  const onSubmit = async (values: CustomFieldFormData) => {
    try {
      if (editingField) {
        await updateMutation.mutateAsync(values);
        toast.success('Custom field updated successfully');
        // Invalidate asset queries to refresh asset lists with updated custom fields
        const assetType = assetTypeMap[values.modelType] || values.modelType.toLowerCase();
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
        queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Custom field created successfully');
        // Invalidate asset queries to refresh asset lists with new custom fields
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
      const fieldToDelete = customFields?.find((field) => field.id === id);
      
      await apiClient.delete(`/custom-fields/${id}`);
      toast.success('Custom field deleted successfully');
      refetch();
      
      // Invalidate asset queries to refresh asset lists after custom field deletion
      if (fieldToDelete) {
        const assetType = assetTypeMap[fieldToDelete.modelType] || fieldToDelete.modelType.toLowerCase();
        queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
        queryClient.invalidateQueries({ queryKey: ['custom-fields'] });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete custom field');
    }
  };
  
  const filteredFields: CustomField[] = modelTypeFilter
    ? customFields?.filter((field) => field.modelType === modelTypeFilter) || []
    : customFields || [];
  
  if (isLoading) {
    return <CustomFieldsSkeleton />;
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-500">{t('common.error')}</h2>
          <p className="text-muted-foreground">{t('settings.customFields.errorLoading')}</p>
          <Button onClick={() => refetch()} className="mt-4">
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <SettingsLayout
      title={t('settings.customFields.title')}
      description={t('settings.customFields.description')}
      currentPage={t('settings.customFields.title')}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowHelp(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            {t('common.help')}
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t('settings.customFields.add')}
          </Button>
        </div>
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t('settings.customFields.infoTitle')}</AlertTitle>
        <AlertDescription>
          {t('settings.customFields.infoDescription')}
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>{t('settings.customFields.title')}</CardTitle>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {t('settings.customFields.modelType')}: {modelTypeFilter || t('settings.customFields.allModels')} <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onSelect={() => setModelTypeFilter("")}>
                    {t('settings.customFields.allModels')}
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
            {t('settings.customFields.createDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings.customFields.name')}</TableHead>
                <TableHead>{t('settings.customFields.type')}</TableHead>
                <TableHead>{t('settings.customFields.modelType')}</TableHead>
                <TableHead>{t('settings.customFields.required')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFields.map((field) => (
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
                      <Badge variant="default">{t('common.required')}</Badge>
                    ) : (
                      <Badge variant="outline">{t('common.optional')}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">{t('common.openMenu')}</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(field)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(field.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          {t('common.delete')}
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
              <p className="text-muted-foreground">{t('settings.customFields.noFields')}</p>
              <Button variant="link" onClick={handleCreate} className="mt-2">
                {t('settings.customFields.createFirst')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingField ? t('settings.customFields.edit') : t('settings.customFields.add')}
            </DialogTitle>
            <DialogDescription>
              {editingField 
                ? t('settings.customFields.editDescription') 
                : t('settings.customFields.createDescription')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('settings.customFields.name')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('settings.customFields.namePlaceholder')} 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {t('settings.customFields.nameDescription')}
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
                    <FormLabel>{t('settings.customFields.description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('settings.customFields.descriptionPlaceholder')} 
                        {...field} 
                        className="resize-none"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('settings.customFields.descriptionHelp')}
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
                      {t('settings.customFields.type')}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="ml-2 h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('settings.customFields.typeHelp')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.customFields.selectType')} />
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
                    <FormLabel>{t('settings.customFields.modelType')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('settings.customFields.selectModel')} />
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
                      <FormLabel>{t('settings.customFields.required')}</FormLabel>
                      <FormDescription>
                        {t('settings.customFields.requiredHelp')}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <div className="flex items-center">
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      {t('common.saving')}
                    </div>
                  ) : (
                    editingField ? t('common.update') : t('common.create')
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
            <DialogTitle>{t('settings.customFields.helpTitle')}</DialogTitle>
            <DialogDescription>
              {t('settings.customFields.helpDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">{t('settings.customFields.whatAre')}</h3>
              <p className="text-muted-foreground mt-1">
                {t('settings.customFields.whatAreDescription')}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">{t('settings.customFields.fieldTypes')}</h3>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li><strong>{t('settings.customFields.text')}</strong> - {t('settings.customFields.textDescription')}</li>
                <li><strong>{t('settings.customFields.textArea')}</strong> - {t('settings.customFields.textAreaDescription')}</li>
                <li><strong>{t('settings.customFields.number')}</strong> - {t('settings.customFields.numberDescription')}</li>
                <li><strong>{t('settings.customFields.date')}</strong> - {t('settings.customFields.dateDescription')}</li>
                <li><strong>{t('settings.customFields.boolean')}</strong> - {t('settings.customFields.booleanDescription')}</li>
                <li><strong>{t('settings.customFields.select')}</strong> - {t('settings.customFields.selectDescription')}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">{t('settings.customFields.bestPractices')}</h3>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li>{t('settings.customFields.practice1')}</li>
                <li>{t('settings.customFields.practice2')}</li>
                <li>{t('settings.customFields.practice3')}</li>
                <li>{t('settings.customFields.practice4')}</li>
                <li>{t('settings.customFields.practice5')}</li>
                <li>{t('settings.customFields.practice6')}</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-lg">{t('settings.customFields.usage')}</h3>
              <p className="text-muted-foreground mt-1">
                {t('settings.customFields.usageDescription')}
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowHelp(false)}>{t('common.gotIt')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  );
}