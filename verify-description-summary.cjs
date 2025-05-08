// Script to verify LLM description summary generation
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

// Mock LLM response function
function mockLLMContent(prompt) {
  console.log('Would send this prompt to LLM API:');
  console.log('----------------------------');
  console.log(prompt);
  console.log('----------------------------');
  
  // Simulate an LLM response based on the content of the prompt
  if (prompt.includes('description')) {
    return "These expenses represent business-related activities including client meetings and travel arrangements, with a focus on meals and transportation costs.";
  } else if (prompt.includes('category')) {
    return "The primary spending is on meals and transportation categories, indicating a standard business trip expense pattern with a balanced distribution between client entertainment and travel logistics.";
  } else {
    return "This expense report covers various business expenditures totaling approximately $100, primarily consisting of client meals and transportation services.";
  }
}

async function verifyDescriptionSummary() {
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Verifying LLM description summary generation for Excel templates...');
  
  // Fetch expenses with descriptions
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('*')
    .limit(5);
  
  if (expensesError) {
    console.error('Error fetching expenses:', expensesError);
    return;
  }
  
  // Format functions
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Create expense descriptions array (like in excel-generator.js)
  const expenseDescriptions = expenses.map(expense => ({
    id: expense.id,
    description: expense.description || `Expense at ${expense.vendor || 'unknown vendor'}`,
    vendor: expense.vendor || '',
    amount: formatCurrency(expense.amount),
    type: expense.expense_type || 'other',
    date: expense.date || ''
  }));
  
  console.log('\nTesting description summary generation for LLM:');
  
  // Build the description summary prompt as in excel-generator.js
  const descriptionSummaryPrompt = `Based on these expense descriptions:
${expenseDescriptions.map((ed, i) => `${i+1}. ${ed.description} (${ed.amount})`).join('\n')}

Create a concise 1-2 sentence summary of what these expenses represent collectively. Focus on patterns and purpose.`;
  
  // Get mock LLM response
  const descriptionSummary = mockLLMContent(descriptionSummaryPrompt);
  
  console.log('\nGenerated description summary:');
  console.log(descriptionSummary);
  
  // Add to variables object
  const variables = {
    'llm.description.summary': descriptionSummary,
    'expenses.descriptions': expenseDescriptions.map(ed => ed.description).join('; ')
  };
  
  console.log('\nFinal template variables for descriptions:');
  console.log(JSON.stringify(variables, null, 2));
  
  console.log('\nVerification complete!');
}

verifyDescriptionSummary().catch(err => {
  console.error('Error in verification script:', err);
});