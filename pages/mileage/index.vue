<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Mileage Tracking</h1>
      <NuxtLink
        to="/mileage/new"
        class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow"
      >
        New Mileage Record
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="mileageRecords.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No mileage records found</h3>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Get started by creating your first mileage record.
      </p>
      <div class="mt-6">
        <NuxtLink
          to="/mileage/new"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow"
        >
          Create First Mileage Record
        </NuxtLink>
      </div>
    </div>

    <div v-else>
      <!-- Filter Controls -->
      <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Trip</label>
            <select 
              v-model="tripFilter"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Trips</option>
              <option v-for="trip in trips" :key="trip.id" :value="trip.id">
                {{ trip.name }}
              </option>
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
              <option value="distance_desc">Distance (Highest First)</option>
              <option value="distance_asc">Distance (Lowest First)</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search mileage records..."
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
      
      <!-- Summary Card -->
      <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Records</h3>
            <p class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{{ filteredMileageRecords.length }}</p>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Miles</h3>
            <p class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{{ formatNumber(totalMileage) }} mi</p>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Mileage Rate</h3>
            <p class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">${{ userSettings.mileage_rate }}/mi</p>
          </div>
          
          <div>
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Reimbursement</h3>
            <p class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(totalMileage * userSettings.mileage_rate) }}</p>
          </div>
        </div>
      </div>
      
      <!-- Mileage List -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="mileage in filteredMileageRecords" :key="mileage.id">
            <MileageCard 
              :mileage="mileage" 
              :mileage-rate="userSettings.mileage_rate"
              :show-actions="true"
              :show-images="true"
              @edit="editMileage"
              @delete="confirmDeleteMileage"
            />
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete this mileage record? This action cannot be undone.
          </p>
          <div class="flex justify-end space-x-3">
            <button 
              @click="showDeleteModal = false"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button 
              @click="deleteMileage"
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
import { useMileageStore } from '~/stores/mileageStore';
import { useUserStore } from '~/stores/userStore';

// State
const loading = ref(true);
const tripFilter = ref('all');
const sortBy = ref('date_desc');
const searchQuery = ref('');
const showDeleteModal = ref(false);
const mileageToDelete = ref(null);

const supabaseUser = useSupabaseUser();
const tripStore = useTripStore();
const mileageStore = useMileageStore();
const userStore = useUserStore();

// Computed values
const trips = computed(() => tripStore.trips || []);
const mileageRecords = computed(() => mileageStore.mileageRecords || []);
const userSettings = computed(() => userStore.settings || { mileage_rate: 0.58 });

const filteredMileageRecords = computed(() => {
  let result = [...mileageRecords.value];
  
  // Apply trip filter
  if (tripFilter.value !== 'all') {
    result = result.filter(record => record.trip_id === tripFilter.value);
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(record => 
      (record.purpose && record.purpose.toLowerCase().includes(query))
    );
  }
  
  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'date_asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'distance_desc':
        return b.distance - a.distance;
      case 'distance_asc':
        return a.distance - b.distance;
      case 'date_desc':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });
  
  return result;
});

const totalMileage = computed(() => {
  return filteredMileageRecords.value.reduce((sum, record) => sum + record.distance, 0);
});

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1
  }).format(value);
};

// Event handlers
const editMileage = (mileage) => {
  navigateTo(`/mileage/${mileage.id}/edit`);
};

const confirmDeleteMileage = (mileage) => {
  mileageToDelete.value = mileage;
  showDeleteModal.value = true;
};

const deleteMileage = async () => {
  if (!mileageToDelete.value) return;
  
  const success = await mileageStore.deleteMileageRecord(mileageToDelete.value.id);
  
  if (success) {
    showDeleteModal.value = false;
    mileageToDelete.value = null;
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
      mileageStore.fetchMileageRecords(),
      userStore.fetchSettings()
    ]);
    
    loading.value = false;
  }
});
</script>