import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testReceiptUpload() {
  try {
    console.log('Testing receipt upload functionality...');
    
    // Create a test file
    const testFilePath = path.join(process.cwd(), 'test-receipt.txt');
    fs.writeFileSync(testFilePath, 'This is a test receipt file created for testing upload functionality.');
    
    console.log(`Created test file at: ${testFilePath}`);
    
    // 1. Create a test user if not exists
    const testEmail = 'test-user@example.com';
    const testPassword = 'Password123!';
    
    let userId;
    
    try {
      // First, check if user exists
      const { data: existingUsers, error: findError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', testEmail)
        .limit(1);
      
      if (findError) {
        console.error('Error finding existing user:', findError);
      }
      
      if (existingUsers && existingUsers.length > 0) {
        userId = existingUsers[0].id;
        console.log(`Found existing test user with ID: ${userId}`);
      } else {
        // Create new test user
        const { data: authData, error: authError } = await supabase.auth
          .admin.createUser({
            email: testEmail,
            password: testPassword,
            user_metadata: { full_name: 'Test User' },
            email_confirm: true
          });
        
        if (authError) {
          console.error('Error creating test user:', authError);
          return;
        }
        
        userId = authData.user.id;
        console.log(`Created new test user with ID: ${userId}`);
      }
    } catch (userError) {
      console.error('Error with test user setup:', userError);
      return;
    }
    
    // 2. Upload the file to storage as the service account
    console.log('Uploading test receipt to storage...');
    
    const fileBuffer = fs.readFileSync(testFilePath);
    const fileBlob = new Blob([fileBuffer], { type: 'text/plain' });
    const fileName = `receipts/test/${Date.now()}_test-receipt.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(fileName, fileBlob, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading file as service account:', uploadError);
      return;
    }
    
    console.log('Upload successful:', uploadData);
    
    // Get the URL
    const { data: urlData } = supabase.storage
      .from('receipts')
      .getPublicUrl(uploadData.path);
    
    console.log('File accessible at:', urlData.publicUrl);
    
    // 3. Create a test expense record for the test user
    console.log('\nCreating a test expense record...');
    
    // First, ensure user has a trip
    let tripId;
    
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    if (tripsError) {
      console.error('Error checking for existing trips:', tripsError);
    }
    
    if (trips && trips.length > 0) {
      tripId = trips[0].id;
      console.log(`Found existing trip with ID: ${tripId}`);
    } else {
      // Create a trip for the user
      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert({
          user_id: userId,
          name: 'Test Trip',
          description: 'Trip created for testing expense uploads',
          status: 'planned',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          location: 'Test Location'
        })
        .select()
        .single();
      
      if (tripError) {
        console.error('Error creating test trip:', tripError);
        return;
      }
      
      tripId = newTrip.id;
      console.log(`Created new trip with ID: ${tripId}`);
    }
    
    // Create an expense record with the receipt URL
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        user_id: userId,
        expense_type: 'other',
        amount: 42.00,
        currency: 'USD',
        vendor: 'Test Vendor',
        location: 'Test Location',
        date: new Date().toISOString().split('T')[0],
        description: 'Test expense created for upload testing',
        receipt_url: urlData.publicUrl
      })
      .select()
      .single();
    
    if (expenseError) {
      console.error('Error creating test expense:', expenseError);
    } else {
      console.log('Created test expense with receipt:', expenseData);
    }
    
    // 4. Check if the user can access their expense record
    console.log('\nChecking if user can access their expense record...');
    
    // First, sign in as the test user
    const { data: signInData, error: signInError } = await supabase.auth
      .signInWithPassword({
        email: testEmail,
        password: testPassword
      });
    
    if (signInError) {
      console.error('Error signing in as test user:', signInError);
      return;
    }
    
    // Create a client instance with the user's session
    const userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${signInData.session.access_token}`
        }
      }
    });
    
    // Try to fetch the user's expenses
    const { data: userExpenses, error: userExpenseError } = await userSupabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId);
    
    if (userExpenseError) {
      console.error('Error fetching expenses as user:', userExpenseError);
    } else {
      console.log(`User can access ${userExpenses.length} expense records.`);
    }
    
    // Try to access the receipt file
    try {
      const { data: userDownload, error: userDownloadError } = await userSupabase.storage
        .from('receipts')
        .download(uploadData.path);
      
      if (userDownloadError) {
        console.error('Error downloading receipt as user:', userDownloadError);
      } else {
        console.log('User can access their receipt file successfully!');
      }
    } catch (downloadError) {
      console.error('Error trying to download receipt:', downloadError);
    }
    
    // Clean up the test file
    try {
      fs.unlinkSync(testFilePath);
      console.log('Deleted test file');
    } catch (unlinkError) {
      console.error('Error deleting test file:', unlinkError);
    }
    
    console.log('\nUpload testing completed!');
    
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
}

// Run the test
testReceiptUpload();