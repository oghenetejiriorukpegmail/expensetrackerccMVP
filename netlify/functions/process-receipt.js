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
    
    // Sample receipt templates based on common receipt types
    const receiptTemplates = [
      {
        // Restaurant receipt
        vendor: 'Tasty Bites Restaurant',
        expenseType: 'meals',
        currency: 'USD',
        items: [
          { name: 'Chicken Pasta', price: 14.99 },
          { name: 'Caesar Salad', price: 8.95 },
          { name: 'Sparkling Water', price: 3.50 }
        ],
        location: {
          city: 'San Francisco',
          state: 'CA',
          country: 'USA'
        },
        taxAmount: 2.48
      },
      {
        // Hotel receipt
        vendor: 'Grand Hotel & Suites',
        expenseType: 'accommodation',
        currency: 'USD',
        items: [
          { name: 'Standard Room - 1 Night', price: 189.00 },
          { name: 'Room Service', price: 42.75 },
          { name: 'WiFi Access', price: 0.00 }
        ],
        location: {
          city: 'New York',
          state: 'NY',
          country: 'USA'
        },
        taxAmount: 20.87
      },
      {
        // Office supplies receipt
        vendor: 'Office Supplies Plus',
        expenseType: 'office',
        currency: 'USD',
        items: [
          { name: 'Printer Paper (500 sheets)', price: 12.99 },
          { name: 'Ink Cartridge', price: 34.50 },
          { name: 'Stapler', price: 8.75 }
        ],
        location: {
          city: 'Chicago',
          state: 'IL',
          country: 'USA'
        },
        taxAmount: 5.10
      },
      {
        // Transportation receipt
        vendor: 'City Taxi Services',
        expenseType: 'transportation',
        currency: 'USD',
        items: [
          { name: 'Airport to Downtown', price: 45.00 }
        ],
        location: {
          city: 'Seattle',
          state: 'WA',
          country: 'USA'
        },
        taxAmount: 4.05
      }
    ];
    
    // Pick a random template
    const template = receiptTemplates[Math.floor(Math.random() * receiptTemplates.length)];
    
    // Calculate total based on items and tax
    const subtotal = template.items.reduce((sum, item) => sum + item.price, 0);
    const taxAmount = template.taxAmount || subtotal * 0.09; // Default 9% tax if not specified
    const total = subtotal + taxAmount;
    
    // Create a processed receipt with small random variations
    const processedReceipt = {
      vendor: template.vendor,
      date: new Date().toISOString().split('T')[0],
      total: Math.round(total * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      items: template.items,
      currency: template.currency,
      expenseType: template.expenseType,
      location: template.location,
      taxAmount: Math.round(taxAmount * 100) / 100,
      confidence: 0.85 + (Math.random() * 0.1) // Random confidence between 0.85 and 0.95
    };
    
    // Add detailed Document AI simulation info to the logs
    console.log('Document AI Simulation Results:', JSON.stringify({
      vendor: {
        text: processedReceipt.vendor,
        confidence: processedReceipt.confidence
      },
      date: {
        text: processedReceipt.date,
        confidence: processedReceipt.confidence * 0.98
      },
      total: {
        text: `$${processedReceipt.total.toFixed(2)}`,
        confidence: processedReceipt.confidence * 0.99
      },
      items: {
        count: processedReceipt.items.length,
        confidence: processedReceipt.confidence * 0.92
      },
      location: processedReceipt.location,
      expenseType: processedReceipt.expenseType
    }, null, 2));
    
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