import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MileageForm from '~/components/forms/MileageForm.vue';

// Mock the store
vi.mock('~/stores/tripStore', () => ({
  useTripStore: () => ({
    fetchTrips: vi.fn().mockResolvedValue([]),
    trips: [
      { id: 'trip1', name: 'Business Trip 1' },
      { id: 'trip2', name: 'Business Trip 2' }
    ]
  })
}));

vi.mock('~/stores/mileageStore', () => ({
  useMileageStore: () => ({
    processOdometerImage: vi.fn().mockImplementation((file) => {
      // Mock successful image processing
      return Promise.resolve({
        reading: 12345.6,
        date: '2025-01-01',
        confidence: 0.9
      });
    })
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

describe('MileageForm Component', () => {
  let wrapper: any;
  
  beforeEach(() => {
    // Create a fresh wrapper before each test
    wrapper = mount(MileageForm, {
      props: {
        tripId: '',
        isSubmitting: false
      },
      global: {
        stubs: ['NuxtLink']
      }
    });
  });
  
  it('should render correctly', () => {
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('select[id="trip_id"]').exists()).toBe(true);
    expect(wrapper.find('input[id="start_odometer"]').exists()).toBe(true);
    expect(wrapper.find('input[id="end_odometer"]').exists()).toBe(true);
    expect(wrapper.find('input[id="date"]').exists()).toBe(true);
  });
  
  it('should calculate distance correctly', async () => {
    const startInput = wrapper.find('input[id="start_odometer"]');
    const endInput = wrapper.find('input[id="end_odometer"]');
    
    await startInput.setValue('1000');
    await endInput.setValue('1100');
    
    // Note: The calculated distance is a computed property, but should trigger
    // a display of the distance somewhere in the form
    expect(wrapper.text()).toContain('Trip Distance: 100.0 miles');
  });
  
  it('should show error when end reading is less than start', async () => {
    const startInput = wrapper.find('input[id="start_odometer"]');
    const endInput = wrapper.find('input[id="end_odometer"]');
    
    await startInput.setValue('2000');
    await endInput.setValue('1000');
    
    expect(wrapper.text()).toContain('End odometer must be greater than start odometer');
  });
  
  it('should emit submit event with form data when valid', async () => {
    // Fill out the form
    await wrapper.find('select[id="trip_id"]').setValue('trip1');
    await wrapper.find('input[id="start_odometer"]').setValue('1000');
    await wrapper.find('input[id="end_odometer"]').setValue('1100');
    await wrapper.find('input[id="date"]').setValue('2025-01-01');
    await wrapper.find('input[id="purpose"]').setValue('Test drive');
    
    // Submit the form
    await wrapper.find('form').trigger('submit');
    
    // Check that the submit event was emitted with correct data
    expect(wrapper.emitted().submit).toBeTruthy();
    expect(wrapper.emitted().submit[0][0].formData).toEqual({
      trip_id: 'trip1',
      start_odometer: 1000,
      end_odometer: 1100,
      date: '2025-01-01',
      purpose: 'Test drive',
      image_start_url: '',
      image_end_url: ''
    });
  });
  
  it('should not emit submit when form is invalid', async () => {
    // Fill out the form partially (missing required fields)
    await wrapper.find('input[id="start_odometer"]').setValue('1000');
    
    // Submit the form
    await wrapper.find('form').trigger('submit');
    
    // Check that no submit event was emitted
    expect(wrapper.emitted().submit).toBeFalsy();
    
    // Should show validation error
    expect(wrapper.text()).toContain('Please select a trip');
  });
  
  it('should process odometer image with AI when requested', async () => {
    // Instead of triggering the file input change event, directly call the handler
    const file = new File([''], 'odometer.jpg', { type: 'image/jpeg' });
    
    // Call the handler method directly
    await wrapper.vm.handleStartImageChange({ 
      target: { files: [file] } 
    });
    
    // Trigger AI processing by calling the method directly
    await wrapper.vm.processStartOdometerWithAI();
    
    // Check that AI processing was called
    expect(wrapper.vm.startAiProcessing).toBe(false); // Should be done processing
    expect(wrapper.vm.startExtractedData).toBeTruthy();
    expect(wrapper.vm.startExtractedData.reading).toBe(12345.6);
  });
});