<template>
  <form @submit.prevent="submitForm" class="slide-in-bottom">
    <div class="grid grid-cols-1 gap-6">
      <!-- Trip Selector (if not provided) -->
      <div v-if="!tripId" class="fade-in" style="animation-duration: 0.4s;">
        <label for="trip_id" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Trip <span class="text-red-600">*</span>
        </label>
        <div class="relative">
          <select
            id="trip_id"
            v-model="form.trip_id"
            required
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
          >
            <option value="" disabled>Select a trip</option>
            <option v-for="trip in trips" :key="trip.id" :value="trip.id">
              {{ trip.name }}
            </option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <component :is="ChevronDownIcon" />
          </div>
        </div>
        <div v-if="!trips.length" class="mt-1 text-sm text-red-600 pop-in">
          No trips available. Please create a trip first.
        </div>
      </div>
      
      <!-- Expense Type -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.05s;">
        <label for="expense_type" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Expense Type <span class="text-red-600">*</span>
        </label>
        <div class="relative">
          <select
            id="expense_type"
            v-model="form.expense_type"
            required
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
          >
            <option value="" disabled>Select expense type</option>
            <option value="accommodation">Accommodation</option>
            <option value="transportation">Transportation</option>
            <option value="meals">Meals</option>
            <option value="entertainment">Entertainment</option>
            <option value="business">Business</option>
            <option value="office">Office</option>
            <option value="other">Other</option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <component :is="ChevronDownIcon" />
          </div>
        </div>
      </div>
      
      <!-- Vendor -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.1s;">
        <label for="vendor" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Vendor
        </label>
        <input
          id="vendor"
          v-model="form.vendor"
          type="text"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
          placeholder="Vendor or merchant name"
        />
      </div>
      
      <!-- Amount and Currency -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.15s;">
          <label for="amount" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
            Amount <span class="text-red-600">*</span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500 dark:text-gray-400 sm:text-sm">
                {{ form.currency === 'USD' ? '$' : 
                   form.currency === 'EUR' ? '€' :
                   form.currency === 'GBP' ? '£' : '' }}
              </span>
            </div>
            <input
              id="amount"
              v-model.number="form.amount"
              type="number"
              step="0.01"
              min="0"
              required
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 pl-8 pr-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
              placeholder="0.00"
            />
          </div>
        </div>
        
        <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.15s;">
          <label for="currency" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
            Currency <span class="text-red-600">*</span>
          </label>
          <div class="relative">
            <select
              id="currency"
              v-model="form.currency"
              required
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="JPY">JPY - Japanese Yen</option>
              <option value="CNY">CNY - Chinese Yuan</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="RUB">RUB - Russian Ruble</option>
              <option value="BRL">BRL - Brazilian Real</option>
              <option value="MXN">MXN - Mexican Peso</option>
              <option value="ZAR">ZAR - South African Rand</option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <component :is="ChevronDownIcon" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Date -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.2s;">
        <label for="date" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Date <span class="text-red-600">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <component :is="CalendarIcon" />
          </div>
          <input
            id="date"
            v-model="form.date"
            type="date"
            required
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 pl-10 pr-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
          />
        </div>
      </div>
      
      <!-- Location -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.25s;">
        <label for="location" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Location
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <component :is="LocationIcon" />
          </div>
          <input
            id="location"
            v-model="form.location"
            type="text"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 pl-10 pr-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
            placeholder="City, State/Province"
          />
        </div>
      </div>
      
      <!-- Description -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.3s;">
        <label for="description" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Description
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
          placeholder="Additional details about this expense"
        ></textarea>
        <!-- Debug info for description (hidden in production) -->
        <div v-if="false" class="mt-1 text-xs text-red-500">
          Description value: "{{ form.description }}"
        </div>
      </div>
      
      <!-- Receipt Upload -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.35s;">
        <label class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Receipt
        </label>
        
        <div v-if="form.receipt_url" class="mb-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm pop-in">
          <div class="flex items-center mb-2">
            <div class="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700">
              <component :is="DocumentIcon" />
            </div>
            <div class="ml-3 flex-1">
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {{ receiptFileName }}
              </p>
              <div class="flex space-x-3 mt-1">
                <a
                  :href="form.receipt_url"
                  target="_blank"
                  class="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center"
                >
                  <component :is="EyeIcon" />
                  View
                </a>
                <button 
                  type="button" 
                  @click="removeReceipt" 
                  class="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center"
                >
                  <component :is="TrashIcon" />
                  Remove
                </button>
              </div>
            </div>
          </div>
          <!-- Receipt preview image -->
          <div class="mt-2 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <img 
              v-if="form.receipt_url && !form.receipt_is_pdf" 
              :src="form.receipt_url" 
              alt="Receipt preview" 
              class="max-h-48 w-auto mx-auto object-contain"
            />
            <div 
              v-else 
              class="h-24 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800"
            >
              <component :is="DocumentIcon" class="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" />
              <p class="text-sm text-gray-500 dark:text-gray-400">PDF Document</p>
              <a 
                :href="form.receipt_url" 
                target="_blank" 
                class="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Open PDF
              </a>
            </div>
          </div>
        </div>
        
        <div class="mt-1">
          <div class="flex items-center">
            <label 
              class="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-650 cursor-pointer transition-colors group"
            >
              <component :is="UploadIcon" />
              <span>{{ form.receipt_url ? 'Replace Receipt' : 'Upload Receipt' }}</span>
              <input 
                type="file"
                accept="image/*,application/pdf"
                class="sr-only"
                @change="handleReceiptChange"
              />
            </label>
            
            <button 
              v-if="!form.receipt_url && !isEditing"
              type="button"
              @click="processReceiptWithAI"
              class="ml-3 inline-flex items-center px-4 py-2 border border-primary-200 dark:border-primary-800 rounded-lg shadow-sm text-sm font-medium text-primary-600 dark:text-primary-400 bg-white dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              :disabled="!receiptFile || aiProcessing"
            >
              <component :is="MagicWandIcon" />
              <span v-if="aiProcessing" class="flex items-center">
                <component :is="SpinnerIcon" />
                Processing...
              </span>
              <span v-else>Extract Data with AI</span>
            </button>
          </div>
          
          <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Upload a receipt image or PDF document. Supported formats: JPG, PNG, PDF.
          </p>
        </div>
      </div>
      
      <!-- AI Extracted Data Preview -->
      <div v-if="extractedData" class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 shadow-sm border border-green-100 dark:border-green-800 pop-in">
        <div class="flex">
          <div class="flex-shrink-0">
            <component :is="CheckmarkIcon" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800 dark:text-green-300">
              Data extracted from receipt
            </h3>
            
            <!-- Show API quota message if present -->
            <div v-if="extractedData._userMessage" class="mt-2 text-sm text-yellow-700 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md border border-yellow-100 dark:border-yellow-800">
              {{ extractedData._userMessage }}
            </div>
            
            <div class="mt-2 text-sm text-green-700 dark:text-green-200">
              <p class="text-xs flex items-center">
                <component :is="InfoIcon" />
                Confidence: {{ Math.round(extractedData.confidence * 100) }}%
              </p>
              <ul class="mt-1 list-disc list-inside space-y-1">
                <li v-if="extractedData.vendor" class="slide-in-right" style="animation-delay: 0.1s;">Vendor: {{ extractedData.vendor }}</li>
                <li v-if="extractedData.amount" class="slide-in-right" style="animation-delay: 0.2s;">Amount: {{ extractedData.amount }}</li>
                <li v-if="extractedData.date" class="slide-in-right" style="animation-delay: 0.3s;">Date: {{ extractedData.date }}</li>
                <li v-if="extractedData.expenseType" class="slide-in-right" style="animation-delay: 0.4s;">Type: {{ extractedData.expenseType }}</li>
                <li v-if="extractedData.description" class="slide-in-right" style="animation-delay: 0.5s;">Description: {{ extractedData.description }}</li>
              </ul>
            </div>
            <div class="mt-3">
              <button 
                type="button"
                @click="applyExtractedData"
                class="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/30 py-1 px-3 rounded-full hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors"
              >
                Apply extracted data
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Error Message -->
      <div v-if="errorMessage" class="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-100 dark:border-red-800 shadow-sm pop-in">
        <div class="flex">
          <div class="flex-shrink-0">
            <component :is="ErrorIcon" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-300">
              Error
            </h3>
            <div class="mt-2 text-sm text-red-700 dark:text-red-200">
              <p>{{ errorMessage }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Form Buttons -->
      <div class="flex justify-end space-x-3 pt-4 slide-in-bottom" style="animation-delay: 0.4s;">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors shadow-sm"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-lg shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span v-if="isSubmitting" class="flex items-center">
            <component :is="SpinnerIcon" />
            {{ isEditing ? 'Updating...' : 'Creating...' }}
          </span>
          <span v-else>{{ isEditing ? 'Update Expense' : 'Create Expense' }}</span>
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useTripStore } from '~/stores/tripStore';
import { useExpenseStore } from '~/stores/expenseStore';
import { useUserStore } from '~/stores/userStore';
import { ExpenseType, CurrencyCode } from '~/types';
import dayjs from 'dayjs';
// Import SVG components
import { 
  ChevronDownIcon, 
  CalendarIcon, 
  LocationIcon, 
  DocumentIcon, 
  EyeIcon, 
  TrashIcon,
  UploadIcon,
  MagicWandIcon,
  SpinnerIcon,
  CheckmarkIcon,
  InfoIcon,
  ErrorIcon
} from '~/components/icons/FormIcons.vue';

// Props
const props = defineProps({
  // Initial data for editing mode
  expense: {
    type: Object,
    default: null
  },
  // Pre-selected trip ID (optional)
  tripId: {
    type: String,
    default: ''
  },
  // Loading state
  isSubmitting: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['submit', 'cancel']);

// Stores
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const userStore = useUserStore();

// State
const isEditing = computed(() => !!props.expense);
const trips = ref([]);
const errorMessage = ref('');
const receiptFile = ref(null);
const extractedData = ref(null);
const aiProcessing = ref(false);

// Form state
const form = ref({
  trip_id: props.tripId || '',
  expense_type: '',
  vendor: '',
  amount: '',
  currency: '',
  date: dayjs().format('YYYY-MM-DD'),
  location: '',
  description: '',
  receipt_url: '',
  receipt_is_pdf: false
});

// Get receipt filename from URL
const receiptFileName = computed(() => {
  if (!form.value.receipt_url) return '';
  
  const url = form.value.receipt_url;
  const parts = url.split('/');
  return parts[parts.length - 1];
});

// Initialize form with data for editing
onMounted(async () => {
  // Fetch trips
  await tripStore.fetchTrips();
  trips.value = tripStore.trips;
  
  // Get user settings for defaults
  await userStore.fetchSettings();
  const settings = userStore.settings;
  
  // Set defaults from user settings
  if (settings) {
    form.value.currency = settings.default_currency;
    form.value.expense_type = settings.default_expense_type;
  }
  
  // If editing, populate form with expense data
  if (isEditing.value) {
    const expense = props.expense;
    form.value = {
      trip_id: expense.trip_id,
      expense_type: expense.expense_type,
      vendor: expense.vendor || '',
      amount: expense.amount,
      currency: expense.currency,
      date: expense.date,
      location: expense.location || '',
      description: expense.description || '',
      receipt_url: expense.receipt_url || '',
      receipt_is_pdf: expense.receipt_url ? 
        (expense.receipt_url.toLowerCase().endsWith('.pdf') || 
         expense.receipt_url.toLowerCase().includes('application/pdf')) : false
    };
  }
  
  // Add event listener for receipt description updates
  console.log('Setting up receipt-description-updated event listener');
  window.addEventListener('receipt-description-updated', handleReceiptDescriptionUpdate);
});

// Clean up any blob URLs and event listeners when component is unmounted
onUnmounted(() => {
  if (form.value.receipt_url && form.value.receipt_url.startsWith('blob:')) {
    URL.revokeObjectURL(form.value.receipt_url);
  }
  
  // Remove event listener when component is unmounted
  window.removeEventListener('receipt-description-updated', handleReceiptDescriptionUpdate);
});

// Handle file input change
function handleReceiptChange(event) {
  const file = event.target.files[0];
  if (file) {
    receiptFile.value = file;
    
    // Generate a preview URL for the selected file
    const previewUrl = URL.createObjectURL(file);
    form.value.receipt_url = previewUrl;
    
    // Store the file type for proper preview handling
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      form.value.receipt_is_pdf = true;
    } else {
      form.value.receipt_is_pdf = false;
    }
    
    console.log(`Receipt type: ${file.type}, Is PDF: ${form.value.receipt_is_pdf}`);
  }
}

// Remove receipt
function removeReceipt() {
  // Revoke the object URL to prevent memory leaks
  if (form.value.receipt_url && form.value.receipt_url.startsWith('blob:')) {
    URL.revokeObjectURL(form.value.receipt_url);
  }
  form.value.receipt_url = '';
  form.value.receipt_is_pdf = false;
  receiptFile.value = null;
}

// Process receipt with AI
async function processReceiptWithAI() {
  if (!receiptFile.value) return;
  
  aiProcessing.value = true;
  errorMessage.value = '';
  
  try {
    const extractionResult = await expenseStore.processReceipt(receiptFile.value);
    
    if (!extractionResult) {
      throw new Error('Failed to extract data from receipt');
    }
    
    extractedData.value = extractionResult;
  } catch (error) {
    errorMessage.value = error.message || 'Failed to process receipt. Please try again.';
  } finally {
    aiProcessing.value = false;
  }
}

// Apply extracted data to form
function applyExtractedData() {
  if (!extractedData.value) return;
  
  const data = extractedData.value;
  console.log('Applying extracted data to form:', JSON.stringify(data));
  
  if (data.vendor) form.value.vendor = data.vendor;
  if (data.amount) form.value.amount = data.amount;
  if (data.currency) form.value.currency = data.currency;
  if (data.date) form.value.date = data.date;
  if (data.expense_type) form.value.expense_type = data.expense_type;
  if (data.location) form.value.location = data.location;
  
  // Add explicit logging for the description field
  console.log('Description value in extracted data:', data.description);
  if (data.description) {
    console.log('Setting form description to:', data.description);
    form.value.description = data.description;
  }
  
  // After applying, log the form state
  console.log('Form state after applying data:', JSON.stringify({
    vendor: form.value.vendor,
    amount: form.value.amount,
    expense_type: form.value.expense_type,
    description: form.value.description
  }));
  
  // Clear extracted data after applying
  extractedData.value = null;
}

// Handle receipt description update event
function handleReceiptDescriptionUpdate(event) {
  // Alert for debugging - this will be visible in the browser
  alert('Received description: ' + (event.detail?.description || 'none'));
  console.log('Received receipt description update event:', event.detail);
  
  // Check if we have the necessary data
  if (event.detail && event.detail.description) {
    // Store the received description
    const description = event.detail.description;
    console.log('Setting form description from async update:', description);
    
    // Update the description in the form
    form.value.description = description;
    
    // Log the form state after updating
    console.log('Form state after description update:', JSON.stringify({
      vendor: form.value.vendor,
      amount: form.value.amount,
      expense_type: form.value.expense_type,
      description: form.value.description
    }));
  }
}

// Submit form
function submitForm() {
  errorMessage.value = '';
  
  // Validate form
  if (!form.value.trip_id) {
    errorMessage.value = 'Please select a trip';
    return;
  }
  
  if (form.value.amount <= 0) {
    errorMessage.value = 'Amount must be greater than zero';
    return;
  }
  
  // Prepare form data
  const formData = {
    ...form.value,
    // Ensure amount is a number
    amount: parseFloat(form.value.amount)
  };
  
  // Emit form data and receipt file
  emit('submit', { formData, receiptFile: receiptFile.value });
}
</script>