# Department-Based Excel Export Functionality

## Overview

The IT Asset Management System now supports department-based Excel export functionality, allowing users to export assets filtered by department. This feature provides two main export options:

1. **Export All Departments**: Export all assets of a specific type regardless of department
2. **Export by Department**: Export only assets belonging to a specific department

## Features

### Export Options

1. **All Assets**: Export all assets of the selected type
2. **By Department**: Export assets filtered by a specific department
3. **Selected Items**: Export only the currently selected assets (existing functionality)

### Supported Departments

The system includes predefined departments for filtering:
- IT Department
- HR Department
- Finance Department
- Operations Department

## Implementation Details

### Frontend Component

The [ExcelExportDialog](file:///d:/app-infra/src/components/assets/excel-export-dialog.tsx#L30-L135) component has been updated to include the new "By Department" option:

1. **Radio Group Options**:
   - "All [asset type]" - Exports all assets
   - "By Department" - Enables department selection
   - "Selected items" - Exports only selected items

2. **Department Selection**:
   - When "By Department" is selected, a dropdown appears
   - Users can select from predefined departments
   - Export button is disabled until a department is selected

### Backend API

The export API route (`/api/assets/excel/export`) has been enhanced to support department filtering:

1. **New Query Parameter**:
   - `dept` - Specifies the department to filter by

2. **Database Queries**:
   - Added department filtering to Prisma queries for PC, Laptop, Printer, and License assets
   - Warehouse assets do not have department fields, so no filtering is applied

### Example API Usage

```
# Export all PC assets
GET /api/assets/excel/export?assetType=pc

# Export PC assets for IT department
GET /api/assets/excel/export?assetType=pc&dept=IT

# Export selected PC assets
GET /api/assets/excel/export?assetType=pc&selectedIds=["id1","id2","id3"]
```

## User Interface

### Export Dialog

The export dialog now includes three radio button options:
1. "All [asset type]" - Default option, exports all assets
2. "By Department" - Shows department selection dropdown when selected
3. "[N] selected items" - Available when assets are selected in the table

When "By Department" is selected, a dropdown appears with the following options:
- IT Department
- HR Department
- Finance Department
- Operations Department

### Validation

- Export button is disabled when "By Department" is selected but no department is chosen
- Export button is disabled when "Selected items" is selected but no items are selected
- Appropriate loading states and success/error messages are displayed

## Technical Notes

### Database Schema

Departments are stored as string fields in the following tables:
- `PC.dept`
- `Laptop.dept`
- `Printer.dept`
- `License.dept` (optional field)

### Prisma Queries

Department filtering is implemented using Prisma's conditional querying:
```typescript
where: { 
  tenantId: user.tenantId,
  ...(selectedIdArray ? { id: { in: selectedIdArray } } : {}),
  ...(department ? { dept: department } : {})
}
```

### Localization

New translation keys have been added for both English and Chinese:
- `assets.excel.export.byDept`
- `assets.excel.export.department`
- `assets.excel.export.selectDept`
- `assets.excel.export.dept.it`
- `assets.excel.export.dept.hr`
- `assets.excel.export.dept.finance`
- `assets.excel.export.dept.operations`
- `assets.excel.export.info.byDept`

## Usage

### Exporting by Department

1. Navigate to any asset list page (PC, Laptop, Printer, License)
2. Click the "Export" button
3. Select the "By Department" radio option
4. Choose a department from the dropdown
5. Click "Export Data" to download the Excel file

### Exporting All Assets

1. Navigate to any asset list page
2. Click the "Export" button
3. Ensure "All [asset type]" is selected (default)
4. Click "Export Data" to download the Excel file

## Future Enhancements

1. **Dynamic Department List**: Fetch departments from the database instead of using predefined options
2. **Multi-department Export**: Allow selection of multiple departments
3. **Custom Department Filtering**: Allow users to enter custom department names