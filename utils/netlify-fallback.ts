import { ExtractedReceipt } from './ai-processing';

// Set up runtime config for both server and client environments
// without using Vue app aliases that aren't allowed in server runtime
let runtimeConfig: any;

// For server-side, use environment variables directly
if (typeof process !== 'undefined' && process.env) {
  runtimeConfig = {
    public: {
      // Any config variables needed for this file
    }
  };
} else {
  // For client-side, try to get the config from window
  try {
    // Note: We don't use any direct imports from '#app' which would cause
    // issues with Netlify's server-side rendering process
    // Instead, rely on global window object if we're in a browser
    if (typeof window !== 'undefined' && window.__NUXT__?.config) {
      runtimeConfig = window.__NUXT__.config;
    }
  } catch (e) {
    console.warn('Unable to get runtime config, using defaults');
    runtimeConfig = { public: {} };
  }
}

/**
 * Process a receipt using the Netlify function fallback
 * @param imageBase64 Base64 string of the receipt image
 * @returns Extracted receipt data
 * @throws Error if processing fails
 */
export async function processReceiptWithNetlifyFallback(
  imageBase64: string
): Promise<ExtractedReceipt> {
  const config = runtimeConfig;
  
  console.log('Trying to process receipt with Netlify function fallback...');
  
  // Prepare the image data
  let base64Data = imageBase64;
  
  if (base64Data.includes('base64,')) {
    // Extract the base64 content
    base64Data = base64Data.split('base64,')[1];
  }
  
  // Validate the base64 data
  if (!base64Data || base64Data.trim() === '') {
    throw new Error('Empty or invalid base64 data provided');
  }
  
  try {
    // Send the image to the Netlify function for processing
    const response = await fetch('/.netlify/functions/process-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: base64Data
      })
    });
    
    if (!response.ok) {
      // Try to parse error response as JSON first
      let errorMessage = `Receipt processing failed: ${response.status} ${response.statusText}`;
      let errorDetails = '';
      
      try {
        const errorJson = await response.json();
        console.error('Netlify function error response:', errorJson);
        
        // Extract more detailed error information if available
        if (errorJson.error) {
          errorMessage = `Netlify function error: ${errorJson.error}`;
          errorDetails = errorJson.details || '';
        }
      } catch (parseError) {
        // If not JSON, get raw text
        const errorText = await response.text();
        console.error('Netlify function error response (text):', errorText);
        errorDetails = errorText;
      }
      
      throw new Error(`${errorMessage}${errorDetails ? '\n' + errorDetails : ''}`);
    }
    
    const data = await response.json();
    
    console.log('Raw Netlify response data:', JSON.stringify(data));
    
    // Extract receipt data
    const receipt = data.receipt;
    
    if (!receipt) {
      throw new Error('No receipt data in response');
    }
    
    // Check if we need to request a description asynchronously
    const needsAsyncDescription = data.needsAsyncDescription || false;
    const asyncDescriptionEndpoint = data.asyncDescriptionEndpoint || '/.netlify/functions/generate-receipt-description';
    
    // Log initial description information
    console.log('Initial description from server response:', data.initialDescription);
    console.log('Needs async description:', needsAsyncDescription);
    
    // Create a standardized receipt object
    const extractedData: ExtractedReceipt = {
      vendor: receipt.vendor || 'Unknown Vendor',
      amount: receipt.subtotal || receipt.total || 0,
      date: receipt.date || new Date().toISOString().split('T')[0],
      confidence: receipt.confidence || 0.85,
      currency: receipt.currency || 'USD',
      expenseType: receipt.expenseType || 'other',
      expense_type: receipt.expenseType || 'other', // Add expense_type for form compatibility
      total: receipt.total || 0,
      items: receipt.items || [],
      location: receipt.location || { city: '', state: '', country: '' },
      taxAmount: receipt.taxAmount || 0,
      _fallback: receipt._fallback || true,
      _fallbackReason: receipt._fallbackReason || 'Used Netlify function fallback',
      _technicalDetails: receipt._technicalDetails || undefined,
      // Use initial description for now, potentially to be updated asynchronously
      description: receipt._initialDescription || data.initialDescription || null,
      // Add metadata for async description
      _needsAsyncDescription: needsAsyncDescription,
      _asyncDescriptionEndpoint: needsAsyncDescription ? asyncDescriptionEndpoint : null
    };
    
    // If this is a fallback response, log detailed technical information
    if (extractedData._fallback && extractedData._technicalDetails) {
      console.log('Receipt processing fallback technical details:', extractedData._technicalDetails);
      
      // If it's the invalid image content error, provide a more informative UI message
      if (extractedData._technicalDetails.error === 'INVALID_IMAGE_CONTENT') {
        // Use the specific error message if provided, otherwise use a generic message
        if (!extractedData._userMessage) {
          extractedData._userMessage = 'The receipt could not be processed automatically. Please fill in the details manually.';
        }
        
        // If we detected it was a PDF specifically, include that in the vendor field
        if (extractedData._technicalDetails.isPDF) {
          extractedData.vendor = extractedData.vendor || 'PDF Receipt could not be processed';
        } else {
          extractedData.vendor = extractedData.vendor || 'Receipt could not be processed';
        }
      }
    }
    
    // Detailed log of what we received
    console.log('Netlify function returned receipt:', JSON.stringify({
      vendor: extractedData.vendor,
      amount: extractedData.amount,
      total: extractedData.total,
      expenseType: extractedData.expenseType,
      location: extractedData.location,
      taxAmount: extractedData.taxAmount,
      itemCount: extractedData.items?.length || 0,
      confidence: extractedData.confidence
    }, null, 2));
    
    console.log('Successfully processed receipt with Netlify function fallback');
    
    // If we need to fetch a description asynchronously, start that process
    // but don't wait for it - let the UI display what we have so far
    if (extractedData._needsAsyncDescription && extractedData._asyncDescriptionEndpoint) {
      requestAsyncDescription(extractedData)
        .then(description => {
          // This will be handled by the caller
          extractedData.description = description;
          extractedData._descriptionGenerationComplete = true;
          
          // Update store instead of using events
          if (typeof window !== 'undefined') {
            // Import the store directly
            try {
              // Using dynamic import for the store to avoid cyclic dependencies
              import('../stores/expenseStore').then(module => {
                const { useExpenseStore } = module;
                const store = useExpenseStore();
                store.setGeneratedDescription(description);
              }).catch(err => {
                console.error('Failed to import and update store:', err);
              });
            } catch (storeError) {
              console.error('Error updating store:', storeError);
            }
          }
        })
        .catch(descError => {
          console.error('Failed to generate async description:', descError);
          // Keep using the initial description
        });
    }
    
    return extractedData;
  } catch (error) {
    console.error('Error processing receipt with Netlify fallback:', error);
    throw error;
  }
}

/**
 * Request an asynchronous description for a receipt
 * @param receipt The receipt data to generate a description for
 * @returns Promise that resolves to the generated description
 */
export async function requestAsyncDescription(receipt: ExtractedReceipt): Promise<string> {
  if (!receipt._asyncDescriptionEndpoint) {
    throw new Error('No async description endpoint specified in receipt');
  }
  
  console.log('Requesting async description for receipt...');
  
  try {
    // Send request to the async description endpoint
    const response = await fetch(receipt._asyncDescriptionEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receipt: {
          vendor: receipt.vendor,
          amount: receipt.amount,
          date: receipt.date,
          currency: receipt.currency,
          location: receipt.location,
          expenseType: receipt.expenseType,
          items: receipt.items,
          total: receipt.total,
          taxAmount: receipt.taxAmount,
          id: receipt.id
        }
      })
    });
    
    if (!response.ok) {
      let errorMessage = `Description generation failed: ${response.status} ${response.statusText}`;
      
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        // Use default error message
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    if (!data.description) {
      throw new Error('No description returned from endpoint');
    }
    
    return data.description;
  } catch (error) {
    console.error('Error requesting async description:', error);
    throw error;
  }
}