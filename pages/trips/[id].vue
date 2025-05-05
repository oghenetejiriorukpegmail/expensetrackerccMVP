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
        The trip you are looking for does not exist or you don't have permission to view it.
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
      <!-- Trip Header -->
      <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
        <div class="flex items-center mb-4 md:mb-0">
          <NuxtLink to="/trips" class="mr-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </NuxtLink>
          <div>
            <h1 class="text-2xl font-bold">{{ trip.name }}</h1>
            <div class="flex items-center mt-1">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2"
                :class="statusColors[trip.status]"
              >
                {{ statusLabels[trip.status] }}
              </span>
              <span v-if="trip.location" class="text-sm text-gray-600 dark:text-gray-400">
                {{ trip.location }}
              </span>
              <span v-if="trip.start_date" class="text-sm text-gray-600 dark:text-gray-400 ml-4">
                {{ formatDateRange(trip.start_date, trip.end_date) }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="flex space-x-3">
          <NuxtLink
            :to="`/trips/edit/${trip.id}`"
            class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Edit Trip
          </NuxtLink>
          <NuxtLink
            :to="`/expenses/new?tripId=${trip.id}`"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-sm"
          >
            Add Expense
          </NuxtLink>
        </div>
      </div>
      
      <!-- Trip Details -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Trip Info -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
          <h2 class="text-lg font-semibold mb-4">Trip Details</h2>
          
          <div v-if="trip.description" class="mb-6">
            <p class="text-gray-700 dark:text-gray-300">{{ trip.description }}</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</h3>
              <p class="mt-1 text-gray-900 dark:text-white">{{ trip.start_date ? formatDate(trip.start_date) : 'Not set' }}</p>
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</h3>
              <p class="mt-1 text-gray-900 dark:text-white">{{ trip.end_date ? formatDate(trip.end_date) : 'Not set' }}</p>
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
              <p class="mt-1 text-gray-900 dark:text-white">{{ trip.location || 'Not specified' }}</p>
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Created</h3>
              <p class="mt-1 text-gray-900 dark:text-white">{{ formatDate(trip.created_at) }}</p>
            </div>
          </div>
        </div>
        
        <!-- Trip Summary -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 class="text-lg font-semibold mb-4">Trip Summary</h2>
          
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</h3>
              <p class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{{ formatCurrency(tripTotalAmount) }}</p>
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Expense Count</h3>
              <p class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{{ tripExpenses.length }}</p>
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Mileage</h3>
              <p class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                {{ formatNumber(tripTotalMileage) }} mi
                <span class="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({{ formatCurrency(tripTotalMileage * userSettings.mileage_rate) }})
                </span>
              </p>
            </div>
            
            <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
              <NuxtLink 
                :to="`/reports?tripId=${trip.id}`"
                class="inline-flex items-center text-primary-600 dark:text-primary-400 hover:underline"
              >
                Generate Report
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabs -->
      <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-8">
          <button
            @click="activeTab = 'expenses'"
            class="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
            :class="activeTab === 'expenses' 
              ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
          >
            Expenses
          </button>
          
          <button
            @click="activeTab = 'mileage'"
            class="py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap"
            :class="activeTab === 'mileage' 
              ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
          >
            Mileage
          </button>
        </nav>
      </div>
      
      <!-- Tab Content -->
      <div v-if="activeTab === 'expenses'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Expenses</h2>
          <div class="flex space-x-3">
            <NuxtLink
              :to="`/expenses/new?tripId=${trip.id}`"
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Add Expense
            </NuxtLink>
            
            <NuxtLink
              :to="`/expenses/bulk-upload?tripId=${trip.id}`"
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
              Bulk Upload
            </NuxtLink>
          </div>
        </div>
        
        <div v-if="tripExpenses.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No expenses yet</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">
            Start tracking your expenses for this trip.
          </p>
          <div class="mt-6">
            <NuxtLink
              :to="`/expenses/new?tripId=${trip.id}`"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow"
            >
              Add First Expense
            </NuxtLink>
          </div>
        </div>
        
        <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div v-for="expense in sortedTripExpenses" :key="expense.id">
              <ExpenseCard 
                :expense="expense" 
                :show-actions="true"
                :show-receipt="true"
                @edit="navigateToExpenseEdit(expense.id)"
                @delete="confirmDeleteExpense(expense)"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="activeTab === 'mileage'">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Mileage</h2>
          <NuxtLink
            :to="`/mileage/new?tripId=${trip.id}`"
            class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Add Mileage
          </NuxtLink>
        </div>
        
        <div v-if="tripMileage.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No mileage records yet</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">
            Start tracking your mileage for this trip.
          </p>
          <div class="mt-6">
            <NuxtLink
              :to="`/mileage/new?tripId=${trip.id}`"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow"
            >
              Add First Mileage Record
            </NuxtLink>
          </div>
        </div>
        
        <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            <div v-for="mileage in sortedTripMileage" :key="mileage.id">
              <MileageCard 
                :mileage="mileage" 
                :mileage-rate="userSettings.mileage_rate"
                :show-actions="true"
                :show-images="true"
                @edit="navigateToMileageEdit(mileage.id)"
                @delete="confirmDeleteMileage(mileage)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useSupabaseUser, navigateTo } from '#imports';
import { useTripStore } from '~/stores/tripStore';
import { useExpenseStore } from '~/stores/expenseStore';
import { useMileageStore } from '~/stores/mileageStore';
import { useUserStore } from '~/stores/userStore';
import { TripStatus } from '~/types';
import dayjs from 'dayjs';

// Route params
const route = useRoute();
const tripId = route.params.id;

// State
const loading = ref(true);
const activeTab = ref('expenses');
const showDeleteExpenseModal = ref(false);
const expenseToDelete = ref(null);
const showDeleteMileageModal = ref(false);
const mileageToDelete = ref(null);

const supabaseUser = useSupabaseUser();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const mileageStore = useMileageStore();
const userStore = useUserStore();

// Computed values
const trip = computed(() => tripStore.getTripById(tripId) || null);
const tripExpenses = computed(() => expenseStore.expensesByTrip(tripId) || []);
const tripMileage = computed(() => mileageStore.mileageByTrip(tripId) || []);
const tripTotalAmount = computed(() => expenseStore.tripTotalAmount(tripId) || 0);
const tripTotalMileage = computed(() => mileageStore.tripTotalDistance(tripId) || 0);
const userSettings = computed(() => userStore.settings || { mileage_rate: 0.58 });

const sortedTripExpenses = computed(() => {
  return [...tripExpenses.value].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
});

const sortedTripMileage = computed(() => {
  return [...tripMileage.value].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
});

// Status styling
const statusColors = {
  [TripStatus.PLANNED]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [TripStatus.IN_PROGRESS]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [TripStatus.COMPLETED]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  [TripStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

const statusLabels = {
  [TripStatus.PLANNED]: 'Planned',
  [TripStatus.IN_PROGRESS]: 'In Progress',
  [TripStatus.COMPLETED]: 'Completed',
  [TripStatus.CANCELLED]: 'Cancelled'
};

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

const formatDate = (dateString) => {
  return dayjs(dateString).format('MMM D, YYYY');
};

const formatDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) {
    return 'No dates set';
  }
  
  if (startDate && !endDate) {
    return `From ${dayjs(startDate).format('MMM D, YYYY')}`;
  }
  
  if (!startDate && endDate) {
    return `Until ${dayjs(endDate).format('MMM D, YYYY')}`;
  }
  
  if (startDate === endDate) {
    return dayjs(startDate).format('MMM D, YYYY');
  }
  
  return `${dayjs(startDate).format('MMM D')} - ${dayjs(endDate).format('MMM D, YYYY')}`;
};

// Navigation
const navigateToExpenseEdit = (expenseId) => {
  navigateTo(`/expenses/${expenseId}/edit`);
};

const navigateToMileageEdit = (mileageId) => {
  navigateTo(`/mileage/${mileageId}/edit`);
};

// Delete handlers
const confirmDeleteExpense = (expense) => {
  expenseToDelete.value = expense;
  showDeleteExpenseModal.value = true;
};

const deleteExpense = async () => {
  if (!expenseToDelete.value) return;
  
  const success = await expenseStore.deleteExpense(expenseToDelete.value.id);
  
  if (success) {
    showDeleteExpenseModal.value = false;
    expenseToDelete.value = null;
    // Show success notification in a real app
  } else {
    // Show error notification in a real app
  }
};

const confirmDeleteMileage = (mileage) => {
  mileageToDelete.value = mileage;
  showDeleteMileageModal.value = true;
};

const deleteMileage = async () => {
  if (!mileageToDelete.value) return;
  
  const success = await mileageStore.deleteMileageRecord(mileageToDelete.value.id);
  
  if (success) {
    showDeleteMileageModal.value = false;
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
      tripStore.fetchTrip(tripId),
      expenseStore.fetchTripExpenses(tripId),
      mileageStore.fetchTripMileage(tripId),
      userStore.fetchSettings()
    ]);
    
    if (!trip.value) {
      // Trip not found or user doesn't have access
      // In a real app, show an error notification
    }
    
    loading.value = false;
  }
});
</script>