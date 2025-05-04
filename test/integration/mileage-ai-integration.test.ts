import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MileageForm from '~/components/forms/MileageForm.vue';
// Use direct import instead of alias
import { processOdometerWithAI } from '../../utils/ai-processing';

// Mock the runtime config
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      openRouterApiKey: 'mock-openrouter-key',
      geminiApiKey: 'mock-gemini-key'
    }
  })
}));

// Mock the stores
vi.mock('~/stores/tripStore', () => ({
  useTripStore: () => ({
    fetchTrips: vi.fn().mockResolvedValue([]),
    trips: [
      { id: 'trip1', name: 'Business Trip 1' },
      { id: 'trip2', name: 'Business Trip 2' }
    ]
  })
}));

vi.mock('~/stores/userStore', () => ({
  useUserStore: () => ({
    fetchSettings: vi.fn().mockResolvedValue({}),
    settings: {
      mileage_rate: 0.58
    }
  })
}));

// Important: Don't mock the mileageStore here, we want to test the integration
// with the real utils/ai-processing functions
vi.mock('~/stores/mileageStore', () => ({
  useMileageStore: () => ({
    // This should call the real processOdometerWithAI
    processOdometerImage: vi.fn().mockImplementation((file) => {
      // Convert file to base64 string (mocked)
      return processOdometerWithAI('data:image/jpeg;base64,mockbase64data');
    })
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

// Setup integration test for MileageForm with AI processing
describe('MileageForm with AI Processing Integration', () => {
  let wrapper: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the successful OpenRouter API response
    const mockSuccessData = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              reading: 12345.6,
              date: '2025-01-01',
              confidence: 0.9
            })
          }
        }
      ]
    };
    
    mockFetch.mockResolvedValue(createSuccessResponse(mockSuccessData));
    
    // Create a fresh wrapper before each test
    wrapper = mount(MileageForm, {
      props: {
        tripId: 'trip1',
        isSubmitting: false
      },
      global: {
        stubs: ['NuxtLink']
      }
    });
  });
  
  it('should process start odometer image and update form value', async () => {
    // Create a mock file input event
    const file = new File([''], 'odometer.jpg', { type: 'image/jpeg' });
    
    // Set the file
    await wrapper.vm.handleStartImageChange({ target: { files: [file] } });
    
    // Trigger AI processing
    await wrapper.vm.processStartOdometerWithAI();
    
    // Should have made an API call
    expect(mockFetch).toHaveBeenCalledTimes(1);
    
    // Should have extracted data
    expect(wrapper.vm.startExtractedData).toBeTruthy();
    expect(wrapper.vm.startExtractedData.reading).toBe(12345.6);
    
    // Apply the extracted data
    await wrapper.vm.applyExtractedData();
    
    // Form should be updated
    expect(wrapper.vm.form.start_odometer).toBe(12345.6);
  });
  
  it('should handle errors during AI processing', async () => {
    // Mock the store method to throw a specific error
    const mileageStore = wrapper.vm.mileageStore;
    mileageStore.processOdometerImage = vi.fn().mockRejectedValueOnce({
      message: 'Network error when processing odometer image',
      code: 'network_error',
      status: 503,
      details: 'Failed to fetch',
      retryable: true
    });
    
    // Create a mock file input event
    const file = new File([''], 'odometer.jpg', { type: 'image/jpeg' });
    
    // Set the file
    await wrapper.vm.handleStartImageChange({ target: { files: [file] } });
    
    // Trigger AI processing
    await wrapper.vm.processStartOdometerWithAI();
    
    // Should show error message
    expect(wrapper.vm.errorMessage).toContain('Network error');
    
    // Should not have extracted data
    expect(wrapper.vm.startExtractedData).toBeFalsy();
  });
  
  it('should handle complete workflow from image processing to form submission', async () => {
    // 1. Setup both start and end odometer files
    const file1 = new File([''], 'start-odometer.jpg', { type: 'image/jpeg' });
    const file2 = new File([''], 'end-odometer.jpg', { type: 'image/jpeg' });
    
    // Prepare fetch to return different values for different requests
    mockFetch
      // First call for start odometer
      .mockResolvedValueOnce(createSuccessResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reading: 10000,
                confidence: 0.9
              })
            }
          }
        ]
      }))
      // Second call for end odometer
      .mockResolvedValueOnce(createSuccessResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                reading: 10150,
                confidence: 0.8
              })
            }
          }
        ]
      }));
    
    // 2. Process start odometer
    await wrapper.vm.handleStartImageChange({ target: { files: [file1] } });
    await wrapper.vm.processStartOdometerWithAI();
    
    // 3. Process end odometer
    await wrapper.vm.handleEndImageChange({ target: { files: [file2] } });
    await wrapper.vm.processEndOdometerWithAI();
    
    // 4. Apply extracted data
    await wrapper.vm.applyExtractedData();
    
    // 5. Fill remaining form fields
    await wrapper.find('input[id="date"]').setValue('2025-01-01');
    await wrapper.find('input[id="purpose"]').setValue('Business meeting');
    
    // 6. Submit the form
    await wrapper.find('form').trigger('submit');
    
    // 7. Verify form was submitted with correct data
    expect(wrapper.emitted().submit).toBeTruthy();
    const submittedData = wrapper.emitted().submit[0][0].formData;
    
    expect(submittedData.trip_id).toBe('trip1');
    expect(submittedData.start_odometer).toBe(10000);
    expect(submittedData.end_odometer).toBe(10150);
    expect(submittedData.date).toBe('2025-01-01');
    expect(submittedData.purpose).toBe('Business meeting');
    
    // 8. Verify calculated distance is correct
    expect(wrapper.text()).toContain('Trip Distance: 150.0 miles');
    
    // 9. Verify reimbursement calculation
    expect(wrapper.text()).toContain('Reimbursement: $87.00');
  });
});