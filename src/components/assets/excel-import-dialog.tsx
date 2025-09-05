'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useTranslation } from "@/hooks/use-translation"
import { api } from "@/lib/api"
import { Loader2, Upload, FileText, AlertCircle, Plus, X } from "lucide-react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCustomFields } from "@/hooks/useApi"
import { getModelType } from "@/lib/custom-fields"

interface ExcelImportDialogProps {
  assetType: string
  title: string
  isOpen: boolean
  onClose: () => void
  onImportSuccess: () => void
}

interface ColumnMapping {
  excelColumn: string
  databaseField: string
}

export function ExcelImportDialog({
  assetType,
  title,
  isOpen,
  onClose,
  onImportSuccess
}: ExcelImportDialogProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean; message: string; createdCount?: number; errors?: string[] } | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [showColumnMapping, setShowColumnMapping] = useState(false)
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [excelColumns, setExcelColumns] = useState<string[]>([])
  const [databaseFields, setDatabaseFields] = useState<string[]>([])
  
  // Fetch custom fields for this asset type
  const modelType = getModelType(assetType)
  const { data: customFieldsData } = useCustomFields(modelType)

  // Get database fields based on asset type
  useEffect(() => {
    if (isOpen) {
      let fields: string[] = []
      switch (assetType) {
        case 'pc':
          fields = ['dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'pcName', 'userName', 'status', 'note']
          break
        case 'laptop':
          fields = ['dept', 'barcode', 'sapBarcode', 'dateBuy', 'userName', 'email', 'model', 'status', 'note']
          break
        case 'printer':
          fields = ['dept', 'location', 'ip', 'model', 'color', 'barcode', 'sapCode', 'date', 'note']
          break
        case 'license':
          fields = ['deviceName', 'userName', 'dept', 'productType', 'productKey', 'model', 'pc', 'mac', 'ip', 'date', 'updateStatus']
          break
        case 'warehouse':
          fields = ['barcode', 'sapCode', 'status', 'note']
          break
        case 'internet':
          fields = ['dept', 'manager', 'userName', 'email', 'ipAddress', 'internetAccess', 'status', 'note']
          break
        default:
          fields = []
      }
      
      // Add custom fields to the database fields list
      if (customFieldsData) {
        const customFieldNames = customFieldsData.map((field: any) => field.name)
        fields = [...fields, ...customFieldNames]
      }
      
      setDatabaseFields(fields)
    }
  }, [assetType, isOpen, customFieldsData])

  // Extract column names from Excel file
  const extractExcelColumns = useCallback(async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      
      // Check if firstSheetName exists before using it as an index
      if (!firstSheetName) {
        throw new Error(t('assets.excel.import.invalidFile', 'Invalid Excel file: No sheets found'));
      }
      
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Check if worksheet exists
      if (!worksheet) {
        throw new Error(t('assets.excel.import.invalidFile', 'Invalid Excel file: Sheet not found'));
      }
      
      // Get the first row (headers)
      const headers: string[] = [];
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      
      // Only process the first row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        if (cell && cell.v) {
          headers.push(String(cell.v));
        }
      }
      
      setExcelColumns(headers);
    } catch (error) {
      console.error('Error extracting Excel columns:', error);
      toast.error(t('assets.excel.import.columnExtractionError', 'Failed to extract columns from Excel file'));
    }
  }, [t])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const fileList = Array.from(files)
      setSelectedFiles(fileList)
      // Extract columns from the first file
      const firstFile = fileList[0];
      if (firstFile) {
        extractExcelColumns(firstFile)
      }
    }
  }

  const handleFileSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleClose = useCallback(() => {
    setSelectedFiles([])
    setImportResult(null)
    setShowColumnMapping(false)
    setColumnMappings([])
    setExcelColumns([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }, [onClose])

  const addColumnMapping = () => {
    setColumnMappings([...columnMappings, { excelColumn: '', databaseField: '' }])
  }

  const removeColumnMapping = (index: number) => {
    const newMappings = [...columnMappings]
    newMappings.splice(index, 1)
    setColumnMappings(newMappings)
  }

  const updateColumnMapping = (index: number, field: keyof ColumnMapping, value: string) => {
    const newMappings = [...columnMappings]
    if (newMappings[index]) {
      newMappings[index][field] = value
      setColumnMappings(newMappings)
    }
  }

  // Function to generate automatic mappings based on column name similarity
  const generateAutomaticMappings = useCallback(() => {
    console.log('generateAutomaticMappings called with:', {
      excelColumns,
      databaseFields
    });
    
    if (excelColumns.length === 0 || databaseFields.length === 0) {
      console.log('Skipping automatic mapping - no data');
      return;
    }
    
    // Generate automatic mappings
    const autoMappings: ColumnMapping[] = [];
    
    // Create a map of database fields to their lowercase versions for comparison
    const dbFieldsLowerMap = new Map<string, string>();
    databaseFields.forEach(field => {
      dbFieldsLowerMap.set(field.toLowerCase().replace(/\s+/g, ''), field);
    });
    
    // Try to match each Excel column to a database field
    excelColumns.forEach(excelColumn => {
      const cleanExcelColumn = excelColumn.toLowerCase().replace(/\s+/g, '');
      let matchedField: string | null = null;
      
      // Direct match
      if (dbFieldsLowerMap.has(cleanExcelColumn)) {
        matchedField = dbFieldsLowerMap.get(cleanExcelColumn) || null;
      } else {
        // Enhanced fuzzy matching logic
        for (const [dbFieldLower, dbField] of dbFieldsLowerMap.entries()) {
          // Check for partial matches in both directions
          if (cleanExcelColumn.includes(dbFieldLower) || dbFieldLower.includes(cleanExcelColumn)) {
            matchedField = dbField;
            break;
          }
          
          // Additional fuzzy matching for common variations
          // Handle cases like "Department" vs "dept"
          if (cleanExcelColumn.startsWith('department') && dbFieldLower === 'dept') {
            matchedField = dbField;
            break;
          }
          if (cleanExcelColumn === 'dept' && dbFieldLower.startsWith('department')) {
            matchedField = dbField;
            break;
          }
          
          // Handle other common abbreviations
          const abbreviations: Record<string, string> = {
            'department': 'dept',
            'user': 'userName',
            'username': 'userName',
            'ip': 'ipAddress',
            'internet': 'internetAccess'
          };
          
          if (abbreviations[cleanExcelColumn] === dbFieldLower || 
              abbreviations[dbFieldLower] === cleanExcelColumn) {
            matchedField = dbField;
            break;
          }
        }
      }
      
      // If we found a match, add it to the mappings
      if (matchedField) {
        autoMappings.push({
          excelColumn: excelColumn,
          databaseField: matchedField
        });
      }
    });
    
    console.log('Generated automatic mappings:', autoMappings);
    
    // Update the mappings state with the auto-generated mappings
    setColumnMappings(autoMappings);
    
    toast.success(t('assets.excel.import.autoMapSuccess', 'Automatic mapping completed'));
  }, [excelColumns, databaseFields, t]);

  // Effect to automatically generate mappings when excelColumns and databaseFields are available
  useEffect(() => {
    // Only auto-generate if we have data and no mappings yet, and the dialog is open
    if (isOpen && excelColumns.length > 0 && databaseFields.length > 0 && columnMappings.length === 0) {
      generateAutomaticMappings();
    }
  }, [isOpen, excelColumns, databaseFields, columnMappings.length, generateAutomaticMappings]);

  // New function to handle just hiding the column mapping without resetting mappings
  const handleToggleColumnMapping = useCallback(() => {
    // If we're about to show the mapping section and there are no mappings yet,
    // automatically generate mappings based on column name similarity
    if (!showColumnMapping && columnMappings.length === 0 && excelColumns.length > 0 && databaseFields.length > 0) {
      generateAutomaticMappings();
    }
    
    setShowColumnMapping(!showColumnMapping);
  }, [showColumnMapping, setShowColumnMapping, columnMappings.length, excelColumns, databaseFields, generateAutomaticMappings]);

  const handleImport = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error(t('assets.excel.import.noFileSelected', 'Please select at least one file to import'));
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      let totalCreatedCount = 0;
      const allErrors: string[] = [];

      // Process each selected file
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('assetType', assetType);

        // Add column mapping if mappings exist (regardless of UI visibility)
        if (columnMappings.length > 0) {
          const mappingObj: Record<string, string> = {};
          columnMappings.forEach(mapping => {
            if (mapping.excelColumn && mapping.databaseField) {
              mappingObj[mapping.excelColumn] = mapping.databaseField;
            }
          });
          formData.append('columnMapping', JSON.stringify(mappingObj));
        }

        const response = await api.post<any>('/assets/excel/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });

        if (response.success) {
          totalCreatedCount += response.createdCount || 0;
          if (response.errors && response.errors.length > 0) {
            allErrors.push(...response.errors.map((error: string) => `${file.name}: ${error}`));
          }
        } else {
          allErrors.push(`${file.name}: ${response.error || t('assets.excel.import.error', 'Failed to import assets')}`);
        }
      }

      setImportResult({
        success: allErrors.length === 0,
        message: t('assets.excel.import.success', '{0} assets imported successfully', totalCreatedCount.toString()),
        createdCount: totalCreatedCount,
        errors: allErrors
      });
      
      if (allErrors.length === 0) {
        toast.success(t('assets.excel.import.success', '{0} assets imported successfully', totalCreatedCount.toString()));
        // Close dialog automatically on success
        setTimeout(() => {
          handleClose();
          onImportSuccess();
        }, 1500);
      } else if (totalCreatedCount > 0) {
        toast.success(t('assets.excel.import.partialSuccess', '{0} assets imported with some errors', totalCreatedCount.toString()));
        // Close dialog automatically on partial success
        setTimeout(() => {
          handleClose();
          onImportSuccess();
        }, 1500);
      } else {
        toast.error(t('assets.excel.import.error', 'Failed to import assets'));
      }
      
      if (allErrors.length === 0 || totalCreatedCount > 0) {
        onImportSuccess();
      }
    } catch (error: any) {
      console.error('Import error:', error);
      const message = error.message || t('assets.excel.import.error', 'Failed to import assets');
      setImportResult({
        success: false,
        message
      });
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  }, [selectedFiles, assetType, t, onImportSuccess, columnMappings, handleClose])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleClose()
      }
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('assets.excel.import.title', 'Import {0}', title)}</DialogTitle>
          <DialogDescription>
            {t('assets.excel.import.description', 'Import {0} data from Excel file(s)', title.toLowerCase())}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid gap-6 py-4 h-full overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">{t('assets.excel.import.data', 'Import Data')}</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="excel-file">
                    {t('assets.excel.import.fileLabel', 'Select Excel File(s)')}
                  </Label>
                  <div className="mt-1 flex gap-2">
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx,.xls"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      multiple // Allow multiple file selection
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFileSelectClick}
                      disabled={isImporting}
                      className="w-full"
                    >
                      {selectedFiles.length > 0 ? (
                        <span className="truncate">
                          {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                        </span>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          {t('assets.excel.import.selectFile', 'Choose File(s)')}
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('assets.excel.import.fileHint', 'Supported formats: .xlsx, .xls')}
                  </p>
                </div>

                {/* Column Mapping Toggle */}
                {selectedFiles.length > 0 && excelColumns.length > 0 && (
                  <div className="flex items-center justify-between">
                    <Label>
                      {t('assets.excel.import.columnMapping', 'Map Excel Columns')}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleToggleColumnMapping}
                    >
                      {showColumnMapping ? t('common.hide', 'Hide') : t('common.show', 'Show')}
                    </Button>
                  </div>
                )}

                {/* Column Mapping UI - This section can scroll if it gets too tall */}
                {showColumnMapping && selectedFiles.length > 0 && excelColumns.length > 0 && (
                  <div className="space-y-3 border rounded-md p-4 max-h-[400px] overflow-y-auto">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">
                        {t('assets.excel.import.columnMappingTitle', 'Column Mapping')}
                      </h4>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateAutomaticMappings}
                        >
                          {t('assets.excel.import.autoMap', 'Auto Map')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addColumnMapping}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          {t('common.add', 'Add')}
                        </Button>
                      </div>
                    </div>
                    
                    {columnMappings.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t('assets.excel.import.noMappings', 'No column mappings configured. Add a mapping to connect Excel columns to database fields.')}
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t('assets.excel.import.excelColumn', 'Excel Column')}</TableHead>
                            <TableHead>{t('assets.excel.import.databaseField', 'Database Field')}</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {columnMappings.map((mapping, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Select
                                  value={mapping.excelColumn}
                                  onValueChange={(value) => updateColumnMapping(index, 'excelColumn', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('assets.excel.import.selectExcelColumn', 'Select Excel Column')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {excelColumns.map((column) => (
                                      <SelectItem key={column} value={column}>
                                        {column}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={mapping.databaseField}
                                  onValueChange={(value) => updateColumnMapping(index, 'databaseField', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('assets.excel.import.selectDatabaseField', 'Select Database Field')} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {databaseFields.map((field) => (
                                      <SelectItem key={field} value={field}>
                                        {field}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeColumnMapping(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    
                    <div className="text-sm text-muted-foreground">
                      <p>{t('assets.excel.import.mappingHelp', 'Map Excel column names to database field names to ensure correct data import.')}</p>
                      <p className="mt-1">{t('assets.excel.import.customFieldsHelp', 'Custom fields for this asset type are also available for mapping.')}</p>
                    </div>
                  </div>
                )}

                {importResult && (
                  <Alert variant={importResult.success ? "default" : "destructive"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      {importResult.success 
                        ? t('assets.excel.import.successTitle', 'Import Successful') 
                        : t('assets.excel.import.errorTitle', 'Import Failed')}
                    </AlertTitle>
                    <AlertDescription>
                      <p>{importResult.message}</p>
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">{t('assets.excel.import.errors', 'Errors:')}</p>
                          <ul className="mt-1 list-disc list-inside space-y-1">
                            {importResult.errors.slice(0, 5).map((error, index) => (
                              <li key={index} className="text-sm">{error}</li>
                            ))}
                            {importResult.errors.length > 5 && (
                              <li className="text-sm">
                                {t('assets.excel.import.moreErrors', 'And {0} more errors', (importResult.errors.length - 5).toString())}
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed footer with import and close buttons */}
        <div className="border-t p-4">
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleImport}
              disabled={isImporting || selectedFiles.length === 0}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('assets.excel.import.importing', 'Importing...')}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t('assets.excel.import.button', 'Import Data')}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} className="w-full">
              {t('common.close', 'Close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}