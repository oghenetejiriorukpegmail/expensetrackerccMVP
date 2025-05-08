// Script to create a test expense with description
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

async function createTestExpense() {
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Creating test expense with description...');
  
  // Get a user ID and trip ID from an existing expense
  const { data: existingExpense } = await supabase
    .from('expenses')
    .select('user_id, trip_id')
    .limit(1)
    .single();
  
  if (!existingExpense) {
    console.error('No existing expenses found to reference user_id and trip_id');
    return;
  }
  
  const userId = existingExpense.user_id;
  const tripId = existingExpense.trip_id;
  
  console.log(`Using user_id: ${userId} and trip_id: ${tripId}`);
  
  // Create a test expense with a detailed description
  const { data: newExpense, error: createError } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      trip_id: tripId,
      expense_type: 'meals',
      amount: 45.99,
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      description: 'Business lunch with client discussing new project requirements',
      vendor: 'Olive Garden',
      location: 'Seattle',
      receipt_extracted: true
    })
    .select()
    .single();
  
  if (createError) {
    console.error('Error creating test expense:', createError);
    return;
  }
  
  console.log('Created test expense with description:', newExpense);
  
  // Create another expense with different description
  const { data: secondExpense, error: secondError } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      trip_id: tripId,
      expense_type: 'transportation',
      amount: 32.50,
      currency: 'USD',
      date: new Date().toISOString().split('T')[0],
      description: 'Taxi ride to airport for business trip to Chicago',
      vendor: 'Yellow Cab',
      location: 'Seattle',
      receipt_extracted: true
    })
    .select()
    .single();
  
  if (secondError) {
    console.error('Error creating second test expense:', secondError);
    return;
  }
  
  console.log('Created second test expense with description:', secondExpense);
}

createTestExpense().catch(err => {
  console.error('Error in create test expense script:', err);
});