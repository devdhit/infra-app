const fs = require('fs');
const path = require('path');

// Test the Excel import/export functionality
async function testExcelFunctionality() {
  try {
    console.log('Testing Excel import/export functionality...');
    
    // Check if template files exist
    const templateDir = path.join(__dirname, '..', 'src', 'templates');
    const templates = [
      'PC_Template.xlsx',
      'Laptop_Template.xlsx', 
      'Printer_Template.xlsx',
      'Licenses_Template.xlsx',
      'WarehouseIT_Template.xlsx'
    ];
    
    console.log('Checking template files...');
    for (const template of templates) {
      const templatePath = path.join(templateDir, template);
      if (fs.existsSync(templatePath)) {
        console.log(`✓ ${template} exists`);
      } else {
        console.log(`✗ ${template} not found`);
      }
    }
    
    console.log('\nExcel functionality test completed.');
  } catch (error) {
    console.error('Error testing Excel functionality:', error);
  }
}

testExcelFunctionality();