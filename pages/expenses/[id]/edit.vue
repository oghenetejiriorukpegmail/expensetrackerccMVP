<template>
  <div>
    <div class="flex items-center mb-6">
      <NuxtLink to="/expenses" class="mr-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold">Edit Expense</h1>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
      {{ error }}
    </div>

    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <form @submit.prevent="updateExpense">
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
              <div v-if="form.receipt_url || receiptPreview" class="mb-4">
                <img 
                  :src="receiptPreview || form.receipt_url" 
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
              <span v-else>Update Expense</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSupabaseUser, navigateTo, useRoute } from '#imports';
import { useTripStore } from '~/stores/tripStore';
import { useExpenseStore } from '~/stores/expenseStore';
import { CurrencyCode, ExpenseType } from '~/types';

// Get the expense ID from the route
const route = useRoute();
const expenseId = route.params.id;

// State
const loading = ref(true);
const error = ref('');
const receiptFile = ref(null);
const receiptPreview = ref('');
const receiptProcessing = ref(false);
const fileInput = ref(null);

const form = ref({
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

// Computed values
const trips = computed(() => tripStore.sortedTrips || []);

// File handling
const handleReceiptUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  receiptFile.value = file;
  receiptPreview.value = URL.createObjectURL(file);
  
  // Clear previous receipt URL when new file is uploaded
  form.value.receipt_url = '';
};

const clearReceipt = () => {
  receiptFile.value = null;
  receiptPreview.value = '';
  form.value.receipt_url = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Watch for description updates from the store
watch(
  () => expenseStore.generatedDescription,
  (newDescription) => {
    if (newDescription) {
      // Update the form with the new description
      form.value.description = newDescription;
    }
  }
);

// Update expense
const updateExpense = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const updatedExpense = await expenseStore.updateExpense(
      expenseId, 
      {
        trip_id: form.value.trip_id,
        expense_type: form.value.expense_type,
        amount: form.value.amount,
        currency: form.value.currency,
        vendor: form.value.vendor,
        location: form.value.location,
        date: form.value.date,
        description: form.value.description,
        receipt_url: form.value.receipt_url,
      },
      receiptFile.value
    );
    
    if (updatedExpense) {
      navigateTo('/expenses');
    } else {
      throw new Error('Failed to update expense');
    }
  } catch (err) {
    error.value = err.message || 'An error occurred while updating the expense';
  } finally {
    loading.value = false;
  }
};

// Load data
onMounted(async () => {
  if (supabaseUser.value) {
    try {
      // Load trips and expense in parallel
      await Promise.all([
        tripStore.fetchTrips(),
        expenseStore.fetchExpense(expenseId)
      ]);
      
      const expense = expenseStore.currentExpense;
      
      if (!expense) {
        error.value = 'Expense not found';
        return;
      }
      
      // Populate form with expense data
      form.value = {
        trip_id: expense.trip_id,
        expense_type: expense.expense_type,
        amount: expense.amount,
        currency: expense.currency,
        vendor: expense.vendor || '',
        location: expense.location || '',
        date: expense.date,
        description: expense.description || '',
        receipt_url: expense.receipt_url || ''
      };
    } catch (err) {
      error.value = err.message || 'Failed to load expense data';
    } finally {
      loading.value = false;
    }
  }
});
</script>