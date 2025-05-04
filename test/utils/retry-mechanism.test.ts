import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processReceiptWithAI } from '../../utils/ai-processing';

// Mock the runtime config
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      openRouterApiKey: 'mock-openrouter-key',
      geminiApiKey: 'mock-gemini-key'
    }
  })
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create a successful response
function createSuccessResponse(data: any) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data)
  });
}

// Helper to create an error response
function createErrorResponse(status: number, statusText: string, errorData = {}) {
  return Promise.resolve({
    ok: false,
    status,
    statusText,
    json: () => Promise.resolve({ error: errorData })
  });
}

describe('Retry Mechanism', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Stub console logs and warnings
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('should retry on retryable errors', async () => {
    // First call fails with a retryable error (rate limit), second call succeeds
    mockFetch
      .mockResolvedValueOnce(createErrorResponse(429, 'Too Many Requests'))
      .mockResolvedValueOnce(createSuccessResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                vendor: 'Test Vendor',
                amount: 99.99,
                confidence: 0.9
              })
            }
          }
        ]
      }));
    
    // Configure a retry test with only 1 retry
    const retryConfig = {
      maxRetries: 1,
      initialDelayMs: 10, // Small delay for test
      maxDelayMs: 20,
      backoffFactor: 1.5
    };
    
    // Process should succeed after retry
    const result = await processReceiptWithAI('data:image/jpeg;base64,mockbase64data', retryConfig);
    
    // Should have called fetch twice (initial + 1 retry)
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    // Should have the successful result
    expect(result).toBeTruthy();
    expect(result?.vendor).toBe('Test Vendor');
    expect(result?.amount).toBe(99.99);
  });
  
  it('should stop retrying after max retries', async () => {
    // All calls fail with retryable errors
    mockFetch
      .mockResolvedValue(createErrorResponse(429, 'Too Many Requests'));
    
    // Configure a retry test with 2 retries
    const retryConfig = {
      maxRetries: 2,
      initialDelayMs: 10, // Small delay for test
      maxDelayMs: 20,
      backoffFactor: 1.5
    };
    
    // Process should fail even after retries
    await expect(processReceiptWithAI('data:image/jpeg;base64,mockbase64data', retryConfig))
      .rejects.toThrow();
    
    // Should have called fetch 3 times (initial + 2 retries)
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
  
  it('should not retry on non-retryable errors', async () => {
    // Call fails with a non-retryable error (invalid input)
    mockFetch
      .mockResolvedValueOnce(createErrorResponse(400, 'Bad Request'));
    
    // Configure a retry test with 2 retries
    const retryConfig = {
      maxRetries: 2,
      initialDelayMs: 10,
      maxDelayMs: 20,
      backoffFactor: 1.5
    };
    
    // Process should fail immediately without retrying
    await expect(processReceiptWithAI('data:image/jpeg;base64,mockbase64data', retryConfig))
      .rejects.toThrow();
    
    // Should have called fetch only once (no retries)
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
  
  it('should use exponential backoff for delays', async () => {
    // Mock console.log to capture retry messages
    const consoleLogSpy = vi.spyOn(console, 'log');
    
    // All calls fail with retryable errors
    mockFetch
      .mockResolvedValue(createErrorResponse(429, 'Too Many Requests'));
    
    // Configure a retry test with 2 retries and a high backoff factor
    const retryConfig = {
      maxRetries: 2,
      initialDelayMs: 10,
      maxDelayMs: 100,
      backoffFactor: 3 // Each retry waits 3 times longer
    };
    
    // Process should fail even after retries
    await expect(processReceiptWithAI('data:image/jpeg;base64,mockbase64data', retryConfig))
      .rejects.toThrow();
    
    // Check that exponential backoff was used
    // First retry should use initialDelayMs (10ms)
    // Second retry should use initialDelayMs * backoffFactor (10ms * 3 = 30ms)
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Retry attempt 1/2 after 10ms delay'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Retry attempt 2/2 after 30ms delay'));
  });
});