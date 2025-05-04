import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyCriticalFunctionality() {
  console.log('Verifying critical functionality of expense tracker application...');
  
  try {
    // Create a set of promises for all tests to run in parallel
    const testPromises = [
      // Test 1: Check if all required buckets exist
      (async () => {
        console.log('\n--- TEST 1: Checking for required buckets ---');
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error('Error listing buckets:', error);
          return { name: 'Required Buckets Check', passed: false, error };
        }
        
        const requiredBuckets = ['receipts', 'mileage', 'templates'];
        const missingBuckets = requiredBuckets.filter(
          requiredBucket => !buckets.some(bucket => bucket.name === requiredBucket)
        );
        
        if (missingBuckets.length > 0) {
          console.error('Missing required buckets:', missingBuckets);
          return { name: 'Required Buckets Check', passed: false, missingBuckets };
        }
        
        console.log('All required buckets exist');
        return { name: 'Required Buckets Check', passed: true };
      })(),
      
      // Test 2: Check if an authenticated user can upload a file to the receipts bucket
      (async () => {
        console.log('\n--- TEST 2: Testing authenticated user file upload ---');
        
        // Create a test file
        const testFilePath = path.join(process.cwd(), 'test-upload.txt');
        fs.writeFileSync(testFilePath, 'This is a test file for upload verification');
        
        try {
          // Create a test user if not exists
          const testEmail = 'test-upload@example.com';
          const testPassword = 'Password123!';
          
          // Check if the user already exists
          const { data: existingUsers, error: findError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', testEmail)
            .limit(1);
          
          let userId;
          
          if (findError) {
            console.error('Error finding user:', findError);
          }
          
          if (existingUsers && existingUsers.length > 0) {
            userId = existingUsers[0].id;
            console.log(`Found existing test user with ID: ${userId}`);
          } else {
            // Create a new test user
            const { data: authData, error: authError } = await supabase.auth
              .admin.createUser({
                email: testEmail,
                password: testPassword,
                user_metadata: { full_name: 'Test Upload User' },
                email_confirm: true
              });
            
            if (authError) {
              console.error('Error creating test user:', authError);
              return { name: 'Authenticated File Upload Test', passed: false, error: authError };
            }
            
            userId = authData.user.id;
            console.log(`Created new test user with ID: ${userId}`);
          }
          
          // Sign in as the test user
          const { data: signInData, error: signInError } = await supabase.auth
            .signInWithPassword({
              email: testEmail,
              password: testPassword
            });
          
          if (signInError) {
            console.error('Error signing in as test user:', signInError);
            return { name: 'Authenticated File Upload Test', passed: false, error: signInError };
          }
          
          // Create a client instance with the user's session
          const userSupabase = createClient(supabaseUrl, supabaseKey, {
            global: {
              headers: {
                Authorization: `Bearer ${signInData.session.access_token}`
              }
            }
          });
          
          // Upload a file as the authenticated user
          const fileBuffer = fs.readFileSync(testFilePath);
          const fileBlob = new Blob([fileBuffer], { type: 'text/plain' });
          const fileName = `test/upload-test-${Date.now()}.txt`;
          
          const { data: uploadData, error: uploadError } = await userSupabase.storage
            .from('receipts')
            .upload(fileName, fileBlob, {
              contentType: 'text/plain',
              cacheControl: '3600',
              upsert: true
            });
          
          // Clean up test file
          fs.unlinkSync(testFilePath);
          
          if (uploadError) {
            console.error('Error uploading file as authenticated user:', uploadError);
            return { name: 'Authenticated File Upload Test', passed: false, error: uploadError };
          }
          
          console.log('Successfully uploaded file as authenticated user');
          return { name: 'Authenticated File Upload Test', passed: true };
        } catch (error) {
          console.error('Error in upload test:', error);
          return { name: 'Authenticated File Upload Test', passed: false, error };
        }
      })(),
      
      // Test 3: Check if user_settings RLS is configured correctly
      (async () => {
        console.log('\n--- TEST 3: Testing user_settings RLS policies ---');
        
        try {
          // Create a test user with settings
          const testEmail = 'test-settings@example.com';
          const testPassword = 'Password123!';
          
          // Check if the user already exists
          const { data: existingUsers, error: findError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', testEmail)
            .limit(1);
          
          let userId;
          
          if (findError) {
            console.error('Error finding user:', findError);
          }
          
          if (existingUsers && existingUsers.length > 0) {
            userId = existingUsers[0].id;
            console.log(`Found existing test user with ID: ${userId}`);
          } else {
            // Create a new test user
            const { data: authData, error: authError } = await supabase.auth
              .admin.createUser({
                email: testEmail,
                password: testPassword,
                user_metadata: { full_name: 'Test Settings User' },
                email_confirm: true
              });
            
            if (authError) {
              console.error('Error creating test user:', authError);
              return { name: 'User Settings RLS Test', passed: false, error: authError };
            }
            
            userId = authData.user.id;
            console.log(`Created new test user with ID: ${userId}`);
          }
          
          // Ensure the user has settings
          const { data: settingsCheck, error: settingsCheckError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (settingsCheckError && settingsCheckError.code !== 'PGRST116') {
            console.error('Error checking user settings:', settingsCheckError);
          }
          
          // If no settings exist, create them
          if (!settingsCheck || settingsCheckError) {
            const { data: newSettings, error: newSettingsError } = await supabase
              .from('user_settings')
              .insert({
                user_id: userId,
                default_currency: 'EUR',
                mileage_rate: 0.75,
                default_expense_type: 'meals'
              })
              .select()
              .single();
            
            if (newSettingsError) {
              console.error('Error creating user settings:', newSettingsError);
              return { name: 'User Settings RLS Test', passed: false, error: newSettingsError };
            }
            
            console.log('Created new settings for test user:', newSettings);
          }
          
          // Sign in as the test user
          const { data: signInData, error: signInError } = await supabase.auth
            .signInWithPassword({
              email: testEmail,
              password: testPassword
            });
          
          if (signInError) {
            console.error('Error signing in as test user:', signInError);
            return { name: 'User Settings RLS Test', passed: false, error: signInError };
          }
          
          // Create a client instance with the user's session
          const userSupabase = createClient(supabaseUrl, supabaseKey, {
            global: {
              headers: {
                Authorization: `Bearer ${signInData.session.access_token}`
              }
            }
          });
          
          // Try to fetch the user's own settings
          const { data: ownSettings, error: ownSettingsError } = await userSupabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (ownSettingsError) {
            console.error('Error fetching own settings:', ownSettingsError);
            return { name: 'User Settings RLS Test - Own Settings', passed: false, error: ownSettingsError };
          }
          
          console.log('User can access their own settings:', ownSettings ? 'Yes' : 'No');
          
          // Create another test user
          const otherTestEmail = 'test-settings2@example.com';
          const otherTestPassword = 'Password123!';
          
          let otherUserId;
          
          // Check if the other user already exists
          const { data: otherExistingUsers, error: otherFindError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('email', otherTestEmail)
            .limit(1);
          
          if (otherFindError) {
            console.error('Error finding other user:', otherFindError);
          }
          
          if (otherExistingUsers && otherExistingUsers.length > 0) {
            otherUserId = otherExistingUsers[0].id;
            console.log(`Found existing other test user with ID: ${otherUserId}`);
          } else {
            // Create the other test user
            const { data: otherAuthData, error: otherAuthError } = await supabase.auth
              .admin.createUser({
                email: otherTestEmail,
                password: otherTestPassword,
                user_metadata: { full_name: 'Test Settings User 2' },
                email_confirm: true
              });
            
            if (otherAuthError) {
              console.error('Error creating other test user:', otherAuthError);
              return { name: 'User Settings RLS Test', passed: false, error: otherAuthError };
            }
            
            otherUserId = otherAuthData.user.id;
            console.log(`Created new other test user with ID: ${otherUserId}`);
          }
          
          // Ensure the other user has settings too
          const { data: otherSettingsCheck, error: otherSettingsCheckError } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', otherUserId)
            .single();
          
          if (otherSettingsCheckError && otherSettingsCheckError.code !== 'PGRST116') {
            console.error('Error checking other user settings:', otherSettingsCheckError);
          }
          
          // If no settings exist for other user, create them
          if (!otherSettingsCheck || otherSettingsCheckError) {
            const { data: newOtherSettings, error: newOtherSettingsError } = await supabase
              .from('user_settings')
              .insert({
                user_id: otherUserId,
                default_currency: 'GBP',
                mileage_rate: 0.65,
                default_expense_type: 'accommodation'
              })
              .select()
              .single();
            
            if (newOtherSettingsError) {
              console.error('Error creating other user settings:', newOtherSettingsError);
              return { name: 'User Settings RLS Test', passed: false, error: newOtherSettingsError };
            }
            
            console.log('Created new settings for other test user:', newOtherSettings);
          }
          
          // Try to fetch the other user's settings (this should fail with RLS)
          const { data: otherSettings, error: otherSettingsError } = await userSupabase
            .from('user_settings')
            .select('*')
            .eq('user_id', otherUserId)
            .single();
          
          // This should return no rows due to RLS policy
          const rlsWorking = !otherSettings || otherSettingsError;
          
          console.log('User cannot access other user\'s settings:', rlsWorking ? 'Yes (RLS working)' : 'No (RLS NOT working)');
          
          if (!rlsWorking) {
            console.error('RLS policy not working - user could access another user\'s settings!');
            return { name: 'User Settings RLS Test - Other\'s Settings', passed: false, error: 'RLS policy not enforced' };
          }
          
          return { name: 'User Settings RLS Test', passed: true };
        } catch (error) {
          console.error('Error in user settings test:', error);
          return { name: 'User Settings RLS Test', passed: false, error };
        }
      })()
    ];
    
    // Run all tests in parallel
    const results = await Promise.all(testPromises);
    
    // Summarize the results
    console.log('\n=== TEST RESULTS SUMMARY ===');
    let allPassed = true;
    
    results.forEach(result => {
      console.log(`${result.name}: ${result.passed ? 'PASSED ✅' : 'FAILED ❌'}`);
      if (!result.passed) {
        allPassed = false;
      }
    });
    
    // Generate report
    const reportContent = `
# RLS Functionality Verification Report

Generated: ${new Date().toISOString()}

## Test Results

${results.map(result => `
### ${result.name}
* Status: ${result.passed ? 'PASSED ✅' : 'FAILED ❌'}
${!result.passed && result.error ? `* Error: ${JSON.stringify(result.error, null, 2)}` : ''}
`).join('\n')}

## Conclusion

${allPassed 
  ? 'All tests passed. The application appears to be working correctly with the RLS policies in place.' 
  : 'Some tests failed. There may still be issues with the RLS policies that need to be addressed.'}

## Recommended Actions

${allPassed 
  ? '- Continue monitoring the application performance\n- No immediate action required' 
  : '- Review and apply the RLS fixes in rls-fixes.sql\n- Check the Supabase SQL editor for errors'}
`;

    fs.writeFileSync(path.join(process.cwd(), 'rls-verification-report.md'), reportContent);
    console.log('\nGenerated test report: rls-verification-report.md');
    
    console.log(`\nOverall test result: ${allPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
    
    if (allPassed) {
      console.log('🎉 All tests passed! Application appears to be working correctly.');
    } else {
      console.log('⚠️ Some tests failed. Please check the report for details.');
    }
    
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
}

// Run the verification
verifyCriticalFunctionality();