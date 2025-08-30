# Partial Excel Export Functionality Implementation

## Overview
This document summarizes the implementation of partial Excel export functionality that allows users to export either all assets or only selected assets to Excel files.

## Changes Made

### 1. Backend API Enhancement
**File:** `src/app/api/assets/excel/export/route.ts`

- Added support for filtering assets by selected IDs
- Modified database queries to accept an optional `selectedIds` parameter
- Added ID field to all select queries to enable proper filtering
- Updated URL parameter parsing to handle selected IDs as JSON array

### 2. UI Component Creation
**File:** `src/components/ui/radio-group.tsx`

- Created new RadioGroup component using Radix UI primitives
- Implemented proper styling and accessibility features
- Added to the UI components index for easy importing

### 3. Excel Export Dialog Enhancement
**File:** `src/components/assets/excel-export-dialog.tsx`

- Added radio group options for "Export All" vs "Export Selected"
- Implemented logic to pass selected asset IDs to the API
- Added proper translations for all new UI elements
- Disabled "Export Selected" option when no items are selected
- Updated component props to accept selected asset IDs

### 4. Asset List Integration
**File:** `src/components/assets/asset-list.tsx`

- Modified ExcelExportDialog usage to pass selected asset IDs
- Maintained backward compatibility with existing functionality

### 5. UI Components Index Update
**File:** `src/components/ui/index.ts`

- Added export for the new RadioGroup component

## New Features

### Partial Export Options
Users can now choose between two export options:
1. **Export All** - Exports all assets of the selected type
2. **Export Selected** - Exports only the currently selected assets (if any)

### API Filtering
The backend API now supports filtering by specific asset IDs:
```
GET /api/assets/excel/export?assetType=pc&selectedIds=["id1","id2","id3"]
```

## Testing

### Unit Tests
Created comprehensive tests for:
1. **Excel Export Functions** - `__tests__/excel-partial-export.test.ts`
2. **API Endpoint** - `__tests__/excel-export-api.test.ts`
3. **Frontend Component** - `__tests__/excel-export-dialog.test.tsx`

## Usage

### Frontend Integration
The ExcelExportDialog component now accepts an optional `selectedAssetIds` prop:
```tsx
<ExcelExportDialog
  assetType="pc"
  title="PC"
  isOpen={isExportDialogOpen}
  onClose={() => setIsExportDialogOpen(false)}
  selectedAssetIds={selectedAssets}
/>
```

### API Usage
The API endpoint supports both full and partial exports:
```
# Export all assets
GET /api/assets/excel/export?assetType=pc

# Export selected assets
GET /api/assets/excel/export?assetType=pc&selectedIds=["id1","id2"]
```

## Benefits

1. **Enhanced User Experience** - Users can now export only the data they need
2. **Performance Improvement** - Smaller exports for selected items load faster
3. **Flexibility** - Supports both full and partial export workflows
4. **Backward Compatibility** - Existing functionality remains unchanged
5. **Proper Error Handling** - Graceful handling of edge cases and errors

## Technical Details

### Data Flow
1. User selects export option in the dialog
2. Component passes selected option and asset IDs to the API
3. API filters database query based on provided IDs (or fetches all if none provided)
4. Excel export functions process the filtered data
5. File is returned to the user for download

### Security
- All exports are tenant-scoped to prevent data leakage
- Proper authentication checks are maintained
- Input validation for selected IDs to prevent injection attacks

## Future Improvements

1. Add support for additional filtering options (by date range, status, etc.)
2. Implement export progress indicator for large datasets
3. Add export format options (CSV, different Excel templates)
4. Enhance error messaging for specific failure scenarios