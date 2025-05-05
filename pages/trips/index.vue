<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">My Trips</h1>
      <NuxtLink
        to="/trips/new"
        class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow"
      >
        New Trip
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="trips.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No trips found</h3>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Get started by creating your first trip.
      </p>
      <div class="mt-6">
        <NuxtLink
          to="/trips/new"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow"
        >
          Create First Trip
        </NuxtLink>
      </div>
    </div>

    <div v-else>
      <!-- Filter Controls -->
      <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Status</label>
            <select 
              v-model="statusFilter"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
            <select 
              v-model="sortBy"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="date_desc">Date (Newest First)</option>
              <option value="date_asc">Date (Oldest First)</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search trips..."
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
      
      <!-- Trip Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="trip in filteredTrips" :key="trip.id">
          <TripCard 
            :trip="trip" 
            :show-actions="true"
            :show-view-button="true"
            :stats="{
              expenseCount: getExpenseCount(trip.id),
              totalAmount: getTripTotalAmount(trip.id),
              totalMileage: getTripTotalMileage(trip.id)
            }"
            @edit="editTrip"
            @delete="confirmDeleteTrip"
          />
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete trip "{{ tripToDelete?.name }}"? This action cannot be undone.
          </p>
          <div class="flex justify-end space-x-3">
            <button 
              @click="showDeleteModal = false"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button 
              @click="deleteTrip"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSupabaseUser, navigateTo } from '#imports';
import { useTripStore } from '~/stores/tripStore';
import { useExpenseStore } from '~/stores/expenseStore';
import { useMileageStore } from '~/stores/mileageStore';

// State
const loading = ref(true);
const statusFilter = ref('all');
const sortBy = ref('date_desc');
const searchQuery = ref('');
const showDeleteModal = ref(false);
const tripToDelete = ref(null);

const supabaseUser = useSupabaseUser();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const mileageStore = useMileageStore();

// Computed values
const trips = computed(() => tripStore.trips || []);

const filteredTrips = computed(() => {
  let result = [...trips.value];
  
  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(trip => trip.status === statusFilter.value);
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(trip => 
      trip.name.toLowerCase().includes(query) || 
      (trip.description && trip.description.toLowerCase().includes(query)) ||
      (trip.location && trip.location.toLowerCase().includes(query))
    );
  }
  
  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'date_asc':
        return new Date(a.start_date || a.created_at).getTime() - new Date(b.start_date || b.created_at).getTime();
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'date_desc':
      default:
        return new Date(b.start_date || b.created_at).getTime() - new Date(a.start_date || a.created_at).getTime();
    }
  });
  
  return result;
});

// Helper functions
const getExpenseCount = (tripId) => {
  return expenseStore.expenses.filter(expense => expense.trip_id === tripId).length;
};

const getTripTotalAmount = (tripId) => {
  return expenseStore.tripTotalAmount(tripId);
};

const getTripTotalMileage = (tripId) => {
  return mileageStore.tripTotalDistance(tripId);
};

// Event handlers
const editTrip = (trip) => {
  navigateTo(`/trips/edit/${trip.id}`);
};

const confirmDeleteTrip = (trip) => {
  tripToDelete.value = trip;
  showDeleteModal.value = true;
};

const deleteTrip = async () => {
  if (!tripToDelete.value) return;
  
  const success = await tripStore.deleteTrip(tripToDelete.value.id);
  
  if (success) {
    showDeleteModal.value = false;
    tripToDelete.value = null;
    // Show success notification in a real app
  } else {
    // Show error notification in a real app
  }
};

// Load data
onMounted(async () => {
  if (supabaseUser.value) {
    // Load all data in parallel
    await Promise.all([
      tripStore.fetchTrips(),
      expenseStore.fetchExpenses(),
      mileageStore.fetchMileageRecords()
    ]);
    
    loading.value = false;
  }
});
</script>