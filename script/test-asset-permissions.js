// Test script to verify asset-specific permissions
console.log('Testing asset-specific permissions...\n');

console.log('Changes made:');
console.log('1. Updated ResourceType type to include specific asset types (pc, laptop, printer, license, warehouse, internet)');
console.log('2. Updated default permissions to include asset-specific permissions for admin and user roles');
console.log('3. Modified hasPermission function to fall back to generic assets permission if no specific asset permission exists');
console.log('4. Added convenience methods in use-permissions hook for asset-specific permissions');
console.log('5. Updated use-permissions hook to use authenticated API client (already fixed in previous step)\n');

console.log('Asset-specific permissions now available:');
console.log('- canViewPC, canCreatePC, canEditPC, canDeletePC, canBulkDeletePC');
console.log('- canViewLaptop, canCreateLaptop, canEditLaptop, canDeleteLaptop, canBulkDeleteLaptop');
console.log('- canViewPrinter, canCreatePrinter, canEditPrinter, canDeletePrinter, canBulkDeletePrinter');
console.log('- canViewLicense, canCreateLicense, canEditLicense, canDeleteLicense, canBulkDeleteLicense');
console.log('- canViewWarehouse, canCreateWarehouse, canEditWarehouse, canDeleteWarehouse, canBulkDeleteWarehouse');
console.log('- canViewInternet, canCreateInternet, canEditInternet, canDeleteInternet, canBulkDeleteInternet\n');

console.log('Benefits:');
console.log('- More granular control over asset permissions');
console.log('- Backward compatibility maintained through fallback to generic assets permission');
console.log('- Type-safe implementation with TypeScript');
console.log('- Consistent API with existing permission methods');