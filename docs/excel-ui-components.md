# Excel Import/Export UI Components

## Overview

This document describes the user interface components implemented for Excel import/export functionality in the IT Asset Management System (ITAMS). The implementation follows TypeScript best practices and provides a user-friendly interface for importing and exporting asset data.

## Components

### ExcelImportExportDialog

A reusable dialog component that provides both import and export functionality for Excel files.

#### Props

```typescript
interface ExcelImportExportDialogProps {
  assetType: string;        // Type of asset (pc, laptop, printer, etc.)
  title: string;            // Display title for the asset type
  isOpen: boolean;          // Controls dialog visibility
  onClose: () => void;      // Callback when dialog is closed
  onImportSuccess: () => void; // Callback after successful import
}
```

#### Features

1. **Import Functionality**
   - File selection with validation for .xlsx and .xls formats
   - Progress indication during import process
   - Detailed error reporting with specific error messages
   - Success feedback with count of imported assets
   - Automatic data refresh after successful import

2. **Export Functionality**
   - One-click export of all assets for the specified type
   - Progress indication during export process
   - Automatic file download with appropriate naming
   - Success/error feedback

3. **User Experience**
   - Clean, intuitive interface with clear sections for import and export
   - Responsive design that works on all screen sizes
   - Proper loading states with spinners
   - Informative alerts for success and error states
   - Clear instructions and hints for users

#### Implementation Details

The component uses the existing API endpoints:
- `POST /api/assets/excel/import` for importing data
- `GET /api/assets/excel/export` for exporting data

It follows the same patterns as other dialog components in the application, using:
- Shadcn/UI components for consistent styling
- React Query for data management
- TypeScript for type safety
- Sonner for toast notifications

### AssetList Integration

The ExcelImportExportDialog is integrated into the existing AssetList component, which is used for all asset types (PC, Laptop, Printer, License, WarehouseIT).

#### Integration Points

1. **State Management**
   ```typescript
   const [isImportExportDialogOpen, setIsImportExportDialogOpen] = useState(false);
   ```

2. **Import Success Handler**
   ```typescript
   const handleImportSuccess = useCallback(() => {
     // Refetch all data after successful import
     queryClient.invalidateQueries({ queryKey: ['assets', assetType] });
     refetch();
   }, [assetType, queryClient, refetch]);
   ```

3. **Button Integration**
   - Desktop view: Separate Import and Export buttons in the header
   - Mobile view: Icon-only buttons to save space
   - Both buttons open the same dialog, which provides both functionalities

## Usage

### Basic Usage

```tsx
import { ExcelImportExportDialog } from "@/components/assets/excel-import-export-dialog";

// In your component:
const [isImportExportDialogOpen, setIsImportExportDialogOpen] = useState(false);

const handleImportSuccess = () => {
  // Refresh your data
  refetch();
};

return (
  <>
    <Button onClick={() => setIsImportExportDialogOpen(true)}>
      Import/Export
    </Button>
    
    <ExcelImportExportDialog
      assetType="pc"
      title="PC"
      isOpen={isImportExportDialogOpen}
      onClose={() => setIsImportExportDialogOpen(false)}
      onImportSuccess={handleImportSuccess}
    />
  </>
);
```

### Integration with AssetList

The component is already integrated with the AssetList component and requires no additional setup for basic usage.

## Styling and Design

The component follows the existing design system:
- Uses Shadcn/UI components for consistent styling
- Follows the application's color scheme and typography
- Responsive design that works on mobile and desktop
- Accessible with proper ARIA labels and keyboard navigation
- Consistent with other dialog components in the application

## Error Handling

The component provides comprehensive error handling:
- File selection validation
- API error handling with user-friendly messages
- Network error detection
- Validation error display with specific field information
- Success feedback with detailed information

## Performance Considerations

- Uses React.memo and useCallback for optimization
- Implements proper loading states to prevent UI blocking
- Uses React Query for efficient data fetching and caching
- Lazy loads dialog content only when needed

## Testing

The component has been tested with:
- Build process validation
- TypeScript compilation
- Integration with existing components
- Error state handling
- Success state handling
- Responsive design verification

## Future Improvements

Potential areas for future enhancement:
- Add template download functionality
- Implement progress bars for large file operations
- Add file preview before import
- Implement batch import validation
- Add import history tracking
- Enhance error reporting with row-level details