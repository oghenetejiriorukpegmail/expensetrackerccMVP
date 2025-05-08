// Script to verify expense description extraction and Excel template variable integration
const { createClient } = require('@supabase/supabase-js');
const ExcelJS = require('exceljs');

// Load environment variables 
require('dotenv').config();

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

async function verifyDescriptionExtraction() {
  console.log('Verifying expense description extraction and Excel template integration');
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check if we have expenses with descriptions
  console.log('Checking for expenses with descriptions...');
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .not('description', 'is', null)
    .limit(5);
  
  if (expensesError) {
    console.error('Error fetching expenses:', expensesError);
    return;
  }

  if (!expenses || expenses.length === 0) {
    console.log('No expenses with descriptions found. Creating test expense...');
    
    // Create a test expense with description
    const { data: newExpense, error: createError } = await supabase
      .from('expenses')
      .insert({
        user_id: 'test-user',
        trip_id: null,
        expense_type: 'other',
        amount: 50.00,
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        description: 'Test expense with description for extraction validation',
        vendor: 'Test Vendor',
        receipt_extracted: true
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating test expense:', createError);
      return;
    }
    
    console.log('Created test expense with description:', newExpense);
  } else {
    console.log(`Found ${expenses.length} expenses with descriptions:`);
    expenses.forEach((expense, i) => {
      console.log(`${i+1}. ${expense.description} (${expense.amount} ${expense.currency})`);
    });
  }

  // Test variable extraction for Excel templates
  console.log('\nTesting expense description variables for Excel templates...');
  
  // Simulate the expense descriptions array creation function in excel-generator.js
  const expenseDescriptions = (expenses || []).map(expense => {
    return {
      id: expense.id,
      description: expense.description || `Expense at ${expense.vendor || 'unknown vendor'}`,
      vendor: expense.vendor || '',
      amount: formatCurrency(expense.amount),
      type: expense.expense_type || 'other',
      date: expense.date || ''
    };
  });
  
  // Create test variables object (similar to the one in excel-generator.js)
  const variables = {
    // Description variables
    'expenses.descriptions': expenseDescriptions.map(ed => ed.description).join('; '),
  };
  
  // Add individual expense descriptions with index
  expenseDescriptions.forEach((ed, index) => {
    variables[`expense.${index+1}.description`] = ed.description;
    variables[`expense.${index+1}.vendor`] = ed.vendor;
    variables[`expense.${index+1}.amount`] = ed.amount;
    variables[`expense.${index+1}.type`] = ed.type;
    variables[`expense.${index+1}.date`] = ed.date;
  });
  
  // Test combined variable
  console.log('\nAll descriptions combined:');
  console.log(variables['expenses.descriptions']);
  
  // Test individual variables
  console.log('\nIndividual expense description variables:');
  Object.keys(variables).forEach(key => {
    if (key.includes('description')) {
      console.log(`${key}: ${variables[key]}`);
    }
  });
  
  console.log('\nVerification complete!');
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

verifyDescriptionExtraction().catch(err => {
  console.error('Error in verification script:', err);
});