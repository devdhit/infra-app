'use client'

import * as React from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Row,
  Column,
  HeaderGroup,
  Cell,
  Table as ReactTable,
  RowSelectionState,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, ChevronLeft, ChevronRight, Search, Eye, EyeOff, Filter, GripVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  pagination?: boolean
  pageSize?: number
  onRowClick?: (row: TData) => void
  onRowSelectionChange?: (selectedRows: Record<string, boolean>) => void
  // Add props for API integration
  loading?: boolean
  error?: string | null
  onRefresh?: () => void
  // New prop to disable built-in features when columns are processed externally
  disableBuiltInFeatures?: boolean
  // New prop to specify row ID accessor
  getRowId?: (row: TData) => string
  // New props for responsive behavior
  responsive?: boolean
  // New prop for column resizing
  enableColumnResizing?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  onRowSelectionChange,
  loading = false,
  error = null,
  onRefresh,
  disableBuiltInFeatures = false,
  getRowId,
  responsive = true,
  enableColumnResizing = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [searchValue, setSearchValue] = React.useState('')
  // State for column resizing
  const [columnSizing, setColumnSizing] = React.useState<Record<string, number>>({})
  // State for mobile view toggle
  const [isMobileView, setIsMobileView] = React.useState(false);

  // Clear row selection when data changes (e.g., after bulk delete)
  React.useEffect(() => {
    // Only clear selection if there are no selected rows or if the data has changed significantly
    if (Object.keys(rowSelection).length > 0) {
      // Check if any of the selected row IDs still exist in the new data
      const newDataIds = new Set(data.map((item, index) => getRowId ? getRowId(item) : index.toString()));
      const hasValidSelections = Object.keys(rowSelection).some(id => newDataIds.has(id));
      
      // Only clear selection if none of the selected rows exist in the new data
      if (!hasValidSelections) {
        setRowSelection({});
      }
    }
  }, [data, getRowId, rowSelection]);

  // Notify parent component of row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      onRowSelectionChange(rowSelection)
    }
  }, [rowSelection, onRowSelectionChange])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnSizing,
    },
    onColumnSizingChange: setColumnSizing,
    enableColumnResizing: enableColumnResizing,
    columnResizeMode: 'onChange',
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    enableGlobalFilter: searchable,
    // Use custom row ID function if provided
    getRowId: getRowId ? (row: TData) => getRowId(row) : undefined,
  })

  // Reset pagination when data changes
  React.useEffect(() => {
    table.setPageIndex(0)
  }, [data, table])

  // Toggle all columns visibility
  const toggleAllColumns = (visible: boolean) => {
    const newState: VisibilityState = {}
    table.getAllColumns().forEach((col: Column<TData, unknown>) => {
      if (col.getCanHide()) {
        newState[col.id] = visible
      }
    })
    setColumnVisibility(newState)
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setColumnFilters([])
    setSearchValue('')
  }

  // Remove duplicate columns based on id
  const getUniqueColumns = React.useCallback(() => {
    const seen = new Set()
    return table
      .getAllColumns()
      .filter((column: Column<TData, unknown>) => {
        if (typeof column.accessorFn !== 'undefined' && column.getCanHide()) {
          const key = column.id
          if (seen.has(key)) {
            return false
          }
          seen.add(key)
          return true
        }
        return false
      })
  }, [table])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        {onRefresh && (
          <Button onClick={onRefresh}>
            Try Again
          </Button>
        )}
      </div>
    )
  }

  // Render mobile view - card-based layout
  if (isMobileView) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsMobileView(false)}
              className="flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <line x1="3" x2="21" y1="9" y2="9" />
                <line x1="3" x2="21" y1="15" y2="15" />
                <line x1="9" x2="9" y1="3" y2="21" />
                <line x1="15" x2="15" y1="3" y2="21" />
              </svg>
              Table View
            </Button>
            
            {/* Column visibility control */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Fields
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Fields</h4>
                    <p className="text-sm text-muted-foreground">
                      Select which fields to display in cards
                    </p>
                  </div>
                  <Separator />
                  <div className="grid gap-2 max-h-60 overflow-y-auto">
                    {table.getAllColumns().map((column) => (
                      column.getCanHide() ? (
                        <div key={column.id} className="flex items-center justify-between">
                          <span className="text-sm">{String(column.columnDef.header)}</span>
                          <Checkbox
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          />
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="space-y-4">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <div key={row.id} className="modern-data-table-card">
                <div className="grid grid-cols-1 gap-2">
                  {row.getVisibleCells().map((cell) => {
                    // Skip checkbox column in card view
                    if (cell.column.id === 'select') return null;
                    
                    const header = cell.column.columnDef.header;
                    return (
                      <div key={cell.id} className="modern-data-table-card-field">
                        <span className="modern-data-table-card-label">
                          {typeof header === 'string' ? header : header?.toString() || cell.column.id}
                        </span>
                        <span className="modern-data-table-card-value">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {onRowClick && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 w-full"
                    onClick={() => onRowClick(row.original)}
                  >
                    View Details
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm">
                Page {table.getState().pagination.pageIndex + 1} of{' '}
                {table.getPageCount() || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsMobileView(true)}
            className="flex items-center gap-1 sm:hidden"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <line x1="3" x2="21" y1="9" y2="9" />
            </svg>
            Card View
          </Button>
          
          {/* Column visibility control */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Columns</h4>
                  <p className="text-sm text-muted-foreground">
                    Select which columns to display
                  </p>
                </div>
                <Separator />
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Select All</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleAllColumns(true)}
                      className="h-8 px-2"
                    >
                      Show
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleAllColumns(false)}
                      className="h-8 px-2"
                    >
                      Hide
                    </Button>
                  </div>
                  {table.getAllColumns().map((column) => (
                    column.getCanHide() ? (
                      <div key={column.id} className="flex items-center justify-between">
                        <span className="text-sm">{String(column.columnDef.header)}</span>
                        <Checkbox
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        />
                      </div>
                    ) : null
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Table Container with Enhanced Horizontal Scrolling */}
      <div className="modern-data-table-container">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader className="modern-data-table-header">
              {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
                <TableRow key={headerGroup.id} className="bg-muted/30">
                  {headerGroup.headers.map((header, index) => {
                    const isFirstColumn = index === 0;
                    const isCheckboxColumn = header.id === 'select';
                    
                    return (
                      <TableHead 
                        key={header.id} 
                        className={`
                          ${isFirstColumn ? 'sticky-column' : ''}
                          ${isCheckboxColumn ? 'w-10' : ''}
                        `}
                        style={{
                          width: isCheckboxColumn ? 40 : header.getSize(),
                          minWidth: isCheckboxColumn ? 40 : 120,
                          position: isFirstColumn ? 'sticky' : 'relative',
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            {...{
                              className: (sortable && header.column.getCanSort() && !disableBuiltInFeatures)
                                ? "cursor-pointer select-none flex items-center justify-between"
                                : "flex items-center justify-between",
                              onClick: (sortable && header.column.getCanSort() && !disableBuiltInFeatures)
                                ? header.column.getToggleSortingHandler()
                                : undefined,
                            }}
                          >
                            <div className="break-words whitespace-normal text-sm font-medium">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </div>
                            {(sortable && header.column.getCanSort() && !disableBuiltInFeatures) && (
                              <span className="ml-1 flex-shrink-0">
                                {{
                                  asc: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary"><path d="m5 15 7-7 7 7"/></svg>,
                                  desc: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-primary"><path d="m19 9-7 7-7-7"/></svg>
                                }[header.column.getIsSorted() as string] ?? 
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground opacity-30"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>}
                              </span>
                            )}
                            {enableColumnResizing && !isCheckboxColumn && (
                              <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className={`column-resize-handle ${
                                  header.column.getIsResizing() ? 'resizing' : ''
                                }`}
                              />
                            )}
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: Row<TData>) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    onClick={() => onRowClick?.(row.original)}
                    className={`data-table-row ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {row.getVisibleCells().map((cell, index) => {
                      const isFirstColumn = index === 0;
                      const isCheckboxColumn = cell.column.id === 'select';
                      
                      return (
                        <TableCell 
                          key={cell.id} 
                          className={`align-middle ${isFirstColumn ? 'sticky-column' : ''}`}
                          style={{
                            width: isCheckboxColumn ? 40 : cell.column.getSize(),
                            minWidth: isCheckboxColumn ? 40 : 120,
                            maxWidth: isCheckboxColumn ? 40 : 'none',
                          }}
                        >
                          <div className={`${isCheckboxColumn ? '' : 'break-words whitespace-normal text-sm'} overflow-hidden text-ellipsis`}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination - only show if built-in features are enabled */}
      {pagination && (
        <div className="data-table-pagination">
          <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount() || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}