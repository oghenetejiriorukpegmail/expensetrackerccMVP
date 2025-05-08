<template>
  <div>
    <div class="flex items-center mb-6">
      <NuxtLink to="/expenses" class="mr-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold">Create New Expense</h1>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <form @submit.prevent="saveExpense">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Trip Selection -->
          <div class="md:col-span-2">
            <label for="trip_id" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trip <span class="text-red-600">*</span>
            </label>
            <select
              id="trip_id"
              v-model="form.trip_id"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="" disabled>Select a trip</option>
              <option v-for="trip in trips" :key="trip.id" :value="trip.id">
                {{ trip.name }}
              </option>
            </select>
          </div>
          
          <!-- Expense Type -->
          <div>
            <label for="expense_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expense Type <span class="text-red-600">*</span>
            </label>
            <select
              id="expense_type"
              v-model="form.expense_type"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="accommodation">Accommodation</option>
              <option value="transportation">Transportation</option>
              <option value="meals">Meals</option>
              <option value="entertainment">Entertainment</option>
              <option value="business">Business</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <!-- Amount and Currency -->
          <div class="flex space-x-3">
            <div class="flex-1">
              <label for="amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount <span class="text-red-600">*</span>
              </label>
              <input
                id="amount"
                v-model.number="form.amount"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
            <div class="w-1/3">
              <label for="currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                id="currency"
                v-model="form.currency"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
                <option value="JPY">JPY</option>
                <option value="CNY">CNY</option>
                <option value="INR">INR</option>
                <option value="RUB">RUB</option>
                <option value="BRL">BRL</option>
                <option value="MXN">MXN</option>
                <option value="ZAR">ZAR</option>
              </select>
            </div>
          </div>
          
          <!-- Vendor -->
          <div>
            <label for="vendor" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Vendor
            </label>
            <input
              id="vendor"
              v-model="form.vendor"
              type="text"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Name of vendor or merchant"
            />
          </div>
          
          <!-- Date -->
          <div>
            <label for="date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date <span class="text-red-600">*</span>
            </label>
            <input
              id="date"
              v-model="form.date"
              type="date"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <!-- Location -->
          <div>
            <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Location
            </label>
            <input
              id="location"
              v-model="form.location"
              type="text"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="City, Country"
            />
          </div>
          
          <!-- Description -->
          <div class="md:col-span-2">
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter expense details"
            ></textarea>
          </div>
          
          <!-- Receipt Upload -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Receipt
            </label>
            <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <div v-if="receiptPreview" class="mb-4">
                <img 
                  :src="receiptPreview" 
                  alt="Receipt preview" 
                  class="max-h-48 mx-auto rounded-lg shadow-sm" 
                />
                <button 
                  @click="clearReceipt" 
                  type="button"
                  class="mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
              <div v-else-if="receiptProcessing" class="py-6">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Processing receipt...
                </p>
              </div>
              <div v-else>
                <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Drag and drop or click to upload
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  PNG, JPG, GIF, PDF up to 10MB
                </p>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  @change="handleReceiptUpload"
                  class="hidden" 
                  id="receipt-upload"
                  ref="fileInput"
                />
                <button 
                  @click="$refs.fileInput.click()" 
                  type="button"
                  class="mt-4 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                >
                  Select File
                </button>
              </div>
            </div>
          </div>
          
          <!-- Error Message -->
          <div v-if="error" class="md:col-span-2 bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-4 border border-red-200 dark:border-red-800">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
                <div class="mt-2 text-sm text-red-700 dark:text-red-200">{{ error }}</div>
              </div>
            </div>
          </div>
          
          <!-- Buttons -->
          <div class="md:col-span-2 flex justify-end space-x-3 pt-4">
            <NuxtLink
              to="/expenses"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md"
            >
              Cancel
            </NuxtLink>
            
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">Saving...</span>
              <span v-else>Save Expense</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useSupabaseUser, navigateTo, useRoute, useSupabaseClient } from '#imports';
import { useTripStore } from '~/stores/tripStore';
import { useExpenseStore } from '~/stores/expenseStore';
import { useUserStore } from '~/stores/userStore';
import { CurrencyCode, ExpenseType, Expense } from '~/types';

// State
const loading = ref(false);
const error = ref('');
const receiptFile = ref<File | null>(null);
const receiptPreview = ref('');
const receiptProcessing = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

interface ExpenseForm {
  trip_id: string;
  expense_type: ExpenseType;
  amount: number;
  currency: CurrencyCode;
  vendor: string;
  location: string;
  date: string;
  description: string;
  receipt_url: string;
}

const form = ref<ExpenseForm>({
  trip_id: '',
  expense_type: ExpenseType.OTHER,
  amount: 0,
  currency: CurrencyCode.USD,
  vendor: '',
  location: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
  receipt_url: ''
});

const supabaseUser = useSupabaseUser();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const userStore = useUserStore();

// Computed values
const trips = computed(() => tripStore.sortedTrips || []);

// File handling
const handleReceiptUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  
  receiptFile.value = file;
  receiptPreview.value = URL.createObjectURL(file);
  
  // Optional: Process receipt with AI to extract data
  processReceipt(file);
};

const clearReceipt = () => {
  receiptFile.value = null;
  receiptPreview.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Type for AI extracted data
interface ExtractedReceiptData {
  vendor?: string;
  amount?: number;
  currency?: CurrencyCode;
  date?: string;
  location?: string;
  expense_type?: ExpenseType;
  description?: string; // Added description field
  confidence?: number;
}

const processReceipt = async (file: File) => {
  receiptProcessing.value = true;
  
  try {
    const extractedData = await expenseStore.processReceipt(file) as ExtractedReceiptData | null;
    
    if (extractedData) {
      // Populate form with extracted data
      form.value = {
        ...form.value,
        vendor: extractedData.vendor || form.value.vendor,
        amount: extractedData.amount || form.value.amount,
        currency: extractedData.currency || form.value.currency,
        date: extractedData.date || form.value.date,
        location: extractedData.location || form.value.location,
        expense_type: extractedData.expense_type || form.value.expense_type,
        description: extractedData.description || form.value.description // Added description update
      };
    }
  } catch (err) {
    console.error('Error processing receipt:', err);
  } finally {
    receiptProcessing.value = false;
  }
};

// Check authentication status
const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const supabase = useSupabaseClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting authenticated user:', userError);
      return false;
    }
    
    if (!userData || !userData.user) {
      console.error('No authenticated user found');
      return false;
    }
    
    return true;
  } catch (err) {
    console.error('Error checking authentication status:', err);
    return false;
  }
};

// Save expense
const saveExpense = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    // First ensure we're authenticated
    const isAuthenticated = await checkAuthStatus();
    
    if (!isAuthenticated) {
      console.error('User not authenticated before creating expense');
      error.value = 'Your session has expired. Please log in again.';
      
      setTimeout(() => {
        navigateTo('/auth/login');
      }, 2000);
      
      return;
    }
    
    console.log('Creating expense with file:', receiptFile.value ? receiptFile.value.name : 'none');
    const newExpense = await expenseStore.createExpense(form.value, receiptFile.value);
    
    if (newExpense) {
      console.log('Expense created successfully, redirecting to expenses list');
      navigateTo('/expenses');
    } else {
      // Check if there's an error in the store
      if (expenseStore.error) {
        throw new Error(expenseStore.error);
      } else {
        throw new Error('Failed to create expense. Please try again later.');
      }
    }
  } catch (err: any) {
    console.error('Error saving expense:', err);
    
    // Provide more helpful error messages
    if (err.message?.includes('authentication') || err.message?.includes('auth') || err.message?.includes('login')) {
      error.value = 'Your session has expired. Please log in again.';
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigateTo('/auth/login');
      }, 2000);
    } else if (err.message?.includes('receipt') || err.message?.includes('upload')) {
      error.value = 'We couldn\'t upload your receipt. Please try again or skip the receipt for now.';
    } else {
      error.value = err.message || 'An error occurred while saving your expense. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};

// Get route params
const route = useRoute();

// Load data
onMounted(async () => {
  try {
    // First check if we're authenticated
    const isAuthenticated = await checkAuthStatus();
    
    if (!isAuthenticated) {
      console.error('User not authenticated during page load');
      error.value = 'Your session has expired. Please log in again.';
      
      setTimeout(() => {
        navigateTo('/auth/login');
      }, 1000);
      
      return;
    }

    // Load necessary data
    await tripStore.fetchTrips();
    
    // Check if we have a tripId provided in the route query parameters
    const queryTripId = route.query.tripId;
    if (queryTripId && typeof queryTripId === 'string') {
      console.log('Trip ID from route:', queryTripId);
      form.value.trip_id = queryTripId;
    } else {
      // If no tripId parameter, use first active trip as default
      const activeTrips = tripStore.activeTrips;
      if (activeTrips.length > 0) {
        form.value.trip_id = activeTrips[0].id;
      }
    }
    
    // Set default currency from user settings
    try {
      await userStore.fetchSettings();
      
      if (userStore.settings) {
        form.value.currency = userStore.settings.default_currency || CurrencyCode.USD;
        form.value.expense_type = userStore.settings.default_expense_type || ExpenseType.OTHER;
      }
    } catch (err) {
      console.error('Error fetching user settings:', err);
      // Use defaults if settings cannot be fetched
      form.value.currency = CurrencyCode.USD;
      form.value.expense_type = ExpenseType.OTHER;
    }
    
    console.log('Expense form initialized successfully');
  } catch (err) {
    console.error('Error initializing expense form:', err);
    error.value = 'Failed to load initial data. Please try refreshing the page.';
  }
});
</script>