import { useRuntimeConfig } from '#app';
import { ExtractedReceipt } from './ai-processing';

/**
 * Process a receipt using the Netlify function fallback
 * @param imageBase64 Base64 string of the receipt image
 * @returns Extracted receipt data
 * @throws Error if processing fails
 */
export async function processReceiptWithNetlifyFallback(
  imageBase64: string
): Promise<ExtractedReceipt> {
  const config = useRuntimeConfig();
  
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
    
    // Extract receipt data
    const receipt = data.receipt;
    
    if (!receipt) {
      throw new Error('No receipt data in response');
    }
    
    // Create a standardized receipt object
    const extractedData: ExtractedReceipt = {
      vendor: receipt.vendor || 'Unknown Vendor',
      amount: receipt.subtotal || receipt.total || 0,
      date: receipt.date || new Date().toISOString().split('T')[0],
      confidence: receipt.confidence || 0.85,
      currency: receipt.currency || 'USD',
      expenseType: receipt.expenseType || 'other',
      total: receipt.total || 0,
      items: receipt.items || [],
      location: receipt.location || { city: '', state: '', country: '' },
      taxAmount: receipt.taxAmount || 0,
      _fallback: receipt._fallback || true,
      _fallbackReason: receipt._fallbackReason || 'Used Netlify function fallback',
      _technicalDetails: receipt._technicalDetails || undefined
    };
    
    // If this is a fallback response, log detailed technical information
    if (extractedData._fallback && extractedData._technicalDetails) {
      console.log('Receipt processing fallback technical details:', extractedData._technicalDetails);
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
    return extractedData;
  } catch (error) {
    console.error('Error processing receipt with Netlify fallback:', error);
    throw error;
  }
}