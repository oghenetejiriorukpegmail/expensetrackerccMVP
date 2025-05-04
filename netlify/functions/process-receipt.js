// A simplified receipt processing function that doesn't require Google Auth
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
    
    console.log('Received receipt processing request');
    
    // Extract image data
    let imageData = body.imageData;
    if (!imageData) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'No image data provided' })
      };
    }
    
    // Simulate receipt processing with a mock response
    // In a real implementation, you would send this to an AI service
    const processedReceipt = {
      vendor: 'Sample Vendor',
      date: new Date().toISOString().split('T')[0],
      total: Math.floor(Math.random() * 10000) / 100,
      items: [
        { description: 'Item 1', amount: Math.floor(Math.random() * 1000) / 100 },
        { description: 'Item 2', amount: Math.floor(Math.random() * 1000) / 100 }
      ],
      currency: 'USD',
      confidence: 0.85
    };
    
    // Return the processed receipt
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receipt: processedReceipt,
        message: 'Receipt processed successfully (mock data)'
      })
    };
  } catch (error) {
    console.error('Error processing receipt:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to process receipt',
        details: error.message
      })
    };
  }
};