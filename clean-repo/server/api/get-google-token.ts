import { defineEventHandler, readBody } from 'h3';
import { createError } from 'h3';
import { useRuntimeConfig } from '#imports';
import fs from 'fs';
import path from 'path';
import { getGoogleTokenServer } from '../utils/google-auth-server';

// Handler for Google Document AI authentication
export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const body = await readBody(event);
    
    console.log('Received request for Google authentication token');
    
    // Check if credentials file exists
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                           path.resolve(process.cwd(), 'google_document_ai.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.error('Google credentials file not found:', credentialsPath);
      return createError({
        statusCode: 500,
        statusMessage: 'Credentials file not found'
      });
    }
    
    // Parse credentials
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    // Get the token from our server-side helper
    try {
      console.log('Attempting to generate OAuth2 token...');
      const accessToken = await getGoogleTokenServer();
      
      console.log('OAuth2 token successfully generated');
      
      return {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        project_id: body.projectId || credentials.project_id,
        processor_id: body.processorId || credentials.processor_id
      };
    } catch (authError) {
      console.error('Failed to generate Google auth token:', authError);
      
      // Disable fallback mechanism
      // Check if this is an authentication or credentials error
      // if (authError.message.includes('account not found') || 
      //     authError.message.includes('invalid_grant') ||
      //     authError.message.includes('credentials')) {
      //   console.log('Authentication failed, returning fallback token to trigger alternative AI processing');
      //   
      //   // Return a special token that will trigger the fallback in the client
      //   return {
      //     access_token: 'FALLBACK_AI_PROVIDER',
      //     token_type: 'Bearer',
      //     expires_in: 3600,
      //     fallback: true,
      //     reason: 'Service account authentication failed',
      //     project_id: body.projectId || credentials.project_id,
      //     processor_id: body.processorId || credentials.processor_id
      //   };
      // }
      
      console.log('Document AI access only - no fallback mechanisms enabled.');
      
      // For other errors, return error with appropriate status code
      return createError({
        statusCode: 401,
        statusMessage: `Failed to authenticate with Google: ${authError.message}`
      });
    }
  } catch (error) {
    console.error('Error in token generation:', error);
    return createError({
      statusCode: 500,
      statusMessage: 'Failed to generate auth token'
    });
  }
});