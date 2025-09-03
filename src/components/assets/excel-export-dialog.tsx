'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useTranslation } from "@/hooks/use-translation"
import apiClient from "@/lib/api"
import { Loader2, Download } from "lucide-react"
import { useState, useCallback, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { AxiosRequestConfig } from 'axios'
import JSZip from 'jszip'

interface ExcelExportDialogProps {
  assetType: string
  title: string
  isOpen: boolean
  onClose: () => void
  selectedAssetIds?: string[]
  // Remove departments prop since we'll fetch from database
}

// Define the export options type
type ExportOption = 'all' | 'selected' | 'allDepts' | 'eachDept'

export function ExcelExportDialog({
  assetType,
  title,
  isOpen,
  onClose,
  selectedAssetIds = []
}: ExcelExportDialogProps) {
  const { t } = useTranslation()
  const [isExporting, setIsExporting] = useState<boolean>(false)
  const [exportStatus, setExportStatus] = useState<string>('') // Add status messages
  const [exportProgress, setExportProgress] = useState<number>(0) // For progress indication
  const [exportOption, setExportOption] = useState<ExportOption>('all')
  const [department, setDepartment] = useState<string>('')
  const [departments, setDepartments] = useState<string[]>([]) // State for fetched departments
  const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false)

  // WarehouseIT assets don't have department fields, so we disable the byDept option for them
  const showByDeptOption = assetType !== 'warehouse'

  // Fetch departments from the database when the dialog opens and assetType supports departments
  const fetchDepartments = useCallback(async () => {
    setLoadingDepartments(true)
    try {
      const response = await apiClient.get(`/assets/departments?assetType=${assetType}`)
      setDepartments(response.data.departments || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error(t('assets.excel.export.deptFetchError', 'Failed to fetch departments from database'))
      setDepartments([])
    } finally {
      setLoadingDepartments(false)
    }
  }, [assetType, t]) // Removed apiClient from dependencies

  useEffect(() => {
    if (isOpen && showByDeptOption) {
      fetchDepartments()
    }
  }, [isOpen, showByDeptOption, fetchDepartments])

  // Add reset function for when there's an error
  const resetExport = useCallback(() => {
    setIsExporting(false)
    setExportStatus('')
    setExportProgress(0)
  }, [])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    setExportStatus(t('assets.excel.export.starting', 'Starting export...'))
    setExportProgress(10)
    
    // Set a longer timeout for API calls - 5 minutes
    const exportTimeout = 300000
    
    try {
      if ((exportOption === 'eachDept' || exportOption === 'allDepts') && showByDeptOption) {
        // Export each department to separate files
        // For allDepts, export all departments
        // For eachDept, check if a specific department is selected
        let departmentsToExport = departments
        if (exportOption === 'eachDept' && department) {
          // If a specific department is selected for eachDept, only export that one
          departmentsToExport = [department]
        } else if (departments.length === 0) {
          toast.error(t('assets.excel.export.noDepartments', 'No departments found in database'))
          resetExport()
          return
        }

        setExportStatus(t('assets.excel.export.preparingDepts', 'Preparing departmental exports...'))
        setExportProgress(20)

        // For allDepts, create a ZIP file containing all department exports
        if (exportOption === 'allDepts') {
          setExportStatus(t('assets.excel.export.preparingZip', 'Preparing ZIP file with all departments...'))
          
          // Create a new ZIP file
          const zip = new JSZip()
          
          // Export each department and add to ZIP
          let completedDepts = 0
          const totalDepts = departmentsToExport.length
          
          for (const dept of departmentsToExport) {
            try {
              setExportStatus(t('assets.excel.export.processingDept', 'Processing department: {0}', dept))
            
              // Calculate progress percentage based on completed departments
              const deptProgress = 20 + Math.floor((completedDepts / totalDepts) * 70)
              setExportProgress(deptProgress)
            
              // Build URL with query parameters
              const params = new URLSearchParams({
                assetType,
                dept
              })
            
              // Fix the URL - remove the extra /api prefix since apiClient includes the base URL
              const url = `/assets/excel/export?${params.toString()}`
            
              // Use apiClient with timeout and proper authentication
              const config: AxiosRequestConfig = {
                responseType: 'blob',
                timeout: exportTimeout,
                headers: {
                  'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'Cache-Control': 'no-store, no-cache'
                }
              }

              console.log(`Fetching from URL: ${url} with timeout ${exportTimeout}ms`)
              // Log the absolute URL for debugging
              console.log('Absolute URL:', window.location.origin + url)
            
              const response = await apiClient.get(url, config)
            
              // Check if the response is empty or invalid
              if (response.data.size === 0) {
                throw new Error(t('assets.excel.export.emptyResponse', 'Server returned an empty response'))
              }
            
              // Add file to ZIP
              zip.file(`${assetType}-${dept}-export.xlsx`, response.data)
            
              completedDepts++
            } catch (deptError: any) {
              console.error(`Export error for department ${dept}:`, deptError)
            
              // Handle different types of errors
              let errorMessage = ''
              if (deptError.code === 'ECONNABORTED') {
                errorMessage = t('assets.excel.export.deptTimeout', 'Export timed out for department {0}', dept)
              } else if (deptError.response?.status === 401) {
                errorMessage = t('assets.excel.export.unauthorized', 'Unauthorized access. Please log in again.')
                // Redirect to login page
                if (typeof window !== 'undefined') {
                  window.location.href = '/auth/login'
                }
              } else {
                errorMessage = t('assets.excel.export.deptError', 'Failed to export {0} for department {1}', title, dept)
              }
            
              toast.error(errorMessage)
            
              // Continue with the next department instead of stopping the entire process
              completedDepts++
            }
          }

          setExportStatus(t('assets.excel.export.creatingZip', 'Creating ZIP file...'))
          setExportProgress(90)
          
          // Generate the ZIP file
          const zipBlob = await zip.generateAsync({ type: 'blob' })
          
          setExportStatus(t('assets.excel.export.downloading', 'Downloading ZIP file...'))
          setExportProgress(95)
          
          // Create a blob URL and trigger download
          const urlObj = window.URL.createObjectURL(zipBlob)
          const a = document.createElement('a')
          a.href = urlObj
          a.download = `${assetType}-all-departments-export.zip`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(urlObj)

          setExportStatus(t('assets.excel.export.completing', 'Completing export...'))
          setExportProgress(100)
        
          toast.success(t('assets.excel.export.successAllDeptsZip', '{0} export completed. ZIP file with all departments downloaded.', title))
          
          // Close dialog automatically on success
          setTimeout(() => {
            onClose()
          }, 1500)
        } else {
          // Handle eachDept option (separate files)
          // Export each department separately
          let completedDepts = 0
          const totalDepts = departmentsToExport.length
        
          for (const dept of departmentsToExport) {
            try {
              setExportStatus(t('assets.excel.export.processingDept', 'Processing department: {0}', dept))
            
              // Calculate progress percentage based on completed departments
              const deptProgress = 20 + Math.floor((completedDepts / totalDepts) * 70)
              setExportProgress(deptProgress)
            
              // Build URL with query parameters
              const params = new URLSearchParams({
                assetType,
                dept
              })
            
              // Fix the URL - remove the extra /api prefix since apiClient includes the base URL
              const url = `/assets/excel/export?${params.toString()}`
            
              // Use apiClient with timeout and proper authentication
              const config: AxiosRequestConfig = {
                responseType: 'blob',
                timeout: exportTimeout,
                headers: {
                  'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'Cache-Control': 'no-store, no-cache'
                }
              }

              console.log(`Fetching from URL: ${url} with timeout ${exportTimeout}ms`)
              // Log the absolute URL for debugging
              console.log('Absolute URL:', window.location.origin + url)
            
              const response = await apiClient.get(url, config)
            
              setExportStatus(t('assets.excel.export.downloading', 'Downloading file...'))
              setExportProgress(80)
            
              // Check if the response is empty or invalid
              if (response.data.size === 0) {
                throw new Error(t('assets.excel.export.emptyResponse', 'Server returned an empty response'))
              }
            
              // Create a blob URL and trigger download
              const urlObj = window.URL.createObjectURL(new Blob([response.data]))
              const a = document.createElement('a')
              a.href = urlObj
              a.download = `${assetType}-${dept}-export.xlsx`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              window.URL.revokeObjectURL(urlObj)
            
              completedDepts++
            } catch (deptError: any) {
              console.error(`Export error for department ${dept}:`, deptError)
            
              // Handle different types of errors
              let errorMessage = ''
              if (deptError.code === 'ECONNABORTED') {
                errorMessage = t('assets.excel.export.deptTimeout', 'Export timed out for department {0}', dept)
              } else if (deptError.response?.status === 401) {
                errorMessage = t('assets.excel.export.unauthorized', 'Unauthorized access. Please log in again.')
                // Redirect to login page
                if (typeof window !== 'undefined') {
                  window.location.href = '/auth/login'
                }
              } else {
                errorMessage = t('assets.excel.export.deptError', 'Failed to export {0} for department {1}', title, dept)
              }
            
              toast.error(errorMessage)
            
              // Continue with the next department instead of stopping the entire process
              completedDepts++
            }
          
            // Add a small delay between downloads to prevent browser issues
            await new Promise(resolve => setTimeout(resolve, 500))
          }

          setExportStatus(t('assets.excel.export.completing', 'Completing export...'))
          setExportProgress(100)
        
          if (exportOption === 'eachDept' && department) {
            toast.success(t('assets.excel.export.successSingleDept', '{0} export completed for department {1}', title, department))
          } else {
            toast.success(t('assets.excel.export.successAllDepts', '{0} export completed for all departments', title))
          }
          
          // Close dialog automatically on success
          setTimeout(() => {
            onClose()
          }, 1500)
        }
      } else {
        // Handle single file exports (all, selected, by department)
        // Build URL with query parameters
        const params = new URLSearchParams({
          assetType
        })
      
        // If exporting selected items and we have selected items, add them to the query
        if (exportOption === 'selected' && selectedAssetIds.length > 0) {
          params.append('selectedIds', JSON.stringify(selectedAssetIds))
        }
      
        // If exporting by department and the asset type supports departments, add the department parameter
        if ((exportOption === 'allDepts') && department && showByDeptOption) {
          params.append('dept', department)
        }

        // Fix the URL - remove the extra /api prefix since apiClient includes the base URL
        const url = `/assets/excel/export?${params.toString()}`

        // Log the URL for debugging
        console.log('Export URL:', url)
        // Log the absolute URL for debugging
        console.log('Absolute URL:', window.location.origin + url)
      
        setExportStatus(t('assets.excel.export.processing', 'Processing export...'))
        setExportProgress(50)

        try {
          // Use apiClient with timeout and proper authentication
          const config: AxiosRequestConfig = {
            responseType: 'blob',
            timeout: exportTimeout,
            headers: {
              'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            }
          }

          const response = await apiClient.get(url, config)
        
          setExportStatus(t('assets.excel.export.downloading', 'Downloading file...'))
          setExportProgress(80)
        
          // Create a blob URL and trigger download
          const urlObj = window.URL.createObjectURL(new Blob([response.data]))
          const a = document.createElement('a')
          a.href = urlObj
          a.download = `${assetType}-export.xlsx`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(urlObj)

          setExportStatus(t('assets.excel.export.completed', 'Export completed'))
          setExportProgress(100)
        
          toast.success(t('assets.excel.export.success', '{0} export completed', title))
          
          // Close dialog automatically on success
          setTimeout(() => {
            onClose()
          }, 1500)
        } catch (singleExportError: any) {
          console.error('Single export error:', singleExportError)
        
          // Handle different types of errors
          let message = ''
          if (singleExportError.code === 'ECONNABORTED') {
            message = t('assets.excel.export.timeout', 'Export timed out. The data might be too large.')
          } else if (singleExportError.response?.status === 401) {
            message = t('assets.excel.export.unauthorized', 'Unauthorized access. Please log in again.')
            // Redirect to login page
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login'
            }
          } else {
            message = singleExportError.message || t('assets.excel.export.error', 'Failed to export assets')
          }
          
          toast.error(message)
          throw singleExportError
        }
      }
    } catch (error: any) {
      console.error('Export error:', error)
      // Error is already handled in the inner catch blocks
    } finally {
      resetExport()
    }
  }, [assetType, title, t, exportOption, selectedAssetIds, department, showByDeptOption, departments, resetExport, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('assets.excel.export.title', 'Export {0}', title)}</DialogTitle>
          <DialogDescription>
            {t('assets.excel.export.description', 'Export {0} data to an Excel file', title.toLowerCase())}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">{t('assets.excel.export.data', 'Export Data')}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <RadioGroup 
                  value={exportOption} 
                  onValueChange={(value: string) => setExportOption(value as ExportOption)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="export-all" />
                    <Label htmlFor="export-all">
                      {t('assets.excel.export.all', 'All {0}', title.toLowerCase())}
                    </Label>
                  </div>
                  {showByDeptOption && (
                    <>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="allDepts" 
                          id="export-all-depts" 
                        />
                        <Label htmlFor="export-all-depts">
                          {t('assets.excel.export.allDepts', 'All Departments')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="eachDept" 
                          id="export-each-dept" 
                        />
                        <Label htmlFor="export-each-dept">
                          {t('assets.excel.export.eachDept', 'Each Department (separate files)')}
                        </Label>
                      </div>
                    </>
                  )}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value="selected" 
                      id="export-selected" 
                      disabled={selectedAssetIds.length === 0}
                    />
                    <Label htmlFor="export-selected" className={selectedAssetIds.length === 0 ? "text-muted-foreground" : ""}>
                      {selectedAssetIds.length > 0 
                        ? t('assets.excel.export.selected', '{0} selected items', selectedAssetIds.length.toString())
                        : t('assets.excel.export.noSelection', 'No items selected')
                      }
                    </Label>
                  </div>
                </RadioGroup>
              
              {(exportOption === 'allDepts' || exportOption === 'eachDept') && showByDeptOption && (
                <div className="mt-2">
                  <Label htmlFor="department">
                    {t('assets.excel.export.department', 'Department')}
                  </Label>
                  <Select 
                    onValueChange={setDepartment} 
                    value={department}
                    disabled={loadingDepartments || exportOption === 'allDepts'} // Disable for allDepts since it exports all departments
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue 
                        placeholder={loadingDepartments 
                          ? t('assets.excel.export.loadingDepts', 'Loading departments...') 
                          : exportOption === 'allDepts'
                          ? t('assets.excel.export.allDeptsSelected', 'All departments will be exported')
                          : t('assets.excel.export.selectDept', 'Select department')
                        } 
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {exportOption === 'all' 
                ? t('assets.excel.export.info.all', 'This will export all {0} data to an Excel file with proper formatting.', title.toLowerCase())
                : exportOption === 'allDepts' && showByDeptOption
                ? t('assets.excel.export.info.allDeptsZip', 'This will export {0} data for all departments packaged into a single ZIP file with separate Excel files for each department.', title.toLowerCase())
                : exportOption === 'eachDept' && showByDeptOption
                ? department 
                  ? t('assets.excel.export.info.singleDept', 'This will export {0} data for the selected department ({1}) to an Excel file with proper formatting.', title.toLowerCase(), department)
                  : t('assets.excel.export.info.eachDept', 'This will export {0} data for each department to separate Excel files with proper formatting.', title.toLowerCase())
                : selectedAssetIds.length > 0
                ? t('assets.excel.export.info.selected', 'This will export only the selected {0} items to an Excel file with proper formatting.', title.toLowerCase())
                : t('assets.excel.export.info.noSelection', 'No items selected for export.')
              }
            </p>
            
            {/* Add progress indicator */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">{exportStatus}</span>
                  <span className="text-sm">{exportProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${exportProgress}%` }}></div>
                </div>
              </div>
            )}
            
            <Button
              onClick={handleExport}
              disabled={
                isExporting || 
                (exportOption === 'selected' && selectedAssetIds.length === 0) || 
                ((exportOption === 'allDepts' || exportOption === 'eachDept') && showByDeptOption && !department && departments.length === 0 && exportOption !== 'allDepts')
              }
              className="w-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('assets.excel.export.exporting', 'Exporting...')}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t('assets.excel.export.button', 'Export Data')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isExporting}>
            {t('common.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}