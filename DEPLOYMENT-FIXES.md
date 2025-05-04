# Deployment Fixes for Expense Tracker App

This document contains instructions for fixing two persistent issues in the deployed application:

## 1. User Settings RLS Policy Issues (401 Unauthorized errors)

The application is experiencing 401 Unauthorized errors when trying to access user settings due to Row-Level Security (RLS) policy issues.

### Solution:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project (with URL: https://wrahnhyytxtddwngwnvf.supabase.co)
3. Navigate to the SQL Editor
4. Create a new SQL query
5. Copy and paste the content of the `fix-user-settings-v2.sql` file into the editor
6. Run the query
7. Verify the changes by checking the RLS policies on the `user_settings` table

If you want to check if the fix worked:
1. Go to the Table Editor in Supabase dashboard
2. Select the `user_settings` table
3. Go to the "Policies" tab
4. Verify that the following policies exist and are enabled:
   - "Users can view their own settings"
   - "Users can update their own settings"
   - "Users can insert their own settings"
   - "Users can delete their own settings"
   - "Service roles can do anything"

## 2. Document AI "Invalid Image Content" Errors

Google Document AI is returning "Invalid image content" errors when trying to process receipt images or PDFs.

### Solution:

The code changes to fix this issue include:

1. Better MIME type detection:
   - Special handling for PDFs with separate processing pipeline
   - Standardized image format (PNG) for better compatibility
   - Proper base64 padding and validation

2. Optimized Document AI requests:
   - Document-type specific processing options
   - Enhanced OCR configuration
   - Better error handling with meaningful user feedback

3. Client-side fallback:
   - User-friendly error messages
   - Automatic fallback to Netlify serverless functions
   - Improved error recovery

### To Deploy These Changes:

1. Deploy the updated code to Netlify
2. Make sure the environment variables are properly set:
   - `GOOGLE_CREDENTIALS` (JSON string of service account credentials)
   - `GOOGLE_PROJECT_ID`
   - `GOOGLE_PROCESSOR_ID`

## Testing the Fixes

1. **User Settings Issue**:
   - After applying the SQL fix, log into the application
   - Go to the Settings page
   - Try to update preferences
   - The 401 errors should no longer appear in the console

2. **Document AI Issue**:
   - Upload a receipt image or PDF
   - Check the logs in Netlify Functions
   - The system should now correctly identify the document type
   - If Document AI still can't process a specific document, the fallback mechanism will provide a more helpful message

## Additional Notes

If you're still experiencing issues with certain receipt formats, consider:

1. Converting images to PDF first (often more reliable)
2. Ensuring high image quality (300 DPI or higher)
3. Using images with good lighting and clear text
4. Checking that the Google Document AI processor is configured for receipt processing