# How to Apply Supabase RLS Fixes

This guide provides step-by-step instructions for implementing the Row Level Security (RLS) fixes for the Expense Tracker application.

## Prerequisites

- Access to the Supabase dashboard with admin privileges
- Knowledge of SQL and Supabase RLS concepts

## Steps to Apply Fixes

### 1. Access Supabase SQL Editor

1. Log in to the Supabase dashboard at [https://app.supabase.com](https://app.supabase.com)
2. Select your project: `Expense Tracker`
3. Navigate to the SQL Editor in the left sidebar

### 2. Apply RLS Fixes

1. Open the file `rls-fixes-updated.sql` from this repository
2. Copy the entire contents of the file
3. Paste it into the SQL Editor
4. Click the "Run" button to execute the SQL

The script will:
- Enable RLS on storage.objects table
- Drop any existing conflicting policies
- Create proper policies for each storage bucket
- Set up user_settings table policies
- Add service role bypass policies for administrative functions
- Ensure all required buckets exist

### 3. Verify the Fixes

1. Run the verification script:
   ```
   node verify-rls-changes.js
   ```

2. Check the output and the generated report `rls-verification-report.md`

3. All tests should pass, indicating that:
   - Required buckets exist
   - File uploads work correctly
   - User data isolation is properly enforced

### 4. Additional Configuration Checks

1. Ensure the application environment variables include:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY`

2. Check that the application uses the correct bucket names:
   - `receipts` for receipt files
   - `mileage` for mileage-related images
   - `templates` for Excel templates

### 5. Testing in the Application

1. Test creating a new expense with receipt upload
2. Test viewing user settings
3. Test updating user settings
4. Test mileage tracking with image uploads

### Troubleshooting

If issues persist:

1. Check the Supabase logs for SQL errors
2. Verify that all RLS policies were created by querying:
   ```sql
   SELECT 
     tablename, policyname, permissive, roles, cmd, qual, with_check 
   FROM pg_policies
   WHERE schemaname IN ('public', 'storage')
   ORDER BY tablename, policyname;
   ```

3. Check for any error messages in the browser console
4. Ensure the application is using the latest Supabase JavaScript client

### Support

If you encounter any issues, please:

1. Check the detailed error message
2. Review the application logs
3. Refer to the Supabase documentation for RLS: [https://supabase.com/docs/guides/auth/row-level-security](https://supabase.com/docs/guides/auth/row-level-security)
4. Create an issue in the GitHub repository with the detailed error information