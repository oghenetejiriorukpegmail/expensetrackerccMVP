<template>
  <div>
    <div class="flex items-center mb-6">
      <NuxtLink :to="`/trips/${tripId}`" class="mr-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold">Edit Trip</h1>
    </div>
    
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
    
    <div v-else-if="!trip" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">Trip not found</h3>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        The trip you are trying to edit does not exist or you don't have permission to edit it.
      </p>
      <div class="mt-6">
        <NuxtLink
          to="/trips"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow"
        >
          Back to Trips
        </NuxtLink>
      </div>
    </div>
    
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
      {{ error }}
    </div>
    
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <form @submit.prevent="updateTrip">
        <div class="grid grid-cols-1 gap-6">
          <!-- Trip Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trip Name <span class="text-red-600">*</span>
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Business Trip to San Francisco"
            />
          </div>
          
          <!-- Trip Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="3"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Annual team meeting and conference"
            ></textarea>
          </div>
          
          <!-- Trip Status -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status <span class="text-red-600">*</span>
            </label>
            <select
              id="status"
              v-model="form.status"
              required
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <!-- Date Range -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="start_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date
              </label>
              <input
                id="start_date"
                v-model="form.start_date"
                type="date"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label for="end_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date
              </label>
              <input
                id="end_date"
                v-model="form.end_date"
                type="date"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
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
              placeholder="New York, NY"
            />
          </div>
          
          <!-- Buttons -->
          <div class="flex justify-end space-x-3 pt-4">
            <NuxtLink
              :to="`/trips/${tripId}`"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md"
            >
              Cancel
            </NuxtLink>
            
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isSubmitting">Updating...</span>
              <span v-else>Update Trip</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, useSupabaseUser } from '#imports';
import { useTripStore } from '~/stores/tripStore';
import { TripStatus } from '~/types';

// Route and router
const route = useRoute();
const router = useRouter();
const tripId = route.params.id;

// State
const loading = ref(true);
const isSubmitting = ref(false);
const error = ref('');
const supabaseUser = useSupabaseUser();
const tripStore = useTripStore();
const trip = ref(null);
const form = ref({
  name: '',
  description: '',
  status: TripStatus.PLANNED,
  start_date: '',
  end_date: '',
  location: ''
});

// Update trip
const updateTrip = async () => {
  isSubmitting.value = true;
  error.value = '';
  
  try {
    // Validate dates
    if (form.value.start_date && form.value.end_date) {
      if (new Date(form.value.start_date) > new Date(form.value.end_date)) {
        error.value = 'End date cannot be before start date';
        isSubmitting.value = false;
        return;
      }
    }
    
    const updatedTrip = await tripStore.updateTrip(tripId, {
      name: form.value.name,
      description: form.value.description,
      status: form.value.status,
      start_date: form.value.start_date || null,
      end_date: form.value.end_date || null,
      location: form.value.location
    });
    
    if (updatedTrip) {
      // Navigate back to trip details
      router.push(`/trips/${tripId}`);
    } else {
      throw new Error('Failed to update trip');
    }
  } catch (err) {
    error.value = err.message || 'An error occurred while updating the trip';
  } finally {
    isSubmitting.value = false;
  }
};

// Load trip data
onMounted(async () => {
  if (supabaseUser.value) {
    try {
      // Fetch trip data
      const tripData = await tripStore.fetchTrip(tripId);
      
      if (tripData) {
        trip.value = tripData;
        // Populate form with trip data
        form.value = {
          name: tripData.name,
          description: tripData.description || '',
          status: tripData.status,
          start_date: tripData.start_date || '',
          end_date: tripData.end_date || '',
          location: tripData.location || ''
        };
      } else {
        error.value = 'Trip not found or access denied';
      }
    } catch (err) {
      error.value = err.message || 'Failed to load trip data';
    } finally {
      loading.value = false;
    }
  }
});
</script>