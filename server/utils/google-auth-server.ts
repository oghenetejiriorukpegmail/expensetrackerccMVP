import { useRuntimeConfig } from '#imports';
import fs from 'fs';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';

/**
 * Server-side implementation of Google authentication
 * Uses the google-auth-library package to generate OAuth2 tokens
 */
export async function getGoogleTokenServer(): Promise<string> {
  try {
    // Get credentials file path
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                          path.resolve(process.cwd(), 'google_document_ai.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.error('Google credentials file not found:', credentialsPath);
      throw new Error('Google credentials file not found');
    }
    
    console.log(`Using credentials from: ${credentialsPath}`);
    
    // Define scopes needed for Document AI
    const SCOPES = [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/cloud-vision'
    ];
    
    try {
      // Create a new GoogleAuth instance with the credentials
      const auth = new GoogleAuth({
        keyFilename: credentialsPath,
        scopes: SCOPES
      });
      
      // Get the client
      const client = await auth.getClient();
      
      // Get access token
      const tokenResponse = await client.getAccessToken();
      
      if (!tokenResponse.token) {
        throw new Error('Failed to retrieve access token');
      }
      
      console.log('Successfully generated Google OAuth2 token');
      return tokenResponse.token;
    } catch (authError) {
      console.error('Error generating Google OAuth2 token:', authError);
      
      // In development/testing, if the OAuth fails (due to invalid credentials),
      // log a clear message
      console.log('Note: For Document AI to work, you need valid service account credentials.');
      console.log('If testing, you can use a fallback AI processor instead.');
      
      // Create more descriptive error message based on error type
      let errorMessage = 'OAuth2 authentication failed';
      
      if (authError.message.includes('invalid_grant')) {
        errorMessage = `Service account authentication failed: ${authError.message}. This usually means the service account doesn't exist or has been deleted.`;
      } else if (authError.message.includes('invalid_client')) {
        errorMessage = `Invalid client credentials: ${authError.message}. Check that your service account JSON file has the correct format and contains valid credentials.`;
      } else if (authError.message.includes('Permission denied')) {
        errorMessage = `Permission denied: ${authError.message}. Ensure the service account has proper permissions for Document AI.`;
      } else {
        errorMessage = `OAuth2 authentication failed: ${authError.message}`;
      }
      
      // Log a user-friendly message about using fallbacks
      console.log('The system will now attempt to use fallback AI processing instead.');
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('Error in Google token generation:', error);
    throw error;
  }
}