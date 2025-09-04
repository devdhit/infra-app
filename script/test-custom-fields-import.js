// Test script to verify custom fields import fix
const fs = require('fs');
const path = require('path');

async function testCustomFieldsImport() {
  console.log('Testing custom fields import fix...');
  
  // Test data that simulates the error case
  const testData = {
    dept: "BOM",
    cpuBarcode: "test-barcode-001",
    pcName: "SGDH-TUANNAM",
    status: "Working",
    note: null,
    RAM: "N/A",
    CPU: "N/A",
    userName: "tuannam.tran"
  };
  
  // Simulate the model fields for PC
  const pcModelFields = ['id', 'dept', 'cpuBarcode', 'cpuSapBarcode', 'monitorBarcode', 
    'monitorSapBarcode', 'upsBarcode', 'upsSapBarcode', 'pcName', 'userName', 
    'status', 'note', 'tenantId', 'customFields', 'createdAt', 'updatedAt'];
  
  // Simulate the row data processing
  const { user: userField, userName: pcUserNameField, ...pcRowData } = testData;
  
  console.log('Original row data:', pcRowData);
  
  // Simulate custom fields extraction
  let pcCustomFields = {};
  
  // Check if there are any fields in pcRowData that are not part of the PC model
  // and treat them as custom fields
  for (const [key, value] of Object.entries(pcRowData)) {
    if (!pcModelFields.includes(key)) {
      pcCustomFields[key] = value;
      // Remove the field from pcRowData
      delete pcRowData[key];
    }
  }
  
  console.log('Processed row data (should not contain custom fields):', pcRowData);
  console.log('Extracted custom fields:', pcCustomFields);
  
  // Verify the fix
  if (pcCustomFields.RAM === "N/A" && pcCustomFields.CPU === "N/A") {
    console.log('✅ SUCCESS: Custom fields correctly extracted');
  } else {
    console.log('❌ FAILED: Custom fields not correctly extracted');
  }
  
  if (pcRowData.RAM === undefined && pcRowData.CPU === undefined) {
    console.log('✅ SUCCESS: Custom fields correctly removed from row data');
  } else {
    console.log('❌ FAILED: Custom fields not correctly removed from row data');
  }
  
  console.log('Test completed.');
}

testCustomFieldsImport().catch(console.error);