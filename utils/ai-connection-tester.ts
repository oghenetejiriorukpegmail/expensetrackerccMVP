import { getGoogleAccessToken } from './google-auth';

// Helper to get configuration in both server and client environments
function getConfig() {
  try {
    // For client-side in browser environment
    if (typeof window !== 'undefined') {
      // @ts-ignore - Dynamic import for browser client
      return window.$nuxt?.$config || {
        public: {
          googleProjectId: '',
          googleProcessorId: '',
          openRouterApiKey: ''
        }
      };
    }
    
    // For server-side within Nuxt
    try {
      // @ts-ignore - Dynamic import for server-side Nuxt
      const { useRuntimeConfig } = require('#imports');
      return useRuntimeConfig();
    } catch (e) {
      // Fallback to env vars
      return {
        public: {
          googleProjectId: process.env.GOOGLE_PROJECT_ID || process.env.NUXT_PUBLIC_GOOGLE_PROJECT_ID,
          googleProcessorId: process.env.GOOGLE_PROCESSOR_ID || process.env.NUXT_PUBLIC_GOOGLE_PROCESSOR_ID,
          openRouterApiKey: process.env.OPENROUTER_API_KEY || process.env.NUXT_PUBLIC_OPENROUTER_API_KEY
        }
      };
    }
  } catch (e) {
    // Last resort fallback
    return {
      public: {
        googleProjectId: '',
        googleProcessorId: '',
        openRouterApiKey: ''
      }
    };
  }
}

/**
 * Test connection to Google Document AI
 * @returns Result of the test with status and message
 */
export async function testDocumentAIConnection(): Promise<{success: boolean, message: string}> {
  try {
    console.log('Testing connection to Google Document AI...');
    const config = getConfig();
    
    // Validate configuration
    const projectId = config.public.googleProjectId;
    const processorId = config.public.googleProcessorId;
    
    if (!projectId) {
      return { 
        success: false, 
        message: 'Missing Google Project ID in configuration' 
      };
    }
    
    if (!processorId) {
      return { 
        success: false, 
        message: 'Missing Document AI Processor ID in configuration' 
      };
    }
    
    // Get OAuth2 token
    const accessToken = await getGoogleAccessToken();
    
    if (accessToken === 'FALLBACK_AI_PROVIDER') {
      return { 
        success: false, 
        message: 'Using fallback provider. Document AI is not configured properly.' 
      };
    }
    
    if (!accessToken) {
      return { 
        success: false, 
        message: 'Failed to obtain authentication token for Google Cloud' 
      };
    }

    // Format according to latest documentation
    const location = 'us'; // Change this if using a different region
    const processorUrl = `https://us-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}`;
    
    // Make a GET request to the processor endpoint to verify it exists and is accessible
    const response = await fetch(processorUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      let errorMessage = `Google Document AI returned status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMessage = `Google Document AI error: ${errorData.error.message}`;
        }
      } catch (e) {
        // If JSON parsing fails, use the status message
        errorMessage += `: ${response.statusText}`;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
    
    const processorData = await response.json();
    
    return {
      success: true,
      message: `Successfully connected to Document AI processor: ${processorData.name || processorId}`
    };
  } catch (error) {
    console.error('Error testing Document AI connection:', error);
    return {
      success: false,
      message: `Connection test failed: ${error.message}`
    };
  }
}

/**
 * Test connection to OpenRouter LLM API
 * @param apiKey Optional API key to use for testing (otherwise uses config)
 * @returns Result of the test with status and message
 */
export async function testOpenRouterConnection(apiKey?: string): Promise<{success: boolean, message: string}> {
  try {
    console.log('Testing connection to OpenRouter API...');
    const config = getConfig();
    
    // Use provided API key or get from config
    const openRouterApiKey = apiKey || config.public.openRouterApiKey || "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";
    
    if (!openRouterApiKey) {
      return { 
        success: false, 
        message: 'Missing OpenRouter API key' 
      };
    }
    
    // Make a simple test query
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "https://expense-tracker.app", 
        "X-Title": "Expense Tracker"
      }
    });
    
    if (!response.ok) {
      let errorMessage = `OpenRouter API returned status ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMessage = `OpenRouter API error: ${errorData.error.message}`;
        }
      } catch (e) {
        // If JSON parsing fails, use the status message
        errorMessage += `: ${response.statusText}`;
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
    
    const data = await response.json();
    
    // Check if we have access to the Qwen model
    const qwenModel = data.data?.find((model: any) => model.id.includes('qwen'));
    
    if (qwenModel) {
      return {
        success: true,
        message: `Successfully connected to OpenRouter API. Qwen model is available.`
      };
    } else {
      return {
        success: true,
        message: `Connected to OpenRouter API, but Qwen model may not be available. Available models: ${data.data?.slice(0, 3).map((m: any) => m.id).join(', ')}...`
      };
    }
  } catch (error) {
    console.error('Error testing OpenRouter connection:', error);
    return {
      success: false,
      message: `Connection test failed: ${error.message}`
    };
  }
}

// Create a comprehensive test that checks all AI providers
export async function testAllAIConnections(): Promise<{
  documentAI: {success: boolean, message: string},
  openRouter: {success: boolean, message: string}
}> {
  const documentAIResult = await testDocumentAIConnection();
  const openRouterResult = await testOpenRouterConnection();
  
  return {
    documentAI: documentAIResult,
    openRouter: openRouterResult
  };
}