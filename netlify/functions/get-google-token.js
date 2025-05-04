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
    
    // Check if credentials file exists
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                           path.resolve(process.cwd(), 'google_document_ai.json');
    
    let credentials;
    try {
      // Check if credentials file exists in the function environment
      if (!fs.existsSync(credentialsPath)) {
        console.error('Google credentials file not found at path:', credentialsPath);
        
        // Try to use environment variables directly if credentials file is missing
        if (process.env.GOOGLE_CREDENTIALS) {
          console.log('Using credentials from environment variable');
          try {
            credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
          } catch (parseError) {
            console.error('Failed to parse credentials from environment:', parseError);
            return {
              statusCode: 500,
              body: JSON.stringify({ 
                error: 'Failed to parse credentials from environment', 
                details: parseError.message 
              })
            };
          }
        } else {
          return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Credentials file not found and no environment credential provided' })
          };
        }
      } else {
        // Parse credentials from file
        console.log('Reading credentials from file:', credentialsPath);
        credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      }
    } catch (fileError) {
      console.error('Error reading credentials:', fileError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Error reading credentials file', 
          details: fileError.message 
        })
      };
    }
    
    // Define scopes needed for Document AI
    const SCOPES = [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/cloud-vision'
    ];
    
    try {
      let auth;
      
      // Create a new GoogleAuth instance with the credentials
      if (credentials) {
        if (fs.existsSync(credentialsPath)) {
          auth = new GoogleAuth({
            keyFilename: credentialsPath,
            scopes: SCOPES
          });
        } else {
          // Use credentials from environment
          auth = new GoogleAuth({
            credentials: credentials,
            scopes: SCOPES
          });
        }
      } else {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'No valid credentials available' })
        };
      }
      
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