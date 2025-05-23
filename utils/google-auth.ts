// Import runtime config in a way that's compatible with server-side rendering
// and static site generation
let runtimeConfig: any;
try {
  // For client-side
  const { useRuntimeConfig } = require('#app');
  runtimeConfig = useRuntimeConfig();
} catch (e) {
  // For server-side, use environment variables
  runtimeConfig = {
    public: {
      googleProjectId: process.env.GOOGLE_PROJECT_ID || process.env.NUXT_PUBLIC_GOOGLE_PROJECT_ID,
      googleProcessorId: process.env.GOOGLE_PROCESSOR_ID || process.env.NUXT_PUBLIC_GOOGLE_PROCESSOR_ID,
      openRouterApiKey: process.env.OPENROUTER_API_KEY || process.env.NUXT_PUBLIC_OPENROUTER_API_KEY,
      googleApiKey: process.env.GOOGLE_API_KEY || process.env.NUXT_PUBLIC_GOOGLE_API_KEY
    }
  };
}

// Token cache to avoid unnecessary requests
interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

/**
 * Authenticates with Google Cloud using Application Default Credentials
 * @returns Promise with the access token
 */
export async function getGoogleAccessToken(): Promise<string> {
  const config = runtimeConfig;
  
  try {
    // Check if we have a valid cached token
    const now = Date.now();
    if (tokenCache && tokenCache.expiresAt > now) {
      console.log('Using cached Google access token');
      return tokenCache.token;
    }
    
    console.log('Getting fresh Google access token...');
    
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Try the Netlify function first, then fall back to the API endpoint
      const tokenEndpoints = [
        '/.netlify/functions/get-google-token',
        '/api/get-google-token'
      ];
      
      let response;
      let lastError;
      
      // Try each endpoint in order
      for (const endpoint of tokenEndpoints) {
        try {
          console.log(`Attempting to get token from ${endpoint}...`);
          
          const requestBody = {
            projectId: config.public.googleProjectId,
            processorId: config.public.googleProcessorId
          };
          console.log('Request body:', JSON.stringify(requestBody));
          
          response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });
          
          // If the request was successful, break the loop
          if (response.ok) {
            console.log(`Successfully got token from ${endpoint}`);
            break;
          } else {
            const errorText = await response.text();
            lastError = `Status: ${response.status}, Error: ${errorText}`;
            console.warn(`Failed to get token from ${endpoint}: ${lastError}`);
          }
        } catch (fetchError) {
          lastError = fetchError.message;
          console.warn(`Error fetching from ${endpoint}: ${lastError}`);
        }
      }
      
      // If we still don't have a good response, throw an error
      if (!response || !response.ok) {
        throw new Error(`All auth requests failed. Last error: ${lastError}`);
      }
      
      // We already verified response.ok above, so we can proceed to parse the response
      
      const data = await response.json();
      
      // Cache the token
      tokenCache = {
        token: data.access_token,
        expiresAt: now + ((data.expires_in || 3600) * 1000) - 300000 // Expire 5 minutes early
      };
      
      return data.access_token;
    } else {
      // Server-side authentication would use the server helper directly
      console.warn('Client-side auth being used in server context');
      return config.public.googleApiKey;
    }
  } catch (error) {
    console.error('Error getting Google access token:', error);
    throw error;
  }
}

/**
 * Fallback to alternative AI provider when Document AI is unavailable
 * @returns A placeholder token for fallback processing
 */
function useFallbackAIProvider(): string {
  console.log('Using fallback AI provider instead of Document AI');
  // This indicates to the processing pipeline to use alternative providers
  return 'FALLBACK_AI_PROVIDER';
}