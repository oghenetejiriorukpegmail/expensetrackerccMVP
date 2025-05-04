import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function modifyUploadFunction() {
  try {
    console.log('Updating the upload file function to properly set owner metadata...');
    
    // Updated uploadFile function that sets owner metadata
    const updatedUploadFunction = `
import { createClient } from '@supabase/supabase-js';
import { useRuntimeConfig } from '#app';

/**
 * Create a Supabase client with the credentials from the environment
 * Use this client for custom operations not handled by the Nuxt Supabase module
 */
export const createSupabaseClient = () => {
  const config = useRuntimeConfig();
  
  return createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );
};

/**
 * Function to handle file uploads to Supabase storage
 * @param file File to upload
 * @param path Storage path
 * @param bucket Bucket name
 * @returns URL of the uploaded file
 */
export const uploadFile = async (
  file: File,
  path: string,
  bucket: string = 'receipts'
): Promise<string | null> => {
  try {
    const supabase = createSupabaseClient();
    const fileExt = file.name.split('.').pop();
    const fileName = \`\${path}/\${Date.now()}.\${fileExt}\`;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Upload with custom file options including the owner metadata
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        fileOptions: {
          // This is key - set owner metadata to current user id
          owner: user.id
        }
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Upload error:', error);
    return null;
  }
};

/**
 * Function to download files from Supabase storage
 * @param path File path in storage
 * @param bucket Bucket name
 * @returns Blob of the file
 */
export const downloadFile = async (
  path: string,
  bucket: string = 'receipts'
): Promise<Blob | null> => {
  try {
    const supabase = createSupabaseClient();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Download error:', error);
    return null;
  }
};

/**
 * Function to create a zip file of multiple receipts
 * @param paths Array of file paths
 * @param bucket Bucket name
 * @returns Blob of the zip file
 */
export const createReceiptZip = async (
  paths: string[],
  bucket: string = 'receipts'
): Promise<Blob | null> => {
  // This will be implemented using JSZip
  // Logic will be added in the JSZip utility file
  return null;
};`;

    // Write the updated function to a file
    const fs = require('fs');
    fs.writeFileSync('./utils/supabase.ts', updatedUploadFunction);
    
    console.log('Successfully updated the upload file function with owner metadata support!');
  } catch (error) {
    console.error('Error updating upload function:', error);
  }
}

// Run the update
modifyUploadFunction();