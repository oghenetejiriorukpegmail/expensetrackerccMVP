// Test script for Excel export functionality - CommonJS version
const fs = require('fs');
const excelGenerator = require('./netlify/functions/excel-generator.js');

// Mock environment variables
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://wrahnhyytxtddwngwnvf.supabase.co';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-supabase-service-key';

// Create a mock event object
const mockEvent = {
  httpMethod: 'POST',
  body: JSON.stringify({
    // Option 1: Filter by date range
    startDate: '2023-01-01',
    endDate: '2023-12-31',
  })
};

// Create a mock context object
const mockContext = {};

// Test the handler function
async function testExcelExport() {
  console.log('Testing Excel export function...');
  
  try {
    const response = await excelGenerator.handler(mockEvent, mockContext);
    
    console.log('Response status code:', response.statusCode);
    
    if (response.statusCode === 200) {
      // Save the Excel file to disk for inspection
      const buffer = Buffer.from(response.body, 'base64');
      const outputPath = './test-excel-export-output.xlsx';
      
      fs.writeFileSync(outputPath, buffer);
      console.log(`Excel file successfully generated and saved to: ${outputPath}`);
      console.log(`Generated Excel file size: ${buffer.length} bytes`);
      
      return true;
    } else {
      console.error('Error response:', JSON.parse(response.body));
      return false;
    }
  } catch (error) {
    console.error('Exception during test:', error);
    return false;
  }
}

// Run the test
testExcelExport()
  .then(success => {
    console.log(`Test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
  });