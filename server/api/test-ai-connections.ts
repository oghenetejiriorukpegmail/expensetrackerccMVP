import { testDocumentAIConnection, testOpenRouterConnection } from '~/utils/ai-connection-tester';

export default defineEventHandler(async (event) => {
  try {
    // Get request body if any
    const body = await readBody(event).catch(() => ({}));
    
    // Test Document AI
    const documentAIResult = await testDocumentAIConnection();
    
    // Test OpenRouter using key from request if provided
    const openRouterResult = await testOpenRouterConnection(body.openRouterApiKey);
    
    return {
      documentAI: documentAIResult,
      openRouter: openRouterResult
    };
  } catch (error) {
    console.error('Error testing AI connections:', error);
    
    // Return a formatted error
    return {
      error: true,
      message: error.message || 'Unknown error occurred while testing AI connections'
    };
  }
});