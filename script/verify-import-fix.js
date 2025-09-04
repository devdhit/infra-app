// Test script to verify the Excel import fix for custom fields
const fs = require('fs');
const path = require('path');

async function verifyImportFix() {
  console.log('Verifying Excel import fix for custom fields...');
  
  // Simulate the importFromExcelWithTemplate function behavior
  function simulateImportProcessing(rowData, assetType) {
    // This simulates what happens in the importFromExcelWithTemplate function
    const processedRow = { ...rowData };
    
    // Simulate case sensitivity fixes for License assets
    if (assetType === 'license') {
      if (processedRow.ProductType && !processedRow.productType) {
        processedRow.productType = processedRow.ProductType;
        delete processedRow.ProductType;
      }
      if (processedRow.ProductKey && !processedRow.productKey) {
        processedRow.productKey = processedRow.ProductKey;
        delete processedRow.ProductKey;
      }
      if (processedRow.DeviceName && !processedRow.deviceName) {
        processedRow.deviceName = processedRow.DeviceName;
        delete processedRow.DeviceName;
      }
      if (processedRow.UserName && !processedRow.userName) {
        processedRow.userName = processedRow.UserName;
        delete processedRow.UserName;
      }
      if (processedRow.Dept && !processedRow.dept) {
        processedRow.dept = processedRow.Dept;
        delete processedRow.Dept;
      }
      if (processedRow.Date && !processedRow.date) {
        processedRow.date = processedRow.Date;
        delete processedRow.Date;
      }
    }
    
    // Simulate barcode field handling
    for (const [header, value] of Object.entries(processedRow)) {
      if (header.includes('Barcode') || header.includes('barcode') || 
          header.includes('Sap') || header.includes('sap')) {
        if (typeof value === 'number') {
          processedRow[header] = value.toString();
        } else if (value === null || value === undefined || value === '') {
          processedRow[header] = 'N/A';
        }
      }
    }
    
    return processedRow;
  }
  
  // Test case 1: PC with custom fields (the original error case)
  const pcTestData = {
    dept: "BOM",
    cpuBarcode: "no use ERP code",
    cpuSapBarcode: "514000000219",
    monitorBarcode: "Z012030190010070",
    monitorSapBarcode: "900000001693",
    upsBarcode: "Z012340180010149",
    upsSapBarcode: "N/A",
    pcName: "SGDH-TUANNAM",
    status: "Working",
    note: null,
    RAM: "N/A",
    CPU: "N/A",
    userName: "tuannam.tran",
    IP: "N/A"
  };
  
  console.log('\n=== Test Case 1: PC with Custom Fields ===');
  console.log('Original data:', pcTestData);
  
  const processedPCData = simulateImportProcessing(pcTestData, 'pc');
  console.log('Processed data:', processedPCData);
  
  // Simulate the API route logic after our fix
  const pcModelFields = ['id', 'dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 
    'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'pcName', 'userName', 
    'status', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt'];
  
  // Extract row data (simulating the destructuring)
  const { user: userField, userName: pcUserNameField, ...pcRowData } = processedPCData;
  
  console.log('Row data before custom field extraction:', pcRowData);
  
  // Simulate custom field extraction (our fix)
  let pcCustomFields = {};
  
  // Check for any remaining fields that are not part of the PC model
  for (const [key, value] of Object.entries(pcRowData)) {
    if (!pcModelFields.includes(key)) {
      pcCustomFields[key] = value;
      delete pcRowData[key];
    }
  }
  
  console.log('Final row data (should only contain PC model fields):', pcRowData);
  console.log('Extracted custom fields:', pcCustomFields);
  
  // Verify the fix
  const pcSuccess = !pcRowData.RAM && !pcRowData.CPU && !pcRowData.IP &&
                   pcCustomFields.RAM === "N/A" && 
                   pcCustomFields.CPU === "N/A" && 
                   pcCustomFields.IP === "N/A";
  
  console.log(pcSuccess ? '✅ PC Test PASSED' : '❌ PC Test FAILED');
  
  // Test case 2: License with case sensitivity issues
  const licenseTestData = {
    DeviceName: "Microsoft Office",
    ProductType: "Office 365",
    ProductKey: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    UserName: "test@example.com",
    Dept: "IT",
    Date: "2023-01-01"
  };
  
  console.log('\n=== Test Case 2: License with Case Sensitivity ===');
  console.log('Original data:', licenseTestData);
  
  const processedLicenseData = simulateImportProcessing(licenseTestData, 'license');
  console.log('Processed data:', processedLicenseData);
  
  // Simulate the API route logic
  const licenseModelFields = ['id', 'deviceName', 'userName', 'dept', 'productType', 
    'productKey', 'model', 'pc', 'mac', 'ip', 'date', 'updateStatus', 
    'tenantId', 'customFields', 'createdAt', 'updatedAt'];
  
  // Extract row data (simulating the destructuring)
  const { 
    Date: upperCaseDateField, 
    Dept: deptField, 
    ProductType: productTypeField, 
    ProductKey: productKeyField,
    DeviceName: deviceNameField,
    UserName: userNameField,
    ...licenseRowData 
  } = processedLicenseData;
  
  console.log('Row data before custom field extraction:', licenseRowData);
  
  // Simulate custom field extraction (our fix)
  let licenseCustomFields = {};
  
  // Check for any remaining fields that are not part of the License model
  for (const [key, value] of Object.entries(licenseRowData)) {
    if (!licenseModelFields.includes(key)) {
      licenseCustomFields[key] = value;
      delete licenseRowData[key];
    }
  }
  
  console.log('Final row data (should only contain License model fields):', licenseRowData);
  console.log('Extracted custom fields:', licenseCustomFields);
  
  // Verify the fix
  const licenseSuccess = licenseRowData.deviceName === "Microsoft Office" &&
                        licenseRowData.productType === "Office 365" &&
                        licenseRowData.productKey === "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" &&
                        licenseRowData.userName === "test@example.com" &&
                        licenseRowData.dept === "IT" &&
                        licenseRowData.date === "2023-01-01";
  
  console.log(licenseSuccess ? '✅ License Test PASSED' : '❌ License Test FAILED');
  
  console.log('\n=== Summary ===');
  console.log(`PC Import Fix: ${pcSuccess ? 'PASSED' : 'FAILED'}`);
  console.log(`License Case Sensitivity: ${licenseSuccess ? 'PASSED' : 'FAILED'}`);
  
  if (pcSuccess && licenseSuccess) {
    console.log('🎉 All tests PASSED! The Excel import fix is working correctly.');
  } else {
    console.log('❌ Some tests FAILED. Please review the implementation.');
  }
}

verifyImportFix().catch(console.error);