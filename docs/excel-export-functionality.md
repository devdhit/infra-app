# Excel Export Functionality

## Overview

The IT Asset Management System provides comprehensive Excel export capabilities for all asset types. Users can export individual asset types or all asset types in a single Excel file with multiple sheets.

## Features

1. **Individual Asset Type Export**: Export any single asset type (PC, Laptop, Printer, License, Warehouse) to a dedicated Excel template
2. **All Assets Export**: Export all asset types in a single Excel file with each asset type on a separate sheet
3. **Selective Export**: Export either all assets or only selected assets
4. **Template-based Formatting**: All exports use pre-defined Excel templates for consistent formatting

## Implementation Details

### Frontend Components

1. **ExcelExportDialog** (`src/components/assets/excel-export-dialog.tsx`)
   - Handles export for individual asset types
   - Provides options to export all or selected items
   - Integrated into each asset list page

2. **ExcelExportAllDialog** (`src/components/assets/excel-export-all-dialog.tsx`)
   - Handles export for all asset types
   - Provides options to export all or selected items
   - Integrated into the main assets page

### Backend API Routes

1. **Individual Asset Export** (`src/app/api/assets/excel/export/route.ts`)
   - Exports a single asset type based on the `assetType` parameter
   - Supports filtering by selected IDs
   - Uses template-specific export functions

2. **All Assets Export** (`src/app/api/assets/excel/export-all/route.ts`)
   - Exports all asset types in a single Excel file
   - Creates a multi-sheet workbook with each asset type on a separate sheet
   - Supports filtering by selected IDs across all asset types

### Excel Library

The Excel functionality is implemented in `src/lib/excel.ts` and includes:

1. **Template-based Export Functions**:
   - `exportPCToExcel()`
   - `exportLaptopToExcel()`
   - `exportPrinterToExcel()`
   - `exportLicenseToExcel()`
   - `exportWarehouseITToExcel()`

2. **Template Files**:
   - Stored in `src/templates/`
   - Each asset type has its own template file (e.g., `PC_Template.xlsx`)

## Usage

### Exporting Individual Asset Types

1. Navigate to any asset list page (e.g., PC, Laptop, etc.)
2. Click the "Export" button
3. Choose to export "All" items or "Selected" items
4. Click "Export Data" to download the Excel file

### Exporting All Asset Types

1. Navigate to the main Assets page
2. Click the "Export All" button
3. Choose to export "All assets" or "Selected items"
4. Click "Export All Assets" to download the Excel file

## Technical Notes

- All exports use the `xlsx-populate` library for Excel manipulation
- Templates are loaded from the `src/templates/` directory
- Date fields are converted to ISO string format for consistency
- Null values are converted to `undefined` or appropriate default values to match interface expectations
- The multi-sheet export creates a new workbook and adds each asset type as a separate sheet