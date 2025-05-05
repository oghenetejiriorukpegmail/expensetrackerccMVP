import { createClient } from '@supabase/supabase-js';
import { useRuntimeConfig } from '#app';

/**
 * Create a Supabase client with the credentials from the environment
 * Use this client for custom operations not handled by the Nuxt Supabase module
 */
/**
 * Get the existing Supabase client from Nuxt if possible,
 * or create a new one with matching configuration if necessary
 */
export const createSupabaseClient = () => {
  try {
    // Try to use the existing Nuxt Supabase client to avoid multiple instances
    const existingClient = useSupabaseClient();
    if (existingClient) {
      return existingClient;
    }
  } catch (error) {
    console.warn('Could not get existing Supabase client, creating a new one');
  }
  
  // Create new client only as fallback with local storage configuration
  const config = useRuntimeConfig();
  
  // Define browser storage wrapper to force persistence
  const customStorage = {
    getItem: (key) => {
      if (typeof window === 'undefined') return null;
      const value = localStorage.getItem(key);
      return value;
    },
    setItem: (key, value) => {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, value);
      // Save to sessionStorage as well for redundancy
      sessionStorage.setItem(key, value);
    },
    removeItem: (key) => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
  };
  
  return createClient(
    config.public.supabaseUrl,
    config.public.supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'supabase-auth',
        storage: typeof window !== 'undefined' ? customStorage : undefined,
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
  bucket: string = 'receipts',
  client?: any  // Allow passing an existing client
): Promise<string | null> => {
  try {
    // Use provided client or create a new one
    const supabase = client || createSupabaseClient();
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;
    
    // Get the current user
    console.log('Checking authentication status before upload');
    
    // We'll skip session refresh and just rely on the middleware to handle auth
    // Just get the current user directly
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return null;
    }
    
    if (!userData || !userData.user) {
      console.error('No authenticated user found');
      return null;
    }
    
    const user = userData.user;
    console.log('Uploading file as user:', user.id);

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      });

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }

    if (!data || !data.path) {
      console.error('Upload succeeded but no data returned');
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL');
      return null;
    }

    console.log('File uploaded successfully:', urlData.publicUrl);
    return urlData.publicUrl;
    
  } catch (error: any) {
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
};