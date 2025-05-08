/**
 * Netlify function for generating receipt descriptions asynchronously
 * This separates the slow LLM-based description generation from the main receipt processing
 */

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
 * Generate a receipt description using OpenRouter API
 * @param {string} apiKey - The OpenRouter API key
 * @param {object} extractedReceipt - The extracted receipt data
 * @returns {Promise<string>} - The generated description
 */
async function generateAIDescription(apiKey, extractedReceipt) {
  if (!apiKey) {
    throw new Error('OpenRouter API key is not provided');
  }
  
  // Skip if receipt is empty or incomplete
  if (!extractedReceipt || !extractedReceipt.vendor) {
    throw new Error('Receipt data is incomplete');
  }
  
  console.log('Generating receipt description using OpenRouter API...');
  
  // Construct a detailed prompt with receipt information
  let prompt = `IMPORTANT: DO NOT SHOW YOUR REASONING. PROVIDE ONLY THE FINAL OUTPUT.

Write a direct, concise business expense description (1-2 sentences maximum) for:
Vendor: ${extractedReceipt.vendor || 'Unknown'}
Amount: ${extractedReceipt.amount || 0} ${extractedReceipt.currency || 'USD'}
Date: ${extractedReceipt.date || 'Unknown'}
Location: ${typeof extractedReceipt.location === 'object' ? 
  `${extractedReceipt.location.city || ''}, ${extractedReceipt.location.state || ''}, ${extractedReceipt.location.country || ''}` : 
  extractedReceipt.location || 'Unknown'}
Expense Type: ${extractedReceipt.expenseType || 'Other'}
`;

  // Add items if available
  if (extractedReceipt.items && extractedReceipt.items.length > 0) {
    prompt += 'Items: ';
    extractedReceipt.items.forEach((item, index) => {
      prompt += `${item.name}${index < extractedReceipt.items.length - 1 ? ', ' : ''}`;
    });
    prompt += '\n';
  }

  prompt += `
REQUIREMENTS:
- RESPOND ONLY with the final description - NO explanation or reasoning
- Keep it professional and concise (1-2 sentences only)
- Focus on business purpose
- Don't include specific amount or date
- Don't use phrases like "This expense is for"
- Output ONLY the description text without any formatting or prefix.`;

  try {
    // Log the API key (truncated for security)
    const maskedKey = apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}` : 'undefined';
    console.log(`Using OpenRouter API key: ${maskedKey}`);
    
    // Log the request payload (without the prompt for brevity)
    const requestPayload = {
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [{
        role: 'user',
        content: prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt
      }],
      temperature: 0.2,
      max_tokens: 150,
      top_p: 0.7,
      response_format: { "type": "text" },
      extra_body: {
        reasoning: false,
        enable_thinking: false
      }
    };
    console.log('OpenRouter request payload:', JSON.stringify(requestPayload));
    
    // Add retry mechanism for the API call
    const maxRetries = 2;
    let response = null;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        // Make API request to OpenRouter
        console.log(`Starting OpenRouter API request attempt ${attempt + 1}/${maxRetries + 1} at ${new Date().toISOString()}`);
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://expense-tracker.app',
            'X-Title': 'Expense Tracker'
          },
          body: JSON.stringify({
            model: 'mistralai/mistral-7b-instruct:free',  // Using Mistral 7B model (free tier)
            messages: [{
              role: 'user',
              content: prompt
            }],
            temperature: 0.2,     // Lower temperature for more deterministic output
            max_tokens: 150,      // INCREASED TO ALLOW MORE OUTPUT SPACE
            top_p: 0.7,           // More focused sampling
            response_format: { "type": "text" }, // Force plain text output
            stop: ["\n\n"],       // Stop after a reasonable paragraph
            extra_body: {
              reasoning: false,   // Explicitly disable reasoning mode
              enable_thinking: false // Explicitly disable thinking mode
            }
          })
        });
        console.log(`Received OpenRouter API response at ${new Date().toISOString()} with status: ${response.status}`);
        
        // If we get a success response, break out of the retry loop
        if (response.ok) {
          break;
        }
        
        // If we get a 5xx error or a specific 429 (rate limit), retry
        // Otherwise, for 4xx errors, break as they're generally client errors that won't be fixed by retrying
        if (response.status >= 500 || response.status === 429) {
          const waitTime = Math.pow(2, attempt) * 500; // Exponential backoff: 500ms, 1000ms, 2000ms
          console.log(`Retryable error (${response.status}), waiting ${waitTime}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempt++;
        } else {
          // Client error (4xx), not retrying
          console.log(`Non-retryable error status ${response.status}, not retrying`);
          break;
        }
      } catch (fetchError) {
        // Network errors are retryable
        console.error(`Network error on attempt ${attempt + 1}:`, fetchError.message);
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 500;
          console.log(`Waiting ${waitTime}ms before retry`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempt++;
        } else {
          throw fetchError; // Rethrow if we're out of retries
        }
      }
    }
    
    if (!response) {
      throw new Error('Failed to get response after all retry attempts');
    }
    
    // Handle HTTP errors
    if (!response.ok) {
      let errorDetails = '';
      try {
        const errorBody = await response.json();
        errorDetails = JSON.stringify(errorBody);
        console.error('OpenRouter description generation error:', errorDetails);
      } catch (parseError) {
        const errorText = await response.text();
        errorDetails = errorText;
        console.error('OpenRouter error (non-JSON):', errorText);
      }
      
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorDetails}`);
    }

    const data = await response.json();
    
    // Log the full response for debugging
    console.log('OpenRouter API response:', JSON.stringify(data, null, 2));
    
    // Handle missing or invalid response data
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure from OpenRouter:', JSON.stringify(data));
      throw new Error('Invalid response from OpenRouter');
    }

    // Extract the description from the response with more detailed logging
    const message = data.choices[0].message;
    console.log('OpenRouter message:', JSON.stringify(message));
    
    if (!message.content || message.content.trim() === '') {
      console.error('Empty content returned from OpenRouter');
      
      // Generate a simple fallback description rather than failing
      const fallbackDescription = generateFallbackDescription(extractedReceipt);
      console.log('Using fallback description:', fallbackDescription);
      return fallbackDescription;
    }
    
    const description = message.content.trim();
    console.log('Generated description:', description);
    
    return description;
  } catch (error) {
    console.error('Error generating receipt description:', error);
    
    // Generate fallback description instead of failing
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
    console.log('Starting receipt description generation');
    const body = JSON.parse(event.body || '{}');
    const receipt = body.receipt;
    
    if (!receipt) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Receipt data is required' })
      };
    }
    
    console.log('Receipt data received:', JSON.stringify({
      vendor: receipt.vendor,
      amount: receipt.amount,
      date: receipt.date,
      expenseType: receipt.expenseType,
      location: receipt.location,
      items: Array.isArray(receipt.items) ? receipt.items.length : 0
    }));
    
    let description;
    // Check if we should use AI description generation or fallback
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (apiKey && !body.useFallback) {
      try {
        console.log('Attempting AI description generation');
        description = await generateAIDescription(apiKey, receipt);
      } catch (aiError) {
        console.error('AI description generation failed:', aiError);
        description = generateFallbackDescription(receipt);
      }
    } else {
      console.log('Using fallback description generation');
      description = generateFallbackDescription(receipt);
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: description,
        receiptId: receipt.id || body.receiptId,
        isAIGenerated: apiKey && !body.useFallback,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Error in generate-receipt-description handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Failed to generate receipt description',
        details: error.message
      })
    };
  }
};