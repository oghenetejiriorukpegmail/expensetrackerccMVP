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
 * Generate a basic description when AI generation fails
 * @param {object} receipt - The receipt data
 * @returns {string} A basic description
 */
function generateFallbackDescription(receipt) {
  if (!receipt || !receipt.vendor) {
    return "Business expense";
  }
  
  const vendor = receipt.vendor;
  const location = receipt.location && typeof receipt.location === 'object' 
    ? `${receipt.location.city || ''} ${receipt.location.state || ''}`.trim() 
    : (receipt.location || '');
  
  let description = "";
  
  // Handle different expense types
  switch(receipt.expenseType) {
    case 'transportation':
      description = location 
        ? `${vendor} transportation in ${location}` 
        : `${vendor} transportation expense`;
      break;
    case 'meals':
      description = location 
        ? `Business meal at ${vendor} in ${location}` 
        : `Business meal at ${vendor}`;
      break;
    case 'accommodation':
      description = location 
        ? `${vendor} accommodation in ${location}` 
        : `${vendor} accommodation expense`;
      break;
    case 'office':
      description = `Office supplies from ${vendor}`;
      break;
    case 'entertainment':
      description = location 
        ? `Business entertainment at ${vendor} in ${location}` 
        : `Business entertainment at ${vendor}`;
      break;
    default:
      description = location 
        ? `${vendor} business expense in ${location}` 
        : `${vendor} business expense`;
  }
  
  return description;
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
    // Add retry mechanism for the API call
    const maxRetries = 2;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        // Make API request to OpenRouter
        console.log(`Starting OpenRouter API request attempt ${attempt + 1}/${maxRetries + 1}`);
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://expense-tracker.app',
            'X-Title': 'Expense Tracker'
          },
          body: JSON.stringify({
            model: 'qwen/qwen3-30b-a3b:free',  // Use Qwen 3 model (free tier)
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
          
          // If we get a 5xx error or a specific 429 (rate limit), retry
          if (response.status >= 500 || response.status === 429) {
            const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff: 500ms, 1000ms, 2000ms
            console.log(`Retryable error (${response.status}), waiting ${waitTime}ms before retry`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            attempt++;
            continue;
          }
          
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
      } catch (fetchError) {
        // If this is a network error and we have retries left
        if ((fetchError instanceof TypeError || fetchError.message.includes('network')) && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 500;
          console.log(`Network error, waiting ${waitTime}ms before retry: ${fetchError.message}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempt++;
        } else {
          // Either not a network error or out of retries
          throw fetchError;
        }
      }
    }
    
    // If we get here, we've exhausted retries without success
    throw new Error('Failed to get response after all retry attempts');
  } catch (error) {
    console.error('Error generating receipt description:', error);
    
    // Check for specific quota exhaustion errors
    const isQuotaError = error.message?.includes('quota') || 
                          error.message?.includes('rate limit') || 
                          error.message?.includes('429') ||
                          error.status === 429;
    
    // Generate appropriate fallback with user-friendly message
    const fallbackDescription = generateFallbackDescription(extractedReceipt);
    
    if (isQuotaError) {
      console.log('OpenRouter quota exhausted, informing user to try again tomorrow');
      
      // Add the quota message to the receipt data to display to the user
      if (extractedReceipt) {
        extractedReceipt._userMessage = "The free AI quota has been exhausted. Please try again tomorrow or enter a description manually.";
      }
      
      // Return the fallback with additional context
      return `${fallbackDescription} (AI quota exhausted - try again tomorrow)`;
    } else {
      // Regular fallback for other types of errors
      console.log('Using fallback description due to error:', fallbackDescription);
      return fallbackDescription;
    }
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
    
    // Log keys from request body for debugging
    console.log('Request body keys:', Object.keys(body));
    
    // For security, we no longer log or use API keys from the client
    // Only use API keys from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    console.log('Using environment variables for API authentication');
    
    if (!apiKey) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'API key is not configured in server environment variables'
        })
      };
    }
    
    // Check for receipt data from Document AI or receiptImage
    let receiptData;
    
    if (body.documentAiData) {
      console.log('Using receipt data from Document AI');
      receiptData = body.documentAiData;
    } else if (body.receiptDetails) {
      console.log('Using pre-extracted receipt details');
      receiptData = body.receiptDetails;
    } else if (body.mockData) {
      console.log('Using mock data for testing');
      receiptData = body.mockData;
    } else if (!body.receiptImage) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: 'No receipt data or image provided'
        })
      };
    } else {
      // Use receiptImage as a fallback, but log that we should pass processed data instead
      console.log('WARNING: Received raw image instead of processed Document AI data');
      receiptData = {
        vendor: 'Receipt',
        amount: 0,
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        location: { city: '', state: '', country: '' },
        expenseType: 'other',
        confidence: 0.5,
        _fallback: true,
        _fallbackReason: 'Using default data because Document AI data was not provided'
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
    
    // Use fallback description if there's an error
    const fallbackDescription = "Business expense";
    
    return {
      statusCode: 200, // Return 200 to prevent app breaking
      body: JSON.stringify({
        success: true,
        description: fallbackDescription,
        message: 'Using fallback description due to error',
        error: error.message
      })
    };
  }
};