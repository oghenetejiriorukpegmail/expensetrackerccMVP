<template>
  <div>
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
    
    <div v-else>
      <div class="mb-6">
        <div class="flex items-center">
          <NuxtLink :to="`/trips/${trip.id}`" class="mr-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </NuxtLink>
          <h1 class="text-2xl font-bold">Edit Trip</h1>
        </div>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <TripForm 
          :trip="trip" 
          :is-submitting="isSubmitting" 
          @submit="updateTrip" 
          @cancel="goBack"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, useSupabaseUser } from '#imports';
import { useTripStore } from '~/stores/tripStore';

// Route and router
const route = useRoute();
const router = useRouter();
const tripId = route.params.id;

// State
const loading = ref(true);
const isSubmitting = ref(false);
const supabaseUser = useSupabaseUser();
const tripStore = useTripStore();
const trip = ref(null);

// Navigate back to trip details
const goBack = () => {
  router.push(`/trips/${tripId}`);
};

// Update trip
const updateTrip = async (formData) => {
  isSubmitting.value = true;
  
  try {
    const updatedTrip = await tripStore.updateTrip(tripId, formData);
    
    if (updatedTrip) {
      // Show success notification in a real app
      router.push(`/trips/${tripId}`);
    } else {
      // Show error notification in a real app
      console.error('Failed to update trip');
    }
  } catch (error) {
    console.error('Error updating trip:', error);
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
      } else {
        console.error('Trip not found or access denied');
      }
    } catch (error) {
      console.error('Error fetching trip:', error);
    } finally {
      loading.value = false;
    }
  }
});
</script>