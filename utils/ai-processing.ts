import { useRuntimeConfig } from '#app';
import { processReceiptWithDocumentAI } from './document-ai';

/**
 * Types for AI processing
 */
export interface ExtractedReceipt {
  vendor?: string;
  amount?: number;
  currency?: string;
  date?: string;
  items?: Array<{
    name: string;
    quantity?: number;
    price?: number;
  }>;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  } | string; // Allow location to be a string or an object
  expenseType?: string;
  taxAmount?: number;
  total?: number;
  confidence: number;
  // Fields to track fallback responses
  _fallback?: boolean;
  _fallbackReason?: string;
  // Technical details for debugging
  _technicalDetails?: {
    error?: string;
    imageFormat?: string;
    mimeType?: string;
    dataLength?: number;
    timestamp?: string;
    attempts?: number;
    [key: string]: any; // Allow any additional technical details
  };
}

export interface ExtractedOdometerReading {
  reading?: number | null;
  date?: string;
  confidence: number;
  // Fields to track fallback responses
  _fallback?: boolean;
  _fallbackReason?: string;
}

export interface AIProcessingError extends Error {
  code: string;
  status?: number;
  details?: string;
  retryable: boolean;
}

/**
 * Create a standardized AI processing error
 */
function createAIError(
  message: string, 
  code: string = 'processing_error',
  status?: number,
  details?: string,
  retryable: boolean = false
): AIProcessingError {
  const error = new Error(message) as AIProcessingError;
  error.code = code;
  error.status = status;
  error.details = details;
  error.retryable = retryable;
  return error;
}

/**
 * Create a standardized fallback receipt response
 * @param reason A description of why the fallback was needed
 * @returns A minimal valid receipt structure
 */
function createFallbackReceipt(reason: string = 'Unknown processing error'): ExtractedReceipt {
  console.warn(`Creating fallback receipt: ${reason}`);
  return {
    vendor: 'Receipt',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    confidence: 0.1,
    expenseType: 'other',
    // Add a field to indicate this is a fallback response
    _fallback: true,
    _fallbackReason: reason
  };
}

/**
 * Create a standardized fallback odometer reading response
 * @param reason A description of why the fallback was needed
 * @returns A minimal valid odometer reading structure
 */
function createFallbackOdometerReading(reason: string = 'Unknown processing error'): ExtractedOdometerReading {
  console.warn(`Creating fallback odometer reading: ${reason}`);
  return {
    reading: null,
    date: new Date().toISOString().split('T')[0],
    confidence: 0.1,
    // Add a field to indicate this is a fallback response
    _fallback: true,
    _fallbackReason: reason
  };
}

/**
 * Configuration for retrying failed operations
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2
};

/**
 * Helper function to retry an operation with exponential backoff
 * @param operation The async function to retry
 * @param isRetryable Function to determine if an error is retryable
 * @param config Retry configuration
 * @returns Result of the operation
 * @throws Error if all retries fail
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  isRetryable: (error: unknown) => boolean = () => true,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;
  let delay = config.initialDelayMs;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // On first attempt, don't log retry message
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms delay...`);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        // Increase delay for next attempt with exponential backoff
        delay = Math.min(delay * config.backoffFactor, config.maxDelayMs);
      }
      
      // Attempt the operation
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      const aiProcessingError = error as AIProcessingError;
      const canRetry = (aiProcessingError.retryable === true && isRetryable(error)) || 
                       (attempt < config.maxRetries && isRetryable(error));
      
      if (!canRetry) {
        console.log('Error is not retryable or max retries reached, re-throwing error');
        throw error;
      }
      
      console.warn(`Operation failed with error: ${aiProcessingError.message || 'Unknown error'}. Retrying...`);
    }
  }
  
  // If we got here, all retries failed
  console.error(`All ${config.maxRetries} retry attempts failed`);
  throw lastError;
}

/**
 * Process a receipt image with AI to extract structured data
 * @param imageUrlOrBase64 URL or base64 string of the receipt image
 * @param retryConfig Optional retry configuration
 * @returns Extracted receipt data
 * @throws AIProcessingError if processing fails
 */
export async function processReceiptWithAI(
  imageUrlOrBase64: string,
  retryConfig?: RetryConfig
): Promise<ExtractedReceipt | null> {
  // Validate input
  if (!imageUrlOrBase64) {
    throw createAIError(
      'No image provided for receipt processing',
      'invalid_input',
      400,
      'The image URL or base64 string is empty',
      false
    );
  }
  
  // Define the operation to be retried
  const processReceipt = async (): Promise<ExtractedReceipt | null> => {
    try {
      console.log('Processing receipt with Document AI only...');
      
      try {
        // Use Google Document AI for receipt processing
        const result = await processReceiptWithDocumentAI(imageUrlOrBase64);
        
        // Validate result
        if (!result) {
          throw createAIError(
            'Failed to extract data from receipt image',
            'extraction_failed',
            500,
            'The Document AI did not return any structured data',
            true
          );
        }
        
        // Check confidence level
        if (result.confidence < 0.4) {
          console.warn('Low confidence in receipt extraction:', result.confidence);
        }
        
        return result;
      } catch (documentAiError) {
        // Try to use Netlify function fallback
        try {
          console.log('Document AI failed, falling back to Netlify function...');
          
          // Dynamically import the Netlify fallback to avoid breaking bundling
          const { processReceiptWithNetlifyFallback } = await import('./netlify-fallback');
          
          // Use Netlify function fallback
          const result = await processReceiptWithNetlifyFallback(imageUrlOrBase64);
          return result;
        } catch (fallbackError) {
          console.error('Netlify fallback also failed:', fallbackError);
          
          // Return a minimal receipt so the UI doesn't break
          console.log('Using minimal fallback receipt');
          return createFallbackReceipt(`Document AI and Netlify fallback both failed: ${fallbackError.message}`);
        }
      }
    } catch (error) {
      // Handle known AI processing errors
      if ((error as AIProcessingError).code) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError || error.message.includes('network')) {
        throw createAIError(
          'Network error when processing receipt',
          'network_error',
          503,
          error.message,
          true
        );
      }
      
      // Handle API rate limiting
      if (error.status === 429 || error.message.includes('rate limit')) {
        throw createAIError(
          'API rate limit exceeded',
          'rate_limit',
          429,
          'Too many requests to the AI service',
          true
        );
      }
      
      // Handle other errors
      console.error('Error processing receipt with Document AI:', error);
      throw createAIError(
        'Failed to process receipt with Document AI',
        'unknown_error',
        500,
        error.message,
        false
      );
    }
  };
  
  // Check if an error is retryable
  const isRetryable = (error: unknown): boolean => {
    const aiError = error as AIProcessingError;
    return !!aiError.retryable || 
           aiError.code === 'network_error' || 
           aiError.code === 'rate_limit' || 
           aiError.code === 'timeout';
  };
  
  // Execute the operation with retries
  return await withRetry(processReceipt, isRetryable, retryConfig || DEFAULT_RETRY_CONFIG);
}

/**
 * Process odometer image with AI to extract reading
 * @param imageUrlOrBase64 URL or base64 string of the odometer image
 * @param retryConfig Optional retry configuration
 * @returns Extracted odometer reading
 * @throws AIProcessingError if processing fails
 */
export async function processOdometerWithAI(
  imageUrlOrBase64: string,
  retryConfig?: RetryConfig
): Promise<ExtractedOdometerReading | null> {
  const config = useRuntimeConfig();
  const useOpenRouter = false; // Disable OpenRouter fallback - only use Document AI
  
  // Validate input
  if (!imageUrlOrBase64) {
    throw createAIError(
      'No image provided for odometer processing',
      'invalid_input',
      400,
      'The image URL or base64 string is empty',
      false
    );
  }
  
  // Define the operation to be retried
  const processOdometer = async (): Promise<ExtractedOdometerReading | null> => {
    try {
      let result;
      
      if (useOpenRouter) {
        result = await processOdometerWithOpenRouter(imageUrlOrBase64);
      } else {
        result = await processOdometerWithGemini(imageUrlOrBase64);
      }
      
      // Validate result
      if (!result) {
        throw createAIError(
          'Failed to extract reading from odometer image',
          'extraction_failed',
          500,
          'The AI model did not return any structured data',
          true
        );
      }
      
      // Check if reading is present
      if (result.reading === undefined || result.reading === null) {
        throw createAIError(
          'No odometer reading found in image',
          'no_reading_found',
          422,
          'The AI model could not identify an odometer reading in the image',
          false
        );
      }
      
      // Check confidence level
      if (result.confidence < 0.5) {
        console.warn('Low confidence in odometer reading extraction:', result.confidence);
      }
      
      return result;
    } catch (error) {
      // Handle known AI processing errors
      if ((error as AIProcessingError).code) {
        throw error;
      }
      
      // Handle network errors
      if (error instanceof TypeError || error.message.includes('network')) {
        throw createAIError(
          'Network error when processing odometer image',
          'network_error',
          503,
          error.message,
          true
        );
      }
      
      // Handle API rate limiting
      if (error.status === 429 || error.message.includes('rate limit')) {
        throw createAIError(
          'API rate limit exceeded',
          'rate_limit',
          429,
          'Too many requests to the AI service',
          true
        );
      }
      
      // Handle other errors
      console.error('Error processing odometer with AI:', error);
      throw createAIError(
        'Failed to process odometer image with AI',
        'unknown_error',
        500,
        error.message,
        false
      );
    }
  };
  
  // Check if an error is retryable
  const isRetryable = (error: unknown): boolean => {
    const aiError = error as AIProcessingError;
    return !!aiError.retryable || 
           aiError.code === 'network_error' || 
           aiError.code === 'rate_limit' || 
           aiError.code === 'timeout';
  };
  
  // Execute the operation with retries
  return await withRetry(processOdometer, isRetryable, retryConfig || DEFAULT_RETRY_CONFIG);
}

/**
 * Process a receipt with OpenRouter API
 * @param imageUrlOrBase64 URL or base64 string of the receipt image
 * @returns Extracted receipt data
 * @throws AIProcessingError if processing fails
 */
async function processWithOpenRouter(
  imageUrlOrBase64: string
): Promise<ExtractedReceipt | null> {
  const config = useRuntimeConfig();
  const apiKey = config.public.openRouterApiKey;
  
  console.log('OpenRouter API Key available:', !!apiKey);
  
  if (!apiKey) {
    throw createAIError(
      'OpenRouter API key is not set',
      'auth_error',
      401,
      'No API key provided for OpenRouter',
      false
    );
  }
  
  // If needed, API keys should be loaded from environment variables via runtime config

  // Handle image processing
  let imageContent;
  try {
    if (imageUrlOrBase64.startsWith('data:')) {
      // It's already a base64 string
      imageContent = imageUrlOrBase64;
    } else {
      // It's a URL, fetch the image and convert to base64
      const response = await fetch(imageUrlOrBase64);
      
      if (!response.ok) {
        throw createAIError(
          `Failed to fetch image: ${response.status} ${response.statusText}`,
          'image_fetch_error',
          response.status,
          'Could not retrieve the image from the provided URL',
          true
        );
      }
      
      const blob = await response.blob();
      imageContent = await blobToBase64(blob);
    }
  } catch (error) {
    if ((error as AIProcessingError).code) {
      throw error;
    }
    throw createAIError(
      'Error processing image',
      'image_processing_error',
      500,
      error.message,
      true
    );
  }

  // Create prompt with detailed instructions for reliable extraction
  const prompt = `
    You are an expert in extracting information from receipts. 
    Analyze this receipt image and extract the following information in JSON format:
    - vendor: The name of the store or service provider
    - amount: The total amount paid (numeric value only)
    - currency: The currency code (USD, EUR, etc.)
    - date: The date in YYYY-MM-DD format
    - items: Array of items purchased with name, quantity, and price if available
    - location: Object with city, state/province, and country if available
    - expenseType: Classification of expense (accommodation, transportation, meals, entertainment, business, office, other)
    - taxAmount: The tax amount if listed
    - total: The final total amount
    - confidence: Your confidence level in the extraction (0.0 to 1.0)
    
    Return ONLY a valid JSON object with these fields. If you cannot determine a value, omit the field or set it to null.
    
    Handling instructions:
    1. Focus on accuracy over completeness
    2. If a field is uncertain, assign a lower confidence score
    3. When extracting numbers, remove currency symbols and commas
    4. Convert dates to YYYY-MM-DD format regardless of original format
    5. For classification, use the closest match from the provided expense types
  `;

  try {
    // Make API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Prepare request data for debugging
    const requestData = {
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageContent } }
        ]
      }],
      response_format: { type: 'json_object' }
    };
    
    console.log('OpenRouter request:', JSON.stringify({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: requestData.model,
      hasAPIKey: !!apiKey,
      contentTypes: ['text', 'image']
    }));
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://expense-tracker.app',
        'X-Title': 'Expense Tracker'
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Log response status for debugging
    console.log('OpenRouter response status:', response.status, response.statusText);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorBody);
      
      if (response.status === 429) {
        throw createAIError(
          'OpenRouter API rate limit exceeded',
          'rate_limit',
          429,
          errorBody.error?.message || 'Too many requests',
          true
        );
      }
      
      throw createAIError(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
        'api_error',
        response.status,
        errorBody.error?.message || 'Unknown API error',
        response.status >= 500 // Only server errors are retryable
      );
    }

    const data = await response.json();
    console.log('OpenRouter response data structure:', Object.keys(data));
    
    // Handle missing or invalid response data
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw createAIError(
        'Invalid response from OpenRouter',
        'invalid_response',
        500,
        'The API response did not contain expected data structure',
        true
      );
    }
    
    // Parse the JSON response
    try {
      // Get the response data
      // (Removed detailed response logging)
      
      // Check if the data has the expected structure
      if (!data.choices || !data.choices[0]) {
        console.error('Invalid OpenRouter response - missing choices array:', data);
        return createFallbackReceipt('Missing choices array in response');
      }
      
      // Different models might have different response structures
      // Try several known formats
      let content = null;
      
      // Format 1: Standard OpenAI/OpenRouter format
      if (data.choices[0].message && data.choices[0].message.content) {
        content = data.choices[0].message.content;
        console.log('Found content in standard OpenRouter format (choices[0].message.content)');
      } 
      // Format 2: Some models return direct text in choices
      else if (data.choices[0].text) {
        content = data.choices[0].text;
        console.log('Found content in alternate format (choices[0].text)');
      }
      // Format 3: Check if content is directly in the first choice
      else if (typeof data.choices[0] === 'object' && data.choices[0] !== null) {
        // Try to find any string property that might contain our JSON
        const stringProps = Object.entries(data.choices[0])
          .filter(([_, value]) => typeof value === 'string')
          .map(([key, value]) => ({ key, value }));
        
        if (stringProps.length > 0) {
          // Try each string property to see if it contains valid JSON
          for (const { key, value } of stringProps) {
            try {
              JSON.parse(value);
              content = value;
              console.log(`Found possible JSON content in choices[0].${key}`);
              break;
            } catch (e) {
              // Try to see if there's JSON embedded in the string
              const jsonMatch = value.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  JSON.parse(jsonMatch[0]);
                  content = jsonMatch[0];
                  console.log(`Found embedded JSON in choices[0].${key}`);
                  break;
                } catch (e) {
                  // Not valid JSON, continue to next property
                }
              }
            }
          }
        }
      }
      
      // If we still don't have content, check if there's anything in the response we can use
      if (!content && data.output) {
        content = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
        console.log('Using content from data.output field');
      }
      
      // Last resort - if we still don't have content
      if (!content) {
        console.error('Could not find response content in any known location:', data);
        return createFallbackReceipt('No content found in response');
      }
      
      // Process the raw content
      
      let parsedContent;
      try {
        // If content is already an object, use it directly
        if (typeof content === 'object' && content !== null) {
          parsedContent = content;
          console.log('Content is already an object, using directly');
        } else {
          parsedContent = JSON.parse(content);
          console.log('Successfully parsed JSON content');
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        // Try to extract JSON from the content (in case model wrapped it in text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedContent = JSON.parse(jsonMatch[0]);
            console.log('Extracted JSON from response text using regex');
          } catch (extractError) {
            console.error('Failed to extract JSON with regex:', extractError);
            return createFallbackReceipt('Failed to parse JSON response');
          }
        } else {
          console.error('No JSON-like structure found in response');
          return createFallbackReceipt('No JSON structure in response');
        }
      }
      
      // Validate the parsed content
      if (typeof parsedContent !== 'object' || parsedContent === null) {
        console.error('Parsed content is not a valid object:', parsedContent);
        return createFallbackReceipt('Response is not a valid JSON object');
      }
      
      console.log('Parsed content:', JSON.stringify(parsedContent, null, 2));
      
      // Ensure all required fields have valid values
      const validatedReceipt: ExtractedReceipt = {
        confidence: 0.5,  // Default values
        ...parsedContent
      };
      
      // Ensure vendor is a string
      if (!validatedReceipt.vendor || typeof validatedReceipt.vendor !== 'string') {
        console.warn('Vendor missing or invalid, using default');
        validatedReceipt.vendor = 'Receipt';
      }
      
      // Ensure amount is a number
      if (validatedReceipt.amount !== undefined) {
        if (typeof validatedReceipt.amount === 'string') {
          // Try to convert string amount to number
          try {
            validatedReceipt.amount = parseFloat(validatedReceipt.amount.replace(/[^\d.-]/g, ''));
          } catch (e) {
            console.warn('Could not parse amount as number:', validatedReceipt.amount);
            validatedReceipt.amount = 0;
          }
        }
        
        // Check if amount is NaN
        if (isNaN(validatedReceipt.amount as number)) {
          console.warn('Amount is NaN, setting to 0');
          validatedReceipt.amount = 0;
        }
      }
      
      // Ensure date is valid
      if (validatedReceipt.date) {
        // Try to ensure date is in YYYY-MM-DD format
        try {
          // If it's not in ISO format already, try to convert it
          if (!/^\d{4}-\d{2}-\d{2}/.test(validatedReceipt.date)) {
            const date = new Date(validatedReceipt.date);
            if (!isNaN(date.getTime())) {
              validatedReceipt.date = date.toISOString().split('T')[0];
            }
          }
        } catch (e) {
          console.warn('Invalid date format, using today\'s date');
          validatedReceipt.date = new Date().toISOString().split('T')[0];
        }
      } else {
        // If date is missing, use today's date
        validatedReceipt.date = new Date().toISOString().split('T')[0];
      }
      
      // Ensure confidence is a valid number between 0 and 1
      if (typeof validatedReceipt.confidence !== 'number' || 
          validatedReceipt.confidence < 0 || 
          validatedReceipt.confidence > 1 ||
          isNaN(validatedReceipt.confidence)) {
        console.warn('Confidence missing or invalid, using default');
        validatedReceipt.confidence = 0.5; // Default to medium confidence if missing or invalid
      }
      
      // Ensure expenseType is valid
      if (!validatedReceipt.expenseType || 
          typeof validatedReceipt.expenseType !== 'string' ||
          !['accommodation', 'transportation', 'meals', 'entertainment', 'business', 'office', 'other'].includes(validatedReceipt.expenseType)) {
        console.warn('ExpenseType missing or invalid, using "other"');
        validatedReceipt.expenseType = 'other';
      }
      
      console.log('Validated receipt:', JSON.stringify(validatedReceipt, null, 2));
      return validatedReceipt;
    } catch (parseError) {
      console.error('Receipt parsing error:', parseError);
      // Log more detail about the error
      if (parseError instanceof Error) {
        console.error('Error details:', {
          message: parseError.message,
          name: parseError.name,
          stack: parseError.stack
        });
      }
      
      // Return a fallback receipt instead of throwing
      // This makes the application more resilient to parsing errors
      return createFallbackReceipt(`Parse error: ${parseError.message || 'Unknown error'}`);
    }
  } catch (error) {
    // Log critical errors but return fallback data instead of throwing
    console.error('Critical error processing with OpenRouter:', error);
    
    if (error.name === 'AbortError') {
      console.error('Request timed out after 30 seconds');
      return createFallbackReceipt('Request timeout');
    }
    
    // Log AIProcessingError details if available
    if ((error as AIProcessingError).code) {
      const aiError = error as AIProcessingError;
      console.error('AI Processing error:', {
        code: aiError.code,
        status: aiError.status,
        details: aiError.details,
        message: aiError.message
      });
      return createFallbackReceipt(`API error: ${aiError.code}`);
    }
    
    // Handle all other errors
    console.error('Unexpected error:', {
      message: error.message,
      stack: error.stack
    });
    
    return createFallbackReceipt(`API call error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Process a receipt with Gemini API
 * @param imageUrlOrBase64 URL or base64 string of the receipt image
 * @returns Extracted receipt data
 * @throws AIProcessingError if processing fails
 */
async function processWithGemini(
  imageUrlOrBase64: string
): Promise<ExtractedReceipt | null> {
  const config = useRuntimeConfig();
  const apiKey = config.public.geminiApiKey;
  
  if (!apiKey) {
    throw createAIError(
      'Gemini API key is not set',
      'auth_error',
      401,
      'No API key provided for Gemini',
      false
    );
  }

  // Handle image processing
  let imageContent;
  try {
    if (imageUrlOrBase64.startsWith('data:')) {
      // It's already a base64 string
      imageContent = imageUrlOrBase64;
    } else {
      // It's a URL, fetch the image and convert to base64
      const response = await fetch(imageUrlOrBase64);
      
      if (!response.ok) {
        throw createAIError(
          `Failed to fetch image: ${response.status} ${response.statusText}`,
          'image_fetch_error',
          response.status,
          'Could not retrieve the image from the provided URL',
          true
        );
      }
      
      const blob = await response.blob();
      imageContent = await blobToBase64(blob);
    }
  } catch (error) {
    if ((error as AIProcessingError).code) {
      throw error;
    }
    throw createAIError(
      'Error processing image',
      'image_processing_error',
      500,
      error.message,
      true
    );
  }

  // Create prompt with detailed instructions for reliable extraction
  const prompt = `
    You are an expert in extracting information from receipts. 
    Analyze this receipt image and extract the following information in JSON format:
    - vendor: The name of the store or service provider
    - amount: The total amount paid (numeric value only)
    - currency: The currency code (USD, EUR, etc.)
    - date: The date in YYYY-MM-DD format
    - items: Array of items purchased with name, quantity, and price if available
    - location: Object with city, state/province, and country if available
    - expenseType: Classification of expense (accommodation, transportation, meals, entertainment, business, office, other)
    - taxAmount: The tax amount if listed
    - total: The final total amount
    - confidence: Your confidence level in the extraction (0.0 to 1.0)
    
    Return ONLY a valid JSON object with these fields. If you cannot determine a value, omit the field or set it to null.
    
    Handling instructions:
    1. Focus on accuracy over completeness
    2. If a field is uncertain, assign a lower confidence score
    3. When extracting numbers, remove currency symbols and commas
    4. Convert dates to YYYY-MM-DD format regardless of original format
    5. For classification, use the closest match from the provided expense types
  `;

  try {
    // Make API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: imageContent.split(',')[1] } }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseFormat: 'JSON'
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw createAIError(
          'Gemini API rate limit exceeded',
          'rate_limit',
          429,
          errorBody.error?.message || 'Too many requests',
          true
        );
      }
      
      throw createAIError(
        `Gemini API error: ${response.status} ${response.statusText}`,
        'api_error',
        response.status,
        errorBody.error?.message || 'Unknown API error',
        response.status >= 500 // Only server errors are retryable
      );
    }

    const data = await response.json();
    
    // Handle missing or invalid response data
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw createAIError(
        'Invalid response from Gemini',
        'invalid_response',
        500,
        'The API response did not contain expected data structure',
        true
      );
    }
    
    // Parse the JSON response
    try {
      const content = data.candidates[0].content.parts[0].text;
      const parsedContent = JSON.parse(content);
      
      // Validate the parsed content
      if (typeof parsedContent !== 'object' || parsedContent === null) {
        throw new Error('Response is not a valid JSON object');
      }
      
      // Ensure confidence is present and valid
      if (typeof parsedContent.confidence !== 'number' || 
          parsedContent.confidence < 0 || 
          parsedContent.confidence > 1) {
        parsedContent.confidence = 0.5; // Default to medium confidence if missing or invalid
      }
      
      return parsedContent as ExtractedReceipt;
    } catch (parseError) {
      throw createAIError(
        'Failed to parse receipt data',
        'parse_error',
        422,
        parseError.message,
        false
      );
    }
  } catch (error) {
    // Handle AbortController timeout
    if (error.name === 'AbortError') {
      throw createAIError(
        'Gemini API request timed out',
        'timeout',
        408,
        'The request took too long to complete',
        true
      );
    }
    
    // Re-throw AIProcessingError instances
    if ((error as AIProcessingError).code) {
      throw error;
    }
    
    // Handle other errors
    throw createAIError(
      'Error calling Gemini API',
      'api_call_error',
      500,
      error.message,
      true
    );
  }
}

/**
 * Process an odometer image with OpenRouter API
 * @param imageUrlOrBase64 URL or base64 string of the odometer image
 * @returns Extracted odometer reading
 * @throws AIProcessingError if processing fails
 */
async function processOdometerWithOpenRouter(
  imageUrlOrBase64: string
): Promise<ExtractedOdometerReading | null> {
  const config = useRuntimeConfig();
  const apiKey = config.public.openRouterApiKey;
  
  if (!apiKey) {
    throw createAIError(
      'OpenRouter API key is not set',
      'auth_error',
      401,
      'No API key provided for OpenRouter',
      false
    );
  }

  // Handle image processing
  let imageContent;
  try {
    if (imageUrlOrBase64.startsWith('data:')) {
      // It's already a base64 string
      imageContent = imageUrlOrBase64;
    } else {
      // It's a URL, fetch the image and convert to base64
      const response = await fetch(imageUrlOrBase64);
      
      if (!response.ok) {
        throw createAIError(
          `Failed to fetch image: ${response.status} ${response.statusText}`,
          'image_fetch_error',
          response.status,
          'Could not retrieve the image from the provided URL',
          true
        );
      }
      
      const blob = await response.blob();
      imageContent = await blobToBase64(blob);
    }
  } catch (error) {
    if ((error as AIProcessingError).code) {
      throw error;
    }
    throw createAIError(
      'Error processing image',
      'image_processing_error',
      500,
      error.message,
      true
    );
  }

  // Create prompt with detailed instructions for reliable extraction
  const prompt = `
    You are an expert in extracting odometer readings from vehicle dashboards. 
    Analyze this image and extract the following information in JSON format:
    - reading: The odometer reading as a number (remove any commas and just return a numeric value)
    - date: The date in YYYY-MM-DD format if visible in the image
    - confidence: Your confidence level in the extraction (0.0 to 1.0)
    
    Return ONLY a valid JSON object with these fields. If you cannot determine a value, omit the field or set it to null.
    
    Handling instructions:
    1. Focus on accuracy over completeness
    2. If the reading is uncertain, assign a lower confidence score
    3. When extracting numbers, remove any commas, spaces, or other formatting characters
    4. If there are multiple readings, identify the main odometer (not trip meter)
    5. For date, convert to YYYY-MM-DD format
  `;

  try {
    // Make API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Prepare request data for debugging
    const requestData = {
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageContent } }
        ]
      }],
      response_format: { type: 'json_object' }
    };
    
    console.log('OpenRouter request:', JSON.stringify({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      model: requestData.model,
      hasAPIKey: !!apiKey,
      contentTypes: ['text', 'image']
    }));
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://expense-tracker.app',
        'X-Title': 'Expense Tracker'
      },
      body: JSON.stringify(requestData),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Log response status for debugging
    console.log('OpenRouter response status:', response.status, response.statusText);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorBody);
      
      if (response.status === 429) {
        throw createAIError(
          'OpenRouter API rate limit exceeded',
          'rate_limit',
          429,
          errorBody.error?.message || 'Too many requests',
          true
        );
      }
      
      throw createAIError(
        `OpenRouter API error: ${response.status} ${response.statusText}`,
        'api_error',
        response.status,
        errorBody.error?.message || 'Unknown API error',
        response.status >= 500 // Only server errors are retryable
      );
    }

    const data = await response.json();
    console.log('OpenRouter response data structure:', Object.keys(data));
    
    // Handle missing or invalid response data
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw createAIError(
        'Invalid response from OpenRouter',
        'invalid_response',
        500,
        'The API response did not contain expected data structure',
        true
      );
    }
    
    // Parse the JSON response
    try {
      // Log complete response structure for debugging
      console.log('OpenRouter odometer response:', JSON.stringify(data, null, 2));
      
      // Check if the data has the expected structure
      if (!data.choices || !data.choices[0]) {
        console.error('Invalid OpenRouter response - missing choices array:', data);
        return createFallbackOdometerReading('Missing choices array in response');
      }
      
      // Different models might have different response structures
      // Try several known formats
      let content = null;
      
      // Format 1: Standard OpenAI/OpenRouter format
      if (data.choices[0].message && data.choices[0].message.content) {
        content = data.choices[0].message.content;
        console.log('Found content in standard OpenRouter format (choices[0].message.content)');
      } 
      // Format 2: Some models return direct text in choices
      else if (data.choices[0].text) {
        content = data.choices[0].text;
        console.log('Found content in alternate format (choices[0].text)');
      }
      // Format 3: Check if content is directly in the first choice
      else if (typeof data.choices[0] === 'object' && data.choices[0] !== null) {
        // Try to find any string property that might contain our JSON
        const stringProps = Object.entries(data.choices[0])
          .filter(([_, value]) => typeof value === 'string')
          .map(([key, value]) => ({ key, value }));
        
        if (stringProps.length > 0) {
          // Try each string property to see if it contains valid JSON
          for (const { key, value } of stringProps) {
            try {
              JSON.parse(value);
              content = value;
              console.log(`Found possible JSON content in choices[0].${key}`);
              break;
            } catch (e) {
              // Try to see if there's JSON embedded in the string
              const jsonMatch = value.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  JSON.parse(jsonMatch[0]);
                  content = jsonMatch[0];
                  console.log(`Found embedded JSON in choices[0].${key}`);
                  break;
                } catch (e) {
                  // Not valid JSON, continue to next property
                }
              }
            }
          }
        }
      }
      
      // If we still don't have content, check if there's anything in the response we can use
      if (!content && data.output) {
        content = typeof data.output === 'string' ? data.output : JSON.stringify(data.output);
        console.log('Using content from data.output field');
      }
      
      // Last resort - if we still don't have content
      if (!content) {
        console.error('Could not find response content in any known location:', data);
        return createFallbackOdometerReading('No content found in response');
      }
      
      // Process the raw content
      
      let parsedContent;
      try {
        // If content is already an object, use it directly
        if (typeof content === 'object' && content !== null) {
          parsedContent = content;
          console.log('Content is already an object, using directly');
        } else {
          parsedContent = JSON.parse(content);
          console.log('Successfully parsed JSON content');
        }
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        // Try to extract JSON from the content (in case model wrapped it in text)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedContent = JSON.parse(jsonMatch[0]);
            console.log('Extracted JSON from response text using regex');
          } catch (extractError) {
            console.error('Failed to extract JSON with regex:', extractError);
            return createFallbackOdometerReading('Failed to parse JSON response');
          }
        } else {
          console.error('No JSON-like structure found in response');
          return createFallbackOdometerReading('No JSON structure in response');
        }
      }
      
      // Validate the parsed content
      if (typeof parsedContent !== 'object' || parsedContent === null) {
        console.error('Parsed content is not a valid object:', parsedContent);
        return createFallbackOdometerReading('Response is not a valid JSON object');
      }
      
      // Create a validated object with default values
      const validatedReading: ExtractedOdometerReading = {
        confidence: 0.5,  // Default value
        ...parsedContent
      };
      
      // Ensure reading is a number if present
      if (validatedReading.reading !== undefined && validatedReading.reading !== null) {
        if (typeof validatedReading.reading === 'string') {
          // Convert string to number, removing any non-numeric characters
          try {
            validatedReading.reading = parseFloat(validatedReading.reading.replace(/[^\d.]/g, ''));
          } catch (e) {
            console.warn('Could not parse reading as number:', validatedReading.reading);
            validatedReading.reading = null;
          }
        }
        
        // Validate the reading is actually a number
        if (isNaN(validatedReading.reading as number)) {
          console.warn('Reading is NaN, setting to null');
          validatedReading.reading = null;
          validatedReading.confidence = Math.min(validatedReading.confidence, 0.3); // Lower confidence if reading is invalid
        }
      }
      
      // Ensure date is valid
      if (validatedReading.date) {
        // Try to ensure date is in YYYY-MM-DD format
        try {
          // If it's not in ISO format already, try to convert it
          if (!/^\d{4}-\d{2}-\d{2}/.test(validatedReading.date)) {
            const date = new Date(validatedReading.date);
            if (!isNaN(date.getTime())) {
              validatedReading.date = date.toISOString().split('T')[0];
            }
          }
        } catch (e) {
          console.warn('Invalid date format, using today\'s date');
          validatedReading.date = new Date().toISOString().split('T')[0];
        }
      } else {
        // If date is missing, use today's date
        validatedReading.date = new Date().toISOString().split('T')[0];
      }
      
      // Ensure confidence is a valid number between 0 and 1
      if (typeof validatedReading.confidence !== 'number' || 
          validatedReading.confidence < 0 || 
          validatedReading.confidence > 1 ||
          isNaN(validatedReading.confidence)) {
        console.warn('Confidence missing or invalid, using default');
        validatedReading.confidence = 0.5; // Default to medium confidence if missing or invalid
      }
      
      console.log('Validated odometer reading:', JSON.stringify(validatedReading, null, 2));
      return validatedReading;
    } catch (parseError) {
      console.error('Odometer reading parsing error:', parseError);
      // Log more detail about the error
      if (parseError instanceof Error) {
        console.error('Error details:', {
          message: parseError.message,
          name: parseError.name,
          stack: parseError.stack
        });
      }
      
      // Return a fallback reading instead of throwing
      return createFallbackOdometerReading(`Parse error: ${parseError.message || 'Unknown error'}`);
    }
  } catch (error) {
    // Log critical errors but return fallback data instead of throwing
    console.error('Critical error processing with OpenRouter for odometer processing:', error);
    
    if (error.name === 'AbortError') {
      console.error('Request timed out after 30 seconds');
      return createFallbackOdometerReading('Request timeout');
    }
    
    // Log AIProcessingError details if available
    if ((error as AIProcessingError).code) {
      const aiError = error as AIProcessingError;
      console.error('AI Processing error:', {
        code: aiError.code,
        status: aiError.status,
        details: aiError.details,
        message: aiError.message
      });
      return createFallbackOdometerReading(`API error: ${aiError.code}`);
    }
    
    // Handle all other errors
    console.error('Unexpected error:', {
      message: error.message,
      stack: error.stack
    });
    
    return createFallbackOdometerReading(`API call error: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Process an odometer image with Gemini API
 * @param imageUrlOrBase64 URL or base64 string of the odometer image
 * @returns Extracted odometer reading
 * @throws AIProcessingError if processing fails
 */
async function processOdometerWithGemini(
  imageUrlOrBase64: string
): Promise<ExtractedOdometerReading | null> {
  const config = useRuntimeConfig();
  const apiKey = config.public.geminiApiKey;
  
  if (!apiKey) {
    throw createAIError(
      'Gemini API key is not set',
      'auth_error',
      401,
      'No API key provided for Gemini',
      false
    );
  }

  // Handle image processing
  let imageContent;
  try {
    if (imageUrlOrBase64.startsWith('data:')) {
      // It's already a base64 string
      imageContent = imageUrlOrBase64;
    } else {
      // It's a URL, fetch the image and convert to base64
      const response = await fetch(imageUrlOrBase64);
      
      if (!response.ok) {
        throw createAIError(
          `Failed to fetch image: ${response.status} ${response.statusText}`,
          'image_fetch_error',
          response.status,
          'Could not retrieve the image from the provided URL',
          true
        );
      }
      
      const blob = await response.blob();
      imageContent = await blobToBase64(blob);
    }
  } catch (error) {
    if ((error as AIProcessingError).code) {
      throw error;
    }
    throw createAIError(
      'Error processing image',
      'image_processing_error',
      500,
      error.message,
      true
    );
  }

  // Create prompt with detailed instructions for reliable extraction
  const prompt = `
    You are an expert in extracting odometer readings from vehicle dashboards. 
    Analyze this image and extract the following information in JSON format:
    - reading: The odometer reading as a number (remove any commas and just return a numeric value)
    - date: The date in YYYY-MM-DD format if visible in the image
    - confidence: Your confidence level in the extraction (0.0 to 1.0)
    
    Return ONLY a valid JSON object with these fields. If you cannot determine a value, omit the field or set it to null.
    
    Handling instructions:
    1. Focus on accuracy over completeness
    2. If the reading is uncertain, assign a lower confidence score
    3. When extracting numbers, remove any commas, spaces, or other formatting characters
    4. If there are multiple readings, identify the main odometer (not trip meter)
    5. For date, convert to YYYY-MM-DD format
  `;

  try {
    // Make API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: imageContent.split(',')[1] } }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseFormat: 'JSON'
        }
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Handle HTTP errors
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      
      if (response.status === 429) {
        throw createAIError(
          'Gemini API rate limit exceeded',
          'rate_limit',
          429,
          errorBody.error?.message || 'Too many requests',
          true
        );
      }
      
      throw createAIError(
        `Gemini API error: ${response.status} ${response.statusText}`,
        'api_error',
        response.status,
        errorBody.error?.message || 'Unknown API error',
        response.status >= 500 // Only server errors are retryable
      );
    }

    const data = await response.json();
    
    // Handle missing or invalid response data
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw createAIError(
        'Invalid response from Gemini',
        'invalid_response',
        500,
        'The API response did not contain expected data structure',
        true
      );
    }
    
    // Parse the JSON response
    try {
      const content = data.candidates[0].content.parts[0].text;
      const parsedContent = JSON.parse(content);
      
      // Validate the parsed content
      if (typeof parsedContent !== 'object' || parsedContent === null) {
        throw new Error('Response is not a valid JSON object');
      }
      
      // Ensure confidence is present and valid
      if (typeof parsedContent.confidence !== 'number' || 
          parsedContent.confidence < 0 || 
          parsedContent.confidence > 1) {
        parsedContent.confidence = 0.5; // Default to medium confidence if missing or invalid
      }
      
      // Ensure reading is a number if present
      if (parsedContent.reading !== undefined && parsedContent.reading !== null) {
        if (typeof parsedContent.reading === 'string') {
          // Convert string to number, removing any non-numeric characters
          parsedContent.reading = parseFloat(parsedContent.reading.replace(/[^\d.]/g, ''));
        }
        // Validate the reading is actually a number
        if (isNaN(parsedContent.reading)) {
          parsedContent.reading = null;
          parsedContent.confidence = Math.min(parsedContent.confidence, 0.3); // Lower confidence if reading is invalid
        }
      }
      
      return parsedContent as ExtractedOdometerReading;
    } catch (parseError) {
      throw createAIError(
        'Failed to parse odometer reading data',
        'parse_error',
        422,
        parseError.message,
        false
      );
    }
  } catch (error) {
    // Handle AbortController timeout
    if (error.name === 'AbortError') {
      throw createAIError(
        'Gemini API request timed out',
        'timeout',
        408,
        'The request took too long to complete',
        true
      );
    }
    
    // Re-throw AIProcessingError instances
    if ((error as AIProcessingError).code) {
      throw error;
    }
    
    // Handle other errors
    throw createAIError(
      'Error calling Gemini API',
      'api_call_error',
      500,
      error.message,
      true
    );
  }
}

/**
 * Helper function to convert a Blob to base64
 * @param blob The blob to convert
 * @returns Base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}