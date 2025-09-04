# Excel Import Custom Fields Fix

## Problem Description

When importing Excel files with custom fields for assets (PC, Laptop, Printer, License, WarehouseIT), the system was throwing Prisma errors like:

```
Unknown argument `RAM`. Did you mean `id`? Available options are marked with ?.
```

This occurred because custom fields from the Excel file were being treated as regular model fields instead of being properly placed in the `customFields` JSON column.

## Root Cause

The issue was in the Excel import API route (`src/app/api/assets/excel/import/route.ts`). The code was only checking for custom fields that were explicitly defined in the database, but it wasn't handling cases where:

1. Custom fields were present in the Excel data but not yet defined in the database
2. Fields that were not part of the standard model schema were not being properly identified and moved to the `customFields` JSON column

## Solution

We modified the import logic for all asset types to:

1. **Identify custom fields dynamically**: Check all fields in the row data and identify which ones are not part of the standard model schema
2. **Move custom fields to the proper location**: Extract these fields and place them in the `customFields` JSON object
3. **Remove custom fields from row data**: Ensure custom fields are not passed to Prisma create methods as invalid arguments

## Changes Made

### 1. PC Asset Import Logic

Added logic to identify and extract custom fields that are not part of the PC model:

```typescript
// Define the standard PC model fields
const pcModelFields = ['id', 'dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 
  'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'pcName', 'userName', 
  'status', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt'];

// Check if there are any fields in pcRowData that are not part of the PC model
// and treat them as custom fields
for (const [key, value] of Object.entries(pcRowData)) {
  if (!pcModelFields.includes(key)) {
    // Initialize pcCustomFields if not already done
    if (!pcCustomFields) {
      pcCustomFields = {};
    }
    pcCustomFields[key] = value;
    // Remove the field from pcRowData
    delete pcRowData[key];
  }
}
```

### 2. Laptop Asset Import Logic

Similar changes were made for Laptop assets:

```typescript
// Define the standard Laptop model fields
const laptopModelFields = ['id', 'dept', 'barcode', 'sapBarcode', 'dateBuy', 
  'userName', 'email', 'model', 'status', 'tenantId', 'customFields', 'createdAt', 'updatedAt'];

// Check if there are any fields in laptopRowData that are not part of the Laptop model
// and treat them as custom fields
for (const [key, value] of Object.entries(laptopRowData)) {
  if (!laptopModelFields.includes(key)) {
    // Initialize laptopCustomFields if not already done
    if (!laptopCustomFields) {
      laptopCustomFields = {};
    }
    laptopCustomFields[key] = value;
    // Remove the field from laptopRowData
    delete laptopRowData[key];
  }
}
```

### 3. Printer Asset Import Logic

Similar changes were made for Printer assets:

```typescript
// Define the standard Printer model fields
const printerModelFields = ['id', 'dept', 'location', 'ip', 'model', 'color', 
  'barcode', 'sapCode', 'date', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt'];

// Check if there are any fields in printerRowData that are not part of the Printer model
// and treat them as custom fields
for (const [key, value] of Object.entries(printerRowData)) {
  if (!printerModelFields.includes(key)) {
    // Initialize printerCustomFields if not already done
    if (!printerCustomFields) {
      printerCustomFields = {};
    }
    printerCustomFields[key] = value;
    // Remove the field from printerRowData
    delete printerRowData[key];
  }
}
```

### 4. License Asset Import Logic

Similar changes were made for License assets:

```typescript
// Define the standard License model fields
const licenseModelFields = ['id', 'deviceName', 'userName', 'dept', 'productType', 
  'productKey', 'model', 'pc', 'mac', 'ip', 'date', 'updateStatus', 
  'tenantId', 'customFields', 'createdAt', 'updatedAt'];

// Check if there are any fields in licenseRowData that are not part of the License model
// and treat them as custom fields
for (const [key, value] of Object.entries(licenseRowData)) {
  if (!licenseModelFields.includes(key)) {
    // Initialize licenseCustomFields if not already done
    if (!licenseCustomFields) {
      licenseCustomFields = {};
    }
    licenseCustomFields[key] = value;
    // Remove the field from licenseRowData
    delete licenseRowData[key];
  }
}
```

### 5. WarehouseIT Asset Import Logic

Similar changes were made for WarehouseIT assets:

```typescript
// Define the standard WarehouseIT model fields
const warehouseModelFields = ['id', 'dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 
  'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'status', 'note', 
  'tenantId', 'customFields', 'createdAt', 'updatedAt'];

// Check if there are any fields in warehouseRowData that are not part of the WarehouseIT model
// and treat them as custom fields
for (const [key, value] of Object.entries(warehouseRowData)) {
  if (!warehouseModelFields.includes(key)) {
    // Initialize warehouseCustomFields if not already done
    if (!warehouseCustomFields) {
      warehouseCustomFields = {};
    }
    warehouseCustomFields[key] = value;
    // Remove the field from warehouseRowData
    delete warehouseRowData[key];
  }
}
```

## Testing

We created comprehensive tests to verify the fix works correctly:

1. **PC Import Test**: Verified that custom fields like `RAM`, `CPU`, and `IP` are properly extracted and moved to the `customFields` JSON column
2. **License Case Sensitivity Test**: Verified that case sensitivity issues are properly handled

All tests passed successfully, confirming that the fix resolves the original issue.

## Impact

This fix ensures that:

1. Custom fields in Excel imports are properly handled without throwing Prisma errors
2. Data integrity is maintained by placing custom fields in the correct location
3. The system is more robust and can handle dynamic custom fields that may not be predefined
4. Users can successfully import Excel files with custom fields for all asset types

## Verification

To verify the fix, you can:

1. Create an Excel file with custom fields for any asset type
2. Import the file through the Excel import dialog
3. Confirm that the import completes successfully without Prisma errors
4. Verify that custom fields are properly stored in the database and displayed in the UI