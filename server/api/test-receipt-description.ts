import { processReceiptWithAI, generateReceiptDescription } from '~/utils/ai-processing';

export default defineEventHandler(async (event) => {
  try {
    // Get request body - should contain receipt base64 data
    const body = await readBody(event);
    
    if (!body || !body.receiptImage) {
      return {
        success: false,
        message: 'No receipt image provided'
      };
    }
    
    console.log('Processing test receipt for description generation...');
    
    // First process the receipt with AI
    const extractedData = await processReceiptWithAI(body.receiptImage);
    
    if (!extractedData) {
      return {
        success: false,
        message: 'Failed to extract data from receipt'
      };
    }
    
    // Generate a description using the extracted data
    let description = null;
    let error = null;
    
    try {
      description = await generateReceiptDescription(extractedData);
    } catch (err) {
      error = err.message || 'Unknown error generating description';
      console.error('Error generating receipt description:', err);
    }
    
    // Return the results
    return {
      success: !!description,
      extractedData: {
        vendor: extractedData.vendor || '',
        amount: extractedData.amount || 0,
        date: extractedData.date || '',
        location: extractedData.location || '',
        expenseType: extractedData.expenseType || '',
        confidence: extractedData.confidence || 0,
        _fallback: extractedData._fallback || false
      },
      description,
      message: description 
        ? 'Successfully generated description' 
        : (error || 'Failed to generate description')
    };
  } catch (error) {
    console.error('Error in receipt description test:', error);
    
    return {
      success: false,
      message: error.message || 'Unknown error occurred during receipt description test'
    };
  }
});