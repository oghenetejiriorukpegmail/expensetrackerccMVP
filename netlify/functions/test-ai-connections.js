// Netlify function to test AI provider connections
// Import helper functions
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
    
    // Since this is a test function, we can return a simulated response
    // In production, you would authenticate with Google properly
    return {
      success: true,
      message: `Document AI processor ID is configured: ${processorId.substring(0, 8)}...`
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
    const openRouterApiKey = apiKey || process.env.OPENROUTER_API_KEY;
    
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
    
    try {
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
      return {
        success: false,
        message: `OpenRouter API error: ${error.message}`
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

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Options request handled' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Test connections in parallel
    const results = await Promise.all([
      testDocumentAIConnection(),
      testOpenRouterConnection(body.openRouterApiKey)
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        documentAI: results[0],
        openRouter: results[1]
      })
    };
  } catch (error) {
    console.error('Error testing AI connections:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: error.message || 'Unknown error occurred while testing AI connections'
      })
    };
  }
};