# How to Fix User Settings RLS Issues

There are currently Row Level Security (RLS) policy issues with the `user_settings` table that are causing 401 Unauthorized errors in the application. This document provides instructions on how to fix these issues.

## Option 1: Using Supabase Studio SQL Editor

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project (with URL: https://wrahnhyytxtddwngwnvf.supabase.co)
3. Navigate to the SQL Editor
4. Create a new SQL query
5. Copy and paste the content of the `fix-user-settings.sql` file into the editor
6. Run the query
7. Verify the changes by checking the RLS policies on the `user_settings` table

## Option 2: Using Supabase CLI (if installed)

If you have the Supabase CLI installed, you can run:

```bash
supabase db push fix-user-settings.sql
```

## Option 3: Using the Dashboard API

You can also apply these changes using the Supabase API:

1. Go to the API section in Supabase Dashboard
2. Use the Table Editor to:
   - Create the `user_settings` table if it doesn't exist
   - Configure the RLS policies manually as described in the SQL file

## Verification

After applying the fixes, you should verify:

1. The `user_settings` table exists in the public schema
2. RLS is enabled on the table
3. The following policies exist:
   - "Users can view their own settings" (for SELECT)
   - "Users can update their own settings" (for UPDATE)
   - "Users can insert their own settings" (for INSERT)
   - "Users can delete their own settings" (for DELETE)

Once the changes are applied, the 401 errors in the application should disappear.