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
      
      <!-- Odometer Readings -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.05s;">
          <label for="start_odometer" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
            Start Odometer <span class="text-red-600">*</span>
          </label>
          <div class="flex items-center relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <component :is="OdometerIcon" />
            </div>
            <input
              id="start_odometer"
              v-model.number="form.start_odometer"
              type="number"
              step="0.1"
              min="0"
              required
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 pl-10 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
              placeholder="Starting mileage"
            />
            <span class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 text-sm">mi</span>
          </div>
        </div>
        
        <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.05s;">
          <label for="end_odometer" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
            End Odometer <span class="text-red-600">*</span>
          </label>
          <div class="flex items-center relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <component :is="OdometerIcon" />
            </div>
            <input
              id="end_odometer"
              v-model.number="form.end_odometer"
              type="number"
              step="0.1"
              min="0"
              required
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 pl-10 pr-10 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
              placeholder="Ending mileage"
            />
            <span class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 text-sm">mi</span>
          </div>
          <div v-if="form.start_odometer && form.end_odometer && calculatedDistance < 0" class="mt-1 text-sm text-red-600 pop-in">
            End odometer must be greater than start odometer
          </div>
        </div>
      </div>
      
      <!-- Total Distance Display -->
      <div v-if="calculatedDistance > 0" class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 shadow-sm border border-indigo-100 dark:border-indigo-800/50 slide-in-bottom" style="animation-delay: 0.1s;">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-full">
              <svg class="h-6 w-6 text-indigo-600 dark:text-indigo-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 10h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6H2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2z" />
              </svg>
            </div>
          </div>
          <div class="ml-3">
            <h3 class="text-md font-medium bg-gradient-to-r from-indigo-700 to-purple-600 dark:from-indigo-400 dark:to-purple-300 bg-clip-text text-transparent">
              Trip Distance: {{ calculatedDistance.toFixed(1) }} miles
            </h3>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span class="font-semibold bg-gradient-to-r from-green-600 to-teal-500 dark:from-green-400 dark:to-teal-300 bg-clip-text text-transparent">
                Reimbursement: {{ formatCurrency(calculatedDistance * mileageRate) }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">
                (at {{ mileageRate.toFixed(2) }}/mile rate)
              </span>
            </p>
          </div>
        </div>
      </div>
      
      <!-- Date -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.1s;">
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
      
      <!-- Purpose -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.15s;">
        <label for="purpose" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Purpose
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <component :is="QuestionIcon" />
          </div>
          <input
            id="purpose"
            v-model="form.purpose"
            type="text"
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 pl-10 pr-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
            placeholder="Client meeting, airport pickup, etc."
          />
        </div>
      </div>
      
      <!-- Start Odometer Image Upload -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.2s;">
        <label class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Start Odometer Photo
        </label>
        
        <div v-if="form.image_start_url" class="mb-3 flex items-center p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm pop-in">
          <div class="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <img
              v-if="form.image_start_url"
              :src="form.image_start_url"
              alt="Start Odometer"
              class="h-full w-full object-cover"
            />
            <component :is="CameraPreviewIcon" v-else />
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              Start Odometer Photo
            </p>
            <div class="flex space-x-3 mt-1">
              <a
                :href="form.image_start_url"
                target="_blank"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
              >
                <component :is="EyeIcon" />
                View
              </a>
              <button 
                type="button" 
                @click="removeStartImage" 
                class="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center"
              >
                <component :is="TrashIcon" />
                Remove
              </button>
            </div>
          </div>
        </div>
        
        <div class="mt-1">
          <div class="flex items-center">
            <label 
              class="flex items-center justify-center px-4 py-2 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-sm text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors group"
            >
              <component :is="CameraIcon" />
              <span>{{ form.image_start_url ? 'Replace Photo' : 'Upload Photo' }}</span>
              <input 
                type="file"
                accept="image/*"
                class="sr-only"
                @change="handleStartImageChange"
              />
            </label>
            
            <button 
              v-if="!form.image_start_url && !isEditing && startOdometerFile"
              type="button"
              @click="processStartOdometerWithAI"
              class="ml-3 inline-flex items-center px-4 py-2 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-sm text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              :disabled="!startOdometerFile || startAiProcessing"
            >
              <component :is="MagicWandIcon" />
              <span v-if="startAiProcessing" class="flex items-center">
                <component :is="SpinnerIcon" />
                Processing...
              </span>
              <span v-else>Extract Reading</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- End Odometer Image Upload -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.25s;">
        <label class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          End Odometer Photo
        </label>
        
        <div v-if="form.image_end_url" class="mb-3 flex items-center p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm pop-in">
          <div class="w-12 h-12 rounded-full border border-gray-300 dark:border-gray-600 overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <img
              v-if="form.image_end_url"
              :src="form.image_end_url"
              alt="End Odometer"
              class="h-full w-full object-cover"
            />
            <component :is="CameraPreviewIcon" v-else />
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              End Odometer Photo
            </p>
            <div class="flex space-x-3 mt-1">
              <a
                :href="form.image_end_url"
                target="_blank"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
              >
                <component :is="EyeIcon" />
                View
              </a>
              <button 
                type="button" 
                @click="removeEndImage" 
                class="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center"
              >
                <component :is="TrashIcon" />
                Remove
              </button>
            </div>
          </div>
        </div>
        
        <div class="mt-1">
          <div class="flex items-center">
            <label 
              class="flex items-center justify-center px-4 py-2 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-sm text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors group"
            >
              <component :is="CameraIcon" />
              <span>{{ form.image_end_url ? 'Replace Photo' : 'Upload Photo' }}</span>
              <input 
                type="file"
                accept="image/*"
                class="sr-only"
                @change="handleEndImageChange"
              />
            </label>
            
            <button 
              v-if="!form.image_end_url && !isEditing && endOdometerFile"
              type="button"
              @click="processEndOdometerWithAI"
              class="ml-3 inline-flex items-center px-4 py-2 border border-indigo-200 dark:border-indigo-800 rounded-lg shadow-sm text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              :disabled="!endOdometerFile || endAiProcessing"
            >
              <component :is="MagicWandIcon" />
              <span v-if="endAiProcessing" class="flex items-center">
                <component :is="SpinnerIcon" />
                Processing...
              </span>
              <span v-else>Extract Reading</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- AI Extracted Data Preview -->
      <div v-if="startExtractedData || endExtractedData" 
           :class="hasLowConfidenceReadings || hasInvalidReadings ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20'" 
           class="rounded-lg p-4 shadow-sm border-2 border-t-0 border-r-0 border-l-0 border-b-green-200 dark:border-b-green-800 pop-in">
        <div class="flex">
          <div class="flex-shrink-0">
            <div :class="hasLowConfidenceReadings || hasInvalidReadings ? 'bg-yellow-100 dark:bg-yellow-900/50' : 'bg-green-100 dark:bg-green-900/50'" class="p-2 rounded-full">
              <component :is="WarningIcon" v-if="hasLowConfidenceReadings || hasInvalidReadings" />
              <component :is="CheckmarkIcon" v-else />
            </div>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium" :class="hasLowConfidenceReadings || hasInvalidReadings ? 'text-yellow-800 dark:text-yellow-300' : 'text-green-800 dark:text-green-300'">
              Data extracted from odometer photos
            </h3>
            <div class="mt-2 text-sm" :class="hasLowConfidenceReadings || hasInvalidReadings ? 'text-yellow-700 dark:text-yellow-200' : 'text-green-700 dark:text-green-200'">
              <ul class="list-disc list-inside space-y-1">
                <li v-if="startExtractedData" class="slide-in-right" style="animation-delay: 0.1s;">
                  Start: {{ startExtractedData.reading }} 
                  <span class="text-xs" :class="startExtractedData.confidence < 0.6 ? 'text-yellow-600 dark:text-yellow-400 font-medium' : ''">
                    ({{ Math.round(startExtractedData.confidence * 100) }}% confidence)
                  </span>
                  <span v-if="startExtractedData.confidence < 0.4" class="text-xs text-yellow-600 dark:text-yellow-400 font-medium ml-1">
                    ⚠️ Low confidence
                  </span>
                </li>
                <li v-if="endExtractedData" class="slide-in-right" style="animation-delay: 0.2s;">
                  End: {{ endExtractedData.reading }}
                  <span class="text-xs" :class="endExtractedData.confidence < 0.6 ? 'text-yellow-600 dark:text-yellow-400 font-medium' : ''">
                    ({{ Math.round(endExtractedData.confidence * 100) }}% confidence)
                  </span>
                  <span v-if="endExtractedData.confidence < 0.4" class="text-xs text-yellow-600 dark:text-yellow-400 font-medium ml-1">
                    ⚠️ Low confidence
                  </span>
                </li>
              </ul>
              
              <!-- Invalid readings warning -->
              <div v-if="hasInvalidReadings" class="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg text-xs slide-in-bottom" style="animation-delay: 0.2s;">
                <strong>Warning:</strong> End reading appears to be lower than start reading. Please verify the values or try with clearer images.
              </div>
              
              <!-- Low confidence warning -->
              <div v-else-if="hasLowConfidenceReadings" class="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg text-xs slide-in-bottom" style="animation-delay: 0.2s;">
                <strong>Note:</strong> Some readings have low confidence. Verify the extracted values before proceeding.
              </div>
            </div>
            <div class="mt-3 flex space-x-4">
              <button 
                type="button"
                @click="applyExtractedData"
                :class="hasLowConfidenceReadings || hasInvalidReadings ? 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' : 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50'"
                class="text-sm py-1 px-3 rounded-full transition-colors"
              >
                Apply extracted data
              </button>
              <button 
                v-if="hasLowConfidenceReadings || hasInvalidReadings"
                type="button"
                @click="clearExtractedData"
                class="text-sm text-gray-600 dark:text-gray-400 py-1 px-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                Clear and try again
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
      <div class="flex justify-end space-x-3 pt-4 slide-in-bottom" style="animation-delay: 0.3s;">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors shadow-sm"
        >
          Cancel
        </button>
        
        <button
          type="submit"
          :disabled="isSubmitting || !isFormValid"
          class="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-700 hover:to-purple-600 text-white rounded-lg shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span v-if="isSubmitting" class="flex items-center">
            <component :is="SpinnerIcon" />
            {{ isEditing ? 'Updating...' : 'Creating...' }}
          </span>
          <span v-else>{{ isEditing ? 'Update Mileage' : 'Create Mileage Record' }}</span>
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useTripStore } from '~/stores/tripStore';
import { useMileageStore } from '~/stores/mileageStore';
import { useUserStore } from '~/stores/userStore';
import dayjs from 'dayjs';
// Import SVG components
import {
  ChevronDownIcon,
  CalendarIcon,
  OdometerIcon,
  QuestionIcon,
  CameraIcon,
  MagicWandIcon,
  SpinnerIcon,
  EyeIcon,
  TrashIcon,
  CameraPreviewIcon,
  CheckmarkIcon,
  WarningIcon,
  ErrorIcon
} from '~/components/icons/FormIcons.vue';

// Props
const props = defineProps({
  // Initial data for editing mode
  mileage: {
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
const mileageStore = useMileageStore();
const userStore = useUserStore();

// State
const isEditing = computed(() => !!props.mileage);
const trips = ref([]);
const errorMessage = ref('');
const startOdometerFile = ref(null);
const endOdometerFile = ref(null);
const startExtractedData = ref(null);
const endExtractedData = ref(null);
const startAiProcessing = ref(false);
const endAiProcessing = ref(false);
const mileageRate = ref(0.58);

// Form state
const form = ref({
  trip_id: props.tripId || '',
  start_odometer: '',
  end_odometer: '',
  date: dayjs().format('YYYY-MM-DD'),
  purpose: '',
  image_start_url: '',
  image_end_url: ''
});

// Computed values
const calculatedDistance = computed(() => {
  if (!form.value.start_odometer || !form.value.end_odometer) {
    return 0;
  }
  
  return form.value.end_odometer - form.value.start_odometer;
});

const isFormValid = computed(() => {
  return (
    form.value.trip_id &&
    form.value.start_odometer &&
    form.value.end_odometer &&
    form.value.date &&
    calculatedDistance.value > 0
  );
});

// Check if either of the extracted readings has low confidence
const hasLowConfidenceReadings = computed(() => {
  return (
    (startExtractedData.value && startExtractedData.value.confidence < 0.4) ||
    (endExtractedData.value && endExtractedData.value.confidence < 0.4)
  );
});

// Check if the extracted readings are invalid (end lower than start)
const hasInvalidReadings = computed(() => {
  return (
    startExtractedData.value &&
    endExtractedData.value &&
    typeof startExtractedData.value.reading === 'number' &&
    typeof endExtractedData.value.reading === 'number' &&
    endExtractedData.value.reading < startExtractedData.value.reading
  );
});

// Initialize form and load data
onMounted(async () => {
  // Fetch trips
  await tripStore.fetchTrips();
  trips.value = tripStore.trips;
  
  // Get user settings for mileage rate
  await userStore.fetchSettings();
  if (userStore.settings) {
    mileageRate.value = userStore.settings.mileage_rate;
  }
  
  // If editing, populate form with mileage data
  if (isEditing.value) {
    const mileage = props.mileage;
    form.value = {
      trip_id: mileage.trip_id,
      start_odometer: mileage.start_odometer,
      end_odometer: mileage.end_odometer,
      date: mileage.date,
      purpose: mileage.purpose || '',
      image_start_url: mileage.image_start_url || '',
      image_end_url: mileage.image_end_url || ''
    };
  }
});

// Handle file input change for start odometer
function handleStartImageChange(event) {
  const file = event.target.files[0];
  if (file) {
    startOdometerFile.value = file;
  }
}

// Handle file input change for end odometer
function handleEndImageChange(event) {
  const file = event.target.files[0];
  if (file) {
    endOdometerFile.value = file;
  }
}

// Remove start odometer image
function removeStartImage() {
  form.value.image_start_url = '';
  startOdometerFile.value = null;
}

// Remove end odometer image
function removeEndImage() {
  form.value.image_end_url = '';
  endOdometerFile.value = null;
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Process start odometer image with AI
async function processStartOdometerWithAI() {
  if (!startOdometerFile.value) return;
  
  startAiProcessing.value = true;
  errorMessage.value = '';
  
  try {
    const extractionResult = await mileageStore.processOdometerImage(startOdometerFile.value);
    
    if (!extractionResult) {
      throw new Error('Failed to extract reading from start odometer image');
    }
    
    // Validate the extracted reading - must be a number
    if (typeof extractionResult.reading !== 'number' || isNaN(extractionResult.reading)) {
      throw new Error('Unable to extract a valid odometer reading from the image');
    }
    
    // Check confidence level
    if (extractionResult.confidence < 0.4) {
      // Still show the extracted data but with a warning
      console.warn('Low confidence in start odometer reading extraction:', extractionResult.confidence);
    }
    
    startExtractedData.value = extractionResult;
  } catch (error) {
    // Provide more specific error messages based on error type
    if (error.code === 'network_error') {
      errorMessage.value = 'Network error while processing image. Please check your connection and try again.';
    } else if (error.code === 'timeout') {
      errorMessage.value = 'The request timed out. Please try again with a clearer image.';
    } else if (error.code === 'rate_limit') {
      errorMessage.value = 'Too many requests. Please wait a moment before trying again.';
    } else if (error.code === 'no_reading_found') {
      errorMessage.value = 'No odometer reading could be found in the image. Please try with a clearer image of the dashboard.';
    } else if (error.code === 'image_processing_error') {
      errorMessage.value = 'Error processing the image. Please try with a different image format or smaller file size.';
    } else {
      // Generic error fallback
      errorMessage.value = error.message || 'Failed to process start odometer image. Please try again.';
    }
    
    // Add retry suggestion for retryable errors
    if (error.retryable) {
      errorMessage.value += ' You can try again in a few moments.';
    }
  } finally {
    startAiProcessing.value = false;
  }
}

// Process end odometer image with AI
async function processEndOdometerWithAI() {
  if (!endOdometerFile.value) return;
  
  endAiProcessing.value = true;
  errorMessage.value = '';
  
  try {
    const extractionResult = await mileageStore.processOdometerImage(endOdometerFile.value);
    
    if (!extractionResult) {
      throw new Error('Failed to extract reading from end odometer image');
    }
    
    // Validate the extracted reading - must be a number
    if (typeof extractionResult.reading !== 'number' || isNaN(extractionResult.reading)) {
      throw new Error('Unable to extract a valid odometer reading from the image');
    }
    
    // Check confidence level
    if (extractionResult.confidence < 0.4) {
      // Still show the extracted data but with a warning
      console.warn('Low confidence in end odometer reading extraction:', extractionResult.confidence);
    }
    
    // Check if reading is reasonable (compare to start if available)
    if (startExtractedData.value && 
        typeof startExtractedData.value.reading === 'number' && 
        extractionResult.reading < startExtractedData.value.reading) {
      console.warn('End odometer reading is less than start reading');
      // Still show the data but with a warning in UI
    }
    
    endExtractedData.value = extractionResult;
  } catch (error) {
    // Provide more specific error messages based on error type
    if (error.code === 'network_error') {
      errorMessage.value = 'Network error while processing image. Please check your connection and try again.';
    } else if (error.code === 'timeout') {
      errorMessage.value = 'The request timed out. Please try again with a clearer image.';
    } else if (error.code === 'rate_limit') {
      errorMessage.value = 'Too many requests. Please wait a moment before trying again.';
    } else if (error.code === 'no_reading_found') {
      errorMessage.value = 'No odometer reading could be found in the image. Please try with a clearer image of the dashboard.';
    } else if (error.code === 'image_processing_error') {
      errorMessage.value = 'Error processing the image. Please try with a different image format or smaller file size.';
    } else {
      // Generic error fallback
      errorMessage.value = error.message || 'Failed to process end odometer image. Please try again.';
    }
    
    // Add retry suggestion for retryable errors
    if (error.retryable) {
      errorMessage.value += ' You can try again in a few moments.';
    }
  } finally {
    endAiProcessing.value = false;
  }
}

// Apply extracted data to form
function applyExtractedData() {
  if (startExtractedData.value && startExtractedData.value.reading) {
    form.value.start_odometer = startExtractedData.value.reading;
  }
  
  if (endExtractedData.value && endExtractedData.value.reading) {
    form.value.end_odometer = endExtractedData.value.reading;
  }
  
  // Clear extracted data after applying
  clearExtractedData();
}

// Clear extracted data without applying
function clearExtractedData() {
  startExtractedData.value = null;
  endExtractedData.value = null;
  errorMessage.value = '';
}

// Submit form
function submitForm() {
  errorMessage.value = '';
  
  // Validate form
  if (!form.value.trip_id) {
    errorMessage.value = 'Please select a trip';
    return;
  }
  
  if (!form.value.start_odometer || !form.value.end_odometer) {
    errorMessage.value = 'Both start and end odometer readings are required';
    return;
  }
  
  if (calculatedDistance.value <= 0) {
    errorMessage.value = 'End odometer reading must be greater than start odometer reading';
    return;
  }
  
  // Prepare form data
  const formData = {
    ...form.value,
    // Ensure odometer readings are numbers
    start_odometer: parseFloat(form.value.start_odometer),
    end_odometer: parseFloat(form.value.end_odometer)
  };
  
  // Emit form data and image files
  emit('submit', { 
    formData, 
    startOdometerFile: startOdometerFile.value,
    endOdometerFile: endOdometerFile.value
  });
}
</script>