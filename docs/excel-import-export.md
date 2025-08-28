# Excel Import/Export Functionality

## Overview

This document describes the enhanced Excel import/export functionality implemented for the IT Asset Management System (ITAMS). The new implementation provides template-based data handling with proper formatting preservation for all asset types.

## Features

1. **Template-based Import/Export**: Uses predefined Excel templates for each asset type
2. **Automatic Data Mapping**: Maps Excel data to appropriate database models
3. **Empty Row Handling**: Automatically converts empty cells to "N/A"
4. **Format Preservation**: Maintains template formatting including styles and merged cells
5. **TypeScript Compliance**: Fully typed implementation following best practices
6. **Footer Handling**: Special handling for PC templates to preserve footers

## Asset Types Supported

- PC Assets (with footer preservation)
- Laptop Assets (header and data only)
- Printer Assets (header and data only)
- License Assets (header and data only)
- WarehouseIT Assets (header and data only)

## Implementation Details

### Import Functionality

The import functionality is implemented in `src/lib/excel.ts` with the `importFromExcelWithTemplate` function:

```typescript
export async function importFromExcelWithTemplate(file: File, assetType: string): Promise<Record<string, unknown>[]>
```

Key features:
- Reads Excel files using xlsx-populate
- Automatically detects and skips empty rows
- Converts empty cell values to "N/A"
- Returns properly structured data for database insertion

### Export Functionality

Separate export functions are implemented for each asset type:

- `exportPCToExcel(data: PCAsset[]): Promise<ArrayBuffer>`
- `exportLaptopToExcel(data: LaptopAsset[]): Promise<ArrayBuffer>`
- `exportPrinterToExcel(data: PrinterAsset[]): Promise<ArrayBuffer>`
- `exportLicenseToExcel(data: LicenseAsset[]): Promise<ArrayBuffer>`
- `exportWarehouseITToExcel(data: WarehouseITAsset[]): Promise<ArrayBuffer>`

Key features:
- Loads appropriate template file from `src/templates/`
- Preserves all formatting, styles, and merged cells
- **PC templates**: Automatically inserts new rows when data exceeds template capacity to preserve footer
- **Other templates**: Only include header and data (no footer handling)
- Handles footer preservation for PC templates specifically

## API Integration

The functionality is integrated with the existing API routes in `src/app/api/assets/excel/route.ts`:

### Import Endpoint
```
POST /api/assets/excel/import
```
Parameters:
- `file`: Excel file to import
- `assetType`: Type of asset (pc, laptop, printer, license, warehouse)

### Export Endpoint
```
GET /api/assets/excel/export
```
Parameters:
- `assetType`: Type of asset to export

## Template Files

Template files are stored in `src/templates/`:
- `PC_Template.xlsx` (includes footer)
- `Laptop_Template.xlsx` (header and data only)
- `Printer_Template.xlsx` (header and data only)
- `Licenses_Template.xlsx` (header and data only)
- `WarehouseIT_Template.xlsx` (header and data only)

## Usage Examples

### Frontend Usage

```typescript
// Import example
const formData = new FormData();
formData.append('file', file);
formData.append('assetType', 'pc');

const response = await fetch('/api/assets/excel/import', {
  method: 'POST',
  body: formData
});

// Export example
const response = await fetch('/api/assets/excel/export?assetType=pc');
const blob = await response.blob();
```

### Backend Usage

```typescript
import { 
  exportPCToExcel, 
  importFromExcelWithTemplate 
} from '@/lib/excel';

// Export PC data (with footer preservation)
const buffer = await exportPCToExcel(pcData);

// Export Laptop data (header and data only)
const buffer = await exportLaptopToExcel(laptopData);

// Import data from Excel
const data = await importFromExcelWithTemplate(file, 'pc');
```

## Footer Handling Implementation

The PC export function includes special logic to preserve footers:

1. Identifies the data start row in the template
2. Searches for footer content after the data area
3. If a footer is found, inserts new rows for data to avoid overwriting the footer
4. Maintains all footer formatting and content

For other asset types (Laptop, Printer, License, WarehouseIT), only header and data are handled, with no special footer preservation.

## Error Handling

The implementation includes comprehensive error handling:
- Template file not found errors
- Invalid Excel file format errors
- Data validation errors
- Database insertion errors

All errors are properly logged and returned to the client with appropriate HTTP status codes.

## Testing

The functionality has been tested with:
- Template file existence verification
- Function export verification
- Build process verification
- Integration with existing API routes
- Specific footer handling verification for PC templates

## Future Improvements

Potential areas for future enhancement:
- Add support for custom field import/export
- Implement batch processing for large files
- Add progress indicators for long-running operations
- Enhance error reporting with detailed row/column information
- Improve footer detection algorithm for more complex templates