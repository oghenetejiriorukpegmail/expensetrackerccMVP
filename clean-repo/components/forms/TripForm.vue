<template>
  <form @submit.prevent="submitForm" class="slide-in-bottom">
    <div class="grid grid-cols-1 gap-6">
      <!-- Trip Name -->
      <div class="fade-in" style="animation-duration: 0.4s;">
        <label for="name" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Trip Name <span class="text-red-600">*</span>
        </label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
          placeholder="Business Trip to San Francisco"
        />
      </div>
      
      <!-- Trip Description -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.05s;">
        <label for="description" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Description
        </label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
          placeholder="Annual team meeting and conference"
        ></textarea>
      </div>
      
      <!-- Trip Status -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.1s;">
        <label for="status" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
          Status <span class="text-red-600">*</span>
        </label>
        <div class="relative">
          <select
            id="status"
            v-model="form.status"
            required
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <component :is="ChevronDownIcon" />
          </div>
        </div>
      </div>
      
      <!-- Date Range -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.15s;">
          <label for="start_date" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
            Start Date
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <component :is="CalendarIcon" />
            </div>
            <input
              id="start_date"
              v-model="form.start_date"
              type="date"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 pl-10 pr-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
            />
          </div>
        </div>
        
        <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.15s;">
          <label for="end_date" class="block text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-500 dark:from-gray-300 dark:to-gray-400 bg-clip-text text-transparent mb-1">
            End Date
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <component :is="CalendarIcon" />
            </div>
            <input
              id="end_date"
              v-model="form.end_date"
              type="date"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 pl-10 pr-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:border-primary-300 dark:hover:border-primary-700 focus:border-primary-500 focus:ring focus:ring-primary-500 focus:ring-opacity-20 dark:focus:ring-primary-700 dark:focus:ring-opacity-30 transition-all"
            />
          </div>
          <p v-if="dateError" class="mt-1 text-sm text-red-600 pop-in">
            {{ dateError }}
          </p>
        </div>
      </div>
      
      <!-- Location -->
      <div class="fade-in" style="animation-duration: 0.4s; animation-delay: 0.2s;">
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
            placeholder="New York, NY"
          />
        </div>
      </div>
      
      <!-- Status Color Indicators -->
      <div class="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm fade-in" style="animation-duration: 0.4s; animation-delay: 0.25s;">
        <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Trip Status Colors
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="flex items-center space-x-2 slide-in-bottom" style="animation-delay: 0.1s;">
            <div class="h-3 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-400"></div>
            <span class="text-xs text-gray-600 dark:text-gray-400">Planned</span>
          </div>
          <div class="flex items-center space-x-2 slide-in-bottom" style="animation-delay: 0.2s;">
            <div class="h-3 w-8 rounded-full bg-gradient-to-r from-green-500 to-green-400"></div>
            <span class="text-xs text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div class="flex items-center space-x-2 slide-in-bottom" style="animation-delay: 0.3s;">
            <div class="h-3 w-8 rounded-full bg-gradient-to-r from-gray-500 to-gray-400"></div>
            <span class="text-xs text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div class="flex items-center space-x-2 slide-in-bottom" style="animation-delay: 0.4s;">
            <div class="h-3 w-8 rounded-full bg-gradient-to-r from-red-500 to-red-400"></div>
            <span class="text-xs text-gray-600 dark:text-gray-400">Cancelled</span>
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
          :disabled="isSubmitting"
          class="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-lg shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <span v-if="isSubmitting" class="flex items-center">
            <component :is="SpinnerIcon" />
            {{ isEditing ? 'Updating...' : 'Creating...' }}
          </span>
          <span v-else>{{ isEditing ? 'Update Trip' : 'Create Trip' }}</span>
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { TripStatus } from '~/types';
import dayjs from 'dayjs';
// Import SVG components
import {
  ChevronDownIcon,
  CalendarIcon,
  LocationIcon,
  ErrorIcon,
  SpinnerIcon
} from '~/components/icons/FormIcons.vue';

// Props
const props = defineProps({
  // Initial data for editing mode
  trip: {
    type: Object,
    default: null
  },
  // Loading state
  isSubmitting: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits(['submit', 'cancel']);

// State
const isEditing = computed(() => !!props.trip);
const errorMessage = ref('');
const dateError = ref('');

// Form state
const form = ref({
  name: '',
  description: '',
  status: TripStatus.PLANNED,
  start_date: '',
  end_date: '',
  location: ''
});

// Initialize form with data for editing
onMounted(() => {
  if (isEditing.value) {
    const trip = props.trip;
    form.value = {
      name: trip.name,
      description: trip.description || '',
      status: trip.status,
      start_date: trip.start_date || '',
      end_date: trip.end_date || '',
      location: trip.location || ''
    };
  }
});

// Watch date changes to validate
watch([() => form.value.start_date, () => form.value.end_date], ([start, end]) => {
  validateDates(start, end);
});

// Validate dates
function validateDates(start, end) {
  dateError.value = '';
  
  if (start && end) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate > endDate) {
      dateError.value = 'End date cannot be before start date';
    }
  }
}

// Submit form
function submitForm() {
  errorMessage.value = '';
  
  // Validate form
  if (!form.value.name.trim()) {
    errorMessage.value = 'Trip name is required';
    return;
  }
  
  // Validate dates
  if (form.value.start_date && form.value.end_date) {
    validateDates(form.value.start_date, form.value.end_date);
    
    if (dateError.value) {
      errorMessage.value = dateError.value;
      return;
    }
  }
  
  // Emit form data
  emit('submit', { ...form.value });
}
</script>