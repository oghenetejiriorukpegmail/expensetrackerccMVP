// Netlify function to test AI provider connections
const { testDocumentAIConnection, testOpenRouterConnection } = require('../../utils/ai-connection-tester.cjs');

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