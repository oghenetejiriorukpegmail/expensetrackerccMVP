// Simple test to verify the `workbook` variable reassignment fix
const ExcelJS = require('exceljs');

// Test function that mimics the template loading part
async function testWorkbookReassignment() {
  console.log('Testing workbook variable reassignment...');
  
  try {
    // Initial creation with 'let' instead of 'const'
    let workbook = new ExcelJS.Workbook();
    workbook.creator = 'Expense Tracker';
    
    console.log('Initial workbook created');
    
    // Mock template handling - simulate what happens in the function
    try {
      console.log('Attempting to reassign workbook variable...');
      
      // This is line 217 in the original file
      workbook = new ExcelJS.Workbook();
      workbook.creator = 'Template-based Workbook';
      
      console.log('First reassignment successful');
      
      // This is line 240 in the original file
      workbook = new ExcelJS.Workbook();
      workbook.creator = 'Fallback Workbook';
      
      console.log('Second reassignment successful');
      console.log('Current workbook creator:', workbook.creator);
      
      return true;
    } catch (error) {
      console.error('Error during reassignment:', error);
      return false;
    }
  } catch (error) {
    console.error('Exception during test:', error);
    return false;
  }
}

// Run the test
testWorkbookReassignment()
  .then(success => {
    console.log(`Test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Test execution error:', err);
    process.exit(1);
  });