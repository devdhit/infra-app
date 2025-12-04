'use client'

import * as React from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Row,
  HeaderGroup,
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
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { LoadingLayout } from '@/components/ui/loading-layout'

// Add dnd-kit imports for drag and drop functionality
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Button } from '@/components/ui/button'


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Add virtualization support


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
  // New prop for virtualization
  enableVirtualization?: boolean
  virtualItemHeight?: number
  // New prop for column reordering
  enableColumnReordering?: boolean
  // Callback for when columns are reordered
  onColumnOrderChange?: (newOrder: string[]) => void
  // Props for column visibility control
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
}

// Draggable table header component
const DraggableTableHeader = React.memo(({ 
  header, 
  index, 
  sortable, 
  disableBuiltInFeatures, 
  enableColumnResizing 
}: { 
  header: any 
  index: number 
  sortable: boolean 
  disableBuiltInFeatures: boolean 
  enableColumnResizing: boolean 
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: header.id,
  })

  const isFirstColumn = index === 0
  const isCheckboxColumn = header.id === 'select'
  const isActionsColumn = header.id === 'actions'
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.9 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: isFirstColumn ? 'sticky' : 'relative',
    width: header.getSize(),
    minWidth: header.column.columnDef.minSize || 150,
    maxWidth: header.column.columnDef.maxSize || 800,
    boxShadow: isDragging ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
  } as React.CSSProperties

  return (
    <TableHead 
      ref={setNodeRef}
      style={style}
      className={`
        ${isFirstColumn ? 'sticky-column' : ''}
        ${isCheckboxColumn ? 'w-[50px]' : ''}
        ${isActionsColumn ? 'w-[100px]' : ''}
        ${isDragging ? 'shadow-lg rounded-md' : ''}
        relative
      `}
    >
      {header.isPlaceholder ? null : (
        <div
          {...{
            className: (sortable && header.column.getCanSort() && !disableBuiltInFeatures)
              ? "cursor-pointer select-none flex items-center justify-between h-full"
              : "flex items-center justify-between h-full",
            onClick: (sortable && header.column.getCanSort() && !disableBuiltInFeatures)
              ? header.column.getToggleSortingHandler()
              : undefined,
          }}
        >
          <div 
            className="break-words whitespace-normal text-sm font-medium flex items-center gap-1 flex-1"
            {...(header.column.id !== 'select' && header.column.id !== 'actions' ? attributes : {})}
            {...(header.column.id !== 'select' && header.column.id !== 'actions' ? listeners : {})}
          >
            {header.column.id !== 'select' && header.column.id !== 'actions' && (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0"
              >
                <line x1="9" x2="9" y1="5" y2="19" />
                <line x1="15" x2="15" y1="5" y2="19" />
              </svg>
            )}
            <div className="flex-1">
              {flexRender(
                header.column.columnDef.header,
                header.getContext()
              )}
            </div>
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
          {enableColumnResizing && !isCheckboxColumn && !isActionsColumn && (
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
});
DraggableTableHeader.displayName = 'DraggableTableHeader'

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = true,
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
  enableColumnResizing = true, // Enable column resizing by default
  enableVirtualization = false,
  virtualItemHeight = 50,
  enableColumnReordering = false,
  onColumnOrderChange,
  columnVisibility, // Add this prop
  onColumnVisibilityChange, // Add this prop
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  // Use the provided columnVisibility prop or fallback to internal state
  const [internalColumnVisibility, setInternalColumnVisibility] = React.useState<VisibilityState>({})
  const effectiveColumnVisibility = columnVisibility !== undefined ? columnVisibility : internalColumnVisibility
  
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  // State for column resizing
  const [columnSizing, setColumnSizing] = React.useState<Record<string, number>>({})
  // State for column order
  const [columnOrder, setColumnOrder] = React.useState<string[]>(() => 
    columns.map(column => column.id as string || (column as any).accessorKey)
  );

  // Setup sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  // Handle drag end event for column reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        
        // Notify parent component of column order change
        onColumnOrderChange?.(newOrder)
        
        return newOrder
      })
    }
  }

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
    onColumnVisibilityChange: (updater) => {
      // If we have an external handler, use it, otherwise use internal state
      if (onColumnVisibilityChange) {
        // Convert updater to the expected format for external handler
        if (typeof updater === 'function') {
          const newState = updater(effectiveColumnVisibility);
          onColumnVisibilityChange(newState);
        } else {
          onColumnVisibilityChange(updater);
        }
      } else {
        // Use internal state management
        setInternalColumnVisibility(updater);
      }
    },
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility: effectiveColumnVisibility,
      rowSelection,
      columnSizing,
      columnOrder: enableColumnReordering ? columnOrder : undefined,
    },
    onColumnSizingChange: setColumnSizing,
    enableColumnResizing: enableColumnResizing,
    columnResizeMode: 'onChange',
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
      // Initialize column visibility based on the 'hide' property in column definitions
      columnVisibility: columns.reduce((acc, column: any) => {
        if (column.hide === true) {
          acc[column.accessorKey || column.id] = false;
        }
        return acc;
      }, {} as VisibilityState),
    },
    enableGlobalFilter: searchable,
    // Use custom row ID function if provided
    getRowId: getRowId ? (row: TData) => getRowId(row) : undefined,
  })

  // Reset pagination when data changes
  React.useEffect(() => {
    table.setPageIndex(0)
  }, [data, table])

  if (loading) {
    return (
      <LoadingLayout 
        size="lg" 
        height="lg"
        descriptionText={t('common.pleaseWait') || 'Please wait while we fetch the latest information'}
      />
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-background rounded-xl border border-destructive/30 bg-destructive/5">
        <div className="text-destructive mb-6 p-4 rounded-full bg-destructive/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold mb-3 text-foreground">Error Loading Data</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        {onRefresh && (
          <Button 
            onClick={onRefresh}
            className="px-6 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors duration-200"
          >
            Try Again
          </Button>
        )}
      </div>
    )
  }

  // Add optimized rendering for large datasets
  const OptimizedTableBody = React.memo<{
    table: ReactTable<TData>;
    data: TData[];
    onRowClick?: (row: TData) => void;
    enableVirtualization?: boolean;
    virtualItemHeight?: number;
  }>(({ table, onRowClick }) => {
    // Only render visible rows based on current pagination
    return (
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row: Row<TData>) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              onClick={() => onRowClick?.(row.original)}
              className={`data-table-row ${onRowClick ? 'cursor-pointer transition-all duration-200 hover:shadow-sm' : ''} ${row.getIsSelected() ? 'bg-primary/15 border-l-4 border-primary shadow-sm' : 'hover:bg-muted/30'} transition-colors duration-150 ease-in-out`}
            >
              {row.getVisibleCells().map((cell, index) => {
                const isFirstColumn = index === 0;
                const isActionsColumn = cell.column.id === 'actions';
                
                return (
                  <TableCell 
                    key={cell.id} 
                    className={`align-middle ${isFirstColumn ? 'sticky-column' : ''} ${cell.column.id === 'select' ? 'w-[50px]' : ''} ${isActionsColumn ? 'w-[100px]' : ''} py-3 px-4 transition-colors duration-150 hover:bg-muted/20`}  /* Updated sizes */
                    style={{
                      width: cell.column.getSize(),
                      minWidth: cell.column.columnDef.minSize || 150,
                      maxWidth: cell.column.columnDef.maxSize || 800,
                    }}
                  >
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap transition-all duration-150 group-hover:text-foreground">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center">
              No results found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    );
  });
  OptimizedTableBody.displayName = 'OptimizedTableBody';

  // Render table header with or without drag and drop
  const renderTableHeader = () => {
    if (enableColumnReordering) {
      // Create a wrapper component that renders the table header without placing divs inside table
      return (
        <TableHeader className="modern-data-table-header">
          {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
            <TableRow key={headerGroup.id} className="bg-muted/30">
              {headerGroup.headers.map((header, index) => (
                <DraggableTableHeader
                  key={header.id}
                  header={header}
                  index={index}
                  sortable={sortable}
                  disableBuiltInFeatures={disableBuiltInFeatures}
                  enableColumnResizing={enableColumnResizing}
                />
              ))}
            </TableRow>
          ))}
        </TableHeader>
      );
    }

    return (
      <TableHeader className="modern-data-table-header">
        {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
          <TableRow key={headerGroup.id} className="bg-muted/30">
            {headerGroup.headers.map((header, index) => {
              const isFirstColumn = index === 0;
              const isCheckboxColumn = header.id === 'select';
              const isActionsColumn = header.id === 'actions';
              
              return (
                <TableHead 
                  key={header.id} 
                  className={`
                    ${isFirstColumn ? 'sticky-column' : ''}
                    ${isCheckboxColumn ? 'w-[50px]' : ''}
                    ${isActionsColumn ? 'w-[100px]' : ''}
                    relative
                  `}
                  style={{
                    width: header.getSize(),
                    minWidth: header.column.columnDef.minSize || 150,
                    maxWidth: header.column.columnDef.maxSize || 800,
                    position: isFirstColumn ? 'sticky' : 'relative',
                  }}
                >
                  {header.isPlaceholder ? null : (
                    <div
                      {...{
                        className: (sortable && header.column.getCanSort() && !disableBuiltInFeatures)
                          ? "cursor-pointer select-none flex items-center justify-between h-full"
                          : "flex items-center justify-between h-full",
                        onClick: (sortable && header.column.getCanSort() && !disableBuiltInFeatures)
                          ? header.column.getToggleSortingHandler()
                          : undefined,
                      }}
                    >
                      <div className="break-words whitespace-normal text-sm font-medium flex-1">
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
                      {enableColumnResizing && !isCheckboxColumn && !isActionsColumn && (
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
    );
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Table Container with Better Styling */}
      <div className="modern-data-table-container rounded-xl border border-muted shadow-sm overflow-hidden bg-background transition-all duration-300 hover:shadow-md">
        <div className="overflow-x-auto">
          {enableColumnReordering ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columnOrder}
                strategy={horizontalListSortingStrategy}
              >
                <Table className="w-full table-fixed">
                  {renderTableHeader()}
                  <OptimizedTableBody 
                    table={table} 
                    data={data} 
                    onRowClick={onRowClick} 
                    enableVirtualization={enableVirtualization}
                    virtualItemHeight={virtualItemHeight}
                  />
                </Table>
              </SortableContext>
            </DndContext>
          ) : (
            <Table className="w-full table-fixed">
              {renderTableHeader()}
              <OptimizedTableBody 
                table={table} 
                data={data} 
                onRowClick={onRowClick} 
                enableVirtualization={enableVirtualization}
                virtualItemHeight={virtualItemHeight}
              />
            </Table>
          )}
        </div>
      </div>

      {/* Enhanced Pagination with Better Styling */}
      {pagination && (
        <div className="data-table-pagination flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{table.getFilteredSelectedRowModel().rows.length}</span> of{' '}
            <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="transition-all duration-200 hover:shadow-sm shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Previous</span>
            </Button>
            <div className="text-sm bg-background px-3 py-1 rounded-md border border-muted flex items-center">
              <span className="hidden sm:inline">Page</span>
              <span className="font-semibold mx-1">{table.getState().pagination.pageIndex + 1}</span>
              <span className="hidden sm:inline">of</span>
              <span className="font-semibold ml-1">{table.getPageCount() || 1}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="transition-all duration-200 hover:shadow-sm shadow-sm"
            >
              <span className="sr-only sm:not-sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
