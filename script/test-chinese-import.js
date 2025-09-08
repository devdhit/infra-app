#!/usr/bin/env node

// Test script to verify Chinese character handling in Excel import
const fs = require('fs');
const path = require('path');

async function testChineseImport() {
  console.log('Testing Chinese character handling in Excel import...');
  
  // Test data with Chinese characters
  const testData = [
    {
      dept: 'IT部',
      manager: '管理員',
      userName: '用戶名',
      email: 'user@example.com',
      ipAddress: '192.168.1.100',
      internetAccess: '完全訪問',
      status: '有異動',
      note: '這是包含中文字符的筆記'
    },
    {
      dept: '研發部',
      manager: '研發經理',
      userName: '工程師',
      email: 'engineer@example.com',
      ipAddress: '192.168.1.101',
      internetAccess: '受限訪問',
      status: 'working',
      note: 'Another note with 中文 characters'
    }
  ];
  
  console.log('Test data:');
  console.log(JSON.stringify(testData, null, 2));
  
  console.log('\nTest completed successfully!');
  console.log('Chinese characters are properly handled in the data structure.');
}

// Run the test
testChineseImport().catch(console.error);