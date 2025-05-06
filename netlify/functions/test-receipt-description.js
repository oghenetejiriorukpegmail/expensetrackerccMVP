const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with environment variables
function createSupabaseClient() {
  // Get Supabase credentials from environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    }
  });
}

/**
 * Simple function to make a request to OpenRouter API
 * @param {string} apiKey - The OpenRouter API key
 * @param {object} extractedReceipt - The extracted receipt data
 * @returns {Promise<string>} - The generated description
 */
async function generateReceiptDescription(apiKey, extractedReceipt) {
  if (!apiKey) {
    throw new Error('OpenRouter API key is not provided');
  }
  
  // Skip if receipt is empty or incomplete
  if (!extractedReceipt || !extractedReceipt.vendor) {
    throw new Error('Receipt data is incomplete');
  }
  
  console.log('Generating receipt description using OpenRouter API...');
  
  // Construct a detailed prompt with receipt information
  let prompt = `Generate a concise 1-2 sentence business-appropriate description explaining the purpose of this expense.
  
Receipt Information:
- Vendor: ${extractedReceipt.vendor || 'Unknown'}
- Amount: ${extractedReceipt.amount || 0} ${extractedReceipt.currency || 'USD'}
- Date: ${extractedReceipt.date || 'Unknown'}
- Location: ${typeof extractedReceipt.location === 'object' ? 
  `${extractedReceipt.location.city || ''}, ${extractedReceipt.location.state || ''}, ${extractedReceipt.location.country || ''}` : 
  extractedReceipt.location || 'Unknown'}
- Expense Type: ${extractedReceipt.expenseType || 'Other'}
`;

  // Add items if available
  if (extractedReceipt.items && extractedReceipt.items.length > 0) {
    prompt += '\nPurchased Items:\n';
    extractedReceipt.items.forEach(item => {
      prompt += `- ${item.name}${item.quantity ? ` (Qty: ${item.quantity})` : ''}${item.price ? ` $${item.price}` : ''}\n`;
    });
  }

  prompt += `
Write a professional description that would be appropriate in a business expense report. 
Focus on the business purpose of the expense. Keep it concise (1-2 sentences).
Don't include the specific amount or date in the description.
Don't start with phrases like "This expense is for" or "This receipt is for".
Just provide the description text without any formatting or prefix.`;

  try {
    // Make API request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://expense-tracker.app',
        'X-Title': 'Expense Tracker'
      },
      body: JSON.stringify({
        model: 'qwen/qwen1.5-72b-chat',  // Use Qwen model for high-quality response
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,  // Lower temperature for more focused output
        max_tokens: 100    // Short response
      })
    });
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('OpenRouter description generation error:', errorBody);
      
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle missing or invalid response data
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenRouter');
    }

    // Extract the description from the response
    const description = data.choices[0].message.content.trim();
    console.log('Generated description:', description);
    
    return description;
  } catch (error) {
    console.error('Error generating receipt description:', error);
    throw error;
  }
}

// Main handler for the Netlify function
exports.handler = async (event, context) => {
  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  try {
    // Parse request body
    const body = JSON.parse(event.body);
    
    if (!body || !body.receiptImage) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'No receipt image provided'
        })
      };
    }

    // Get API key from request or default to environment variable
    const apiKey = body.apiKey || process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'OpenRouter API key is not provided'
        })
      };
    }
    
    // Get mock data for testing or extract receipt info
    let receiptData;
    if (body.mockData) {
      // Use provided mock data for testing
      receiptData = body.mockData;
    } else if (body.receiptDetails) {
      // Use pre-extracted receipt details
      receiptData = body.receiptDetails;
    } else {
      // For a real implementation, we would process the image here
      // But that would require Document AI or similar service
      receiptData = {
        vendor: 'Test Vendor',
        amount: 42.99,
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        location: { city: 'Test City', state: 'TS', country: 'USA' },
        expenseType: 'business',
        confidence: 0.95
      };
    }
    
    // Generate description based on receipt data
    const description = await generateReceiptDescription(apiKey, receiptData);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        extractedData: receiptData,
        description,
        message: 'Successfully generated description'
      })
    };
  } catch (error) {
    console.error('Error in function:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.message || 'Unknown error occurred during receipt description test'
      })
    };
  }
};