import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ExpenseForm from '~/components/forms/ExpenseForm.vue';

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

vi.mock('~/stores/expenseStore', () => ({
  useExpenseStore: () => ({
    processReceipt: vi.fn().mockImplementation((file) => {
      // Mock successful receipt processing
      return Promise.resolve({
        vendor: 'Test Vendor',
        amount: 125.99,
        currency: 'USD',
        date: '2025-01-01',
        expenseType: 'meals',
        confidence: 0.9
      });
    })
  })
}));

vi.mock('~/stores/userStore', () => ({
  useUserStore: () => ({
    fetchSettings: vi.fn().mockResolvedValue({}),
    settings: {
      default_currency: 'USD',
      default_expense_type: 'meals'
    }
  })
}));

describe('ExpenseForm Component', () => {
  let wrapper: any;
  
  beforeEach(() => {
    // Create a fresh wrapper before each test
    wrapper = mount(ExpenseForm, {
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
    expect(wrapper.find('select[id="expense_type"]').exists()).toBe(true);
    expect(wrapper.find('input[id="amount"]').exists()).toBe(true);
    expect(wrapper.find('select[id="currency"]').exists()).toBe(true);
    expect(wrapper.find('input[id="date"]').exists()).toBe(true);
  });
  
  it('should apply default settings from user profile', async () => {
    // Wait for onMounted to finish
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(wrapper.vm.form.currency).toBe('USD');
    expect(wrapper.vm.form.expense_type).toBe('meals');
  });
  
  it('should emit submit event with form data when valid', async () => {
    // Fill out the form
    await wrapper.find('select[id="trip_id"]').setValue('trip1');
    await wrapper.find('select[id="expense_type"]').setValue('meals');
    await wrapper.find('input[id="vendor"]').setValue('Test Vendor');
    await wrapper.find('input[id="amount"]').setValue('99.99');
    await wrapper.find('select[id="currency"]').setValue('USD');
    await wrapper.find('input[id="date"]').setValue('2025-01-01');
    
    // Submit the form
    await wrapper.find('form').trigger('submit');
    
    // Check that the submit event was emitted with correct data
    expect(wrapper.emitted().submit).toBeTruthy();
    expect(wrapper.emitted().submit[0][0].formData).toEqual({
      trip_id: 'trip1',
      expense_type: 'meals',
      vendor: 'Test Vendor',
      amount: 99.99,
      currency: 'USD',
      date: '2025-01-01',
      location: '',
      description: '',
      receipt_url: ''
    });
  });
  
  it('should validate the amount field', async () => {
    // Fill out the form partially
    await wrapper.find('select[id="trip_id"]').setValue('trip1');
    await wrapper.find('input[id="amount"]').setValue('-10'); // Invalid negative amount
    
    // Submit the form
    await wrapper.find('form').trigger('submit');
    
    // Check that no submit event was emitted
    expect(wrapper.emitted().submit).toBeFalsy();
    
    // Should show validation error
    expect(wrapper.text()).toContain('Amount must be greater than zero');
  });
  
  it('should process receipt with AI when requested', async () => {
    // Use a mock file
    const file = new File([''], 'receipt.jpg', { type: 'image/jpeg' });
    
    // Set the receipt file directly
    await wrapper.vm.handleReceiptChange({ target: { files: [file] } });
    
    // Call processReceiptWithAI method
    await wrapper.vm.processReceiptWithAI();
    
    // Check the extracted data
    expect(wrapper.vm.extractedData).toBeTruthy();
    expect(wrapper.vm.extractedData.vendor).toBe('Test Vendor');
    expect(wrapper.vm.extractedData.amount).toBe(125.99);
    expect(wrapper.vm.extractedData.confidence).toBe(0.9);
  });
  
  it('should apply extracted data from receipt', async () => {
    // Set the extracted data
    wrapper.vm.extractedData = {
      vendor: 'New Vendor',
      amount: 59.99,
      currency: 'EUR',
      date: '2025-02-02',
      expense_type: 'transportation', // Change this to match the property name used in the component
      confidence: 0.85
    };
    
    // Apply the extracted data
    await wrapper.vm.applyExtractedData();
    
    // Check that the form was updated
    expect(wrapper.vm.form.vendor).toBe('New Vendor');
    expect(wrapper.vm.form.amount).toBe(59.99);
    expect(wrapper.vm.form.currency).toBe('EUR');
    expect(wrapper.vm.form.date).toBe('2025-02-02');
    expect(wrapper.vm.form.expense_type).toBe('transportation');
    
    // Check that extractedData was cleared
    expect(wrapper.vm.extractedData).toBeNull();
  });
});