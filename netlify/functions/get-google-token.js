const fs = require('fs');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');

// Handler for Google Document AI authentication
exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse the request body
    const body = JSON.parse(event.body || '{}');
    
    console.log('Received request for Google authentication token');
    
    // In Netlify, we should use environment variables directly
    let credentials;
    
    // Try to get credentials from environment variables
    if (process.env.GOOGLE_CREDENTIALS) {
      console.log('Using credentials from GOOGLE_CREDENTIALS environment variable');
      try {
        credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        console.log('Successfully parsed credentials from environment');
      } catch (parseError) {
        console.error('Failed to parse credentials from environment:', parseError);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Failed to parse credentials from environment', 
            details: parseError.message 
          })
        };
      }
    } 
    // If no direct credentials, try to construct from individual environment variables
    else if (process.env.GOOGLE_PROJECT_ID && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_CLIENT_EMAIL) {
      console.log('Constructing credentials from individual environment variables');
      try {
        credentials = {
          type: 'service_account',
          project_id: process.env.GOOGLE_PROJECT_ID,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
        };
        console.log('Successfully constructed credentials');
      } catch (error) {
        console.error('Failed to construct credentials:', error);
        return {
          statusCode: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            error: 'Failed to construct credentials from environment variables', 
            details: error.message 
          })
        };
      }
    } else {
      console.error('No Google credentials found in environment variables');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'No Google credentials found. Set GOOGLE_CREDENTIALS or individual credential environment variables.'
        })
      };
    }
    
    // Define scopes needed for Document AI
    const SCOPES = [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/cloud-vision'
    ];
    
    try {
      console.log('Credential type found:', credentials ? credentials.type || 'unknown' : 'none');
      console.log('Project ID:', credentials ? credentials.project_id || 'not found' : 'none');
      console.log('Client email found:', credentials ? (credentials.client_email ? 'yes' : 'no') : 'none');
      console.log('Private key found:', credentials ? (credentials.private_key ? 'yes' : 'no') : 'none');
      
      // Create a new GoogleAuth instance with the credentials from environment
      const auth = new GoogleAuth({
        credentials: credentials,
        scopes: SCOPES
      });
      
      console.log('Created GoogleAuth instance with scopes:', SCOPES.join(', '));
      
      // Get the client
      const client = await auth.getClient();
      
      // Get access token
      const tokenResponse = await client.getAccessToken();
      
      if (!tokenResponse.token) {
        throw new Error('Failed to retrieve access token');
      }
      
      console.log('Successfully generated Google OAuth2 token');
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_token: tokenResponse.token,
          token_type: 'Bearer',
          expires_in: 3600,
          project_id: body.projectId || credentials.project_id,
          processor_id: body.processorId || process.env.GOOGLE_PROCESSOR_ID || credentials.processor_id
        })
      };
    } catch (authError) {
      console.error('Error generating Google OAuth2 token:', authError);
      
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
      
      console.log('Document AI access only - no fallback mechanisms enabled.');
      
      // For other errors, return error with appropriate status code
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: `Failed to authenticate with Google: ${errorMessage}` 
        })
      };
    }
  } catch (error) {
    console.error('Error in token generation:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to generate auth token',
        details: error.message
      })
    };
  }
};