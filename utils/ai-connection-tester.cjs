// CommonJS version of ai-connection-tester for Netlify functions
const https = require('https');

// Helper function to make HTTPS requests
function makeHttpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(responseData);
            resolve({ statusCode: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: responseData });
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

/**
 * Test connection to Google Document AI
 */
async function testDocumentAIConnection() {
  try {
    console.log('Testing connection to Google Document AI...');
    
    // Get configuration from environment
    const projectId = process.env.GOOGLE_PROJECT_ID || 'gen-lang-client-0754899926';
    const processorId = process.env.GOOGLE_PROCESSOR_ID;
    
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
    
    // Get token from environment or through a token service
    // This is simplified for the example
    if (!process.env.GOOGLE_ACCESS_TOKEN) {
      return {
        success: false,
        message: 'No Google access token available. Please check your authentication setup.'
      };
    }
    
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
    
    // Format according to Document AI API
    const location = 'us';
    const url = new URL(`https://us-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };
    
    const response = await makeHttpsRequest(options);
    
    return {
      success: true,
      message: `Successfully connected to Document AI processor: ${response.data.name || processorId}`
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
 */
async function testOpenRouterConnection(apiKey) {
  try {
    console.log('Testing connection to OpenRouter API...');
    
    // Use provided API key or from environment
    const openRouterApiKey = apiKey || process.env.OPENROUTER_API_KEY || "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";
    
    if (!openRouterApiKey) {
      return { 
        success: false, 
        message: 'Missing OpenRouter API key' 
      };
    }
    
    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://expense-tracker.app',
        'X-Title': 'Expense Tracker'
      }
    };
    
    const response = await makeHttpsRequest(options);
    
    if (!response.data || !response.data.data) {
      return {
        success: false,
        message: 'Invalid response from OpenRouter API'
      };
    }
    
    // Check if Qwen model is available
    const qwenModel = response.data.data.find(model => model.id.includes('qwen'));
    
    if (qwenModel) {
      return {
        success: true,
        message: `Successfully connected to OpenRouter API. Qwen model is available.`
      };
    } else {
      const availableModels = response.data.data.slice(0, 3).map(m => m.id).join(', ');
      return {
        success: true,
        message: `Connected to OpenRouter API, but Qwen model may not be available. Available models: ${availableModels}...`
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
async function testAllAIConnections() {
  const documentAIResult = await testDocumentAIConnection();
  const openRouterResult = await testOpenRouterConnection();
  
  return {
    documentAI: documentAIResult,
    openRouter: openRouterResult
  };
}

module.exports = {
  testDocumentAIConnection,
  testOpenRouterConnection,
  testAllAIConnections
};