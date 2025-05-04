<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Expenses</h1>
      <NuxtLink
        to="/expenses/new"
        class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow"
      >
        New Expense
      </NuxtLink>
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="expenses.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No expenses found</h3>
      <p class="mt-2 text-gray-600 dark:text-gray-300">
        Get started by creating your first expense.
      </p>
      <div class="mt-6">
        <NuxtLink
          to="/expenses/new"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow"
        >
          Create First Expense
        </NuxtLink>
      </div>
    </div>

    <div v-else>
      <!-- Filter Controls -->
      <div class="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Type</label>
            <select 
              v-model="typeFilter"
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="accommodation">Accommodation</option>
              <option value="transportation">Transportation</option>
              <option value="meals">Meals</option>
              <option value="entertainment">Entertainment</option>
              <option value="business">Business</option>
              <option value="office">Office</option>
              <option value="other">Other</option>
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
              <option value="amount_desc">Amount (Highest First)</option>
              <option value="amount_asc">Amount (Lowest First)</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search expenses..."
              class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
      
      <!-- Expense List -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div v-for="expense in filteredExpenses" :key="expense.id">
            <ExpenseCard 
              :expense="expense" 
              :show-actions="true"
              :show-receipt="true"
              @edit="editExpense"
              @delete="confirmDeleteExpense"
            />
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
          <p class="text-gray-600 dark:text-gray-300 mb-6">
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          <div class="flex justify-end space-x-3">
            <button 
              @click="showDeleteModal = false"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button 
              @click="deleteExpense"
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
import { ExpenseType } from '~/types';

// State
const loading = ref(true);
const tripFilter = ref('all');
const typeFilter = ref('all');
const sortBy = ref('date_desc');
const searchQuery = ref('');
const showDeleteModal = ref(false);
const expenseToDelete = ref(null);

const supabaseUser = useSupabaseUser();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();

// Computed values
const trips = computed(() => tripStore.trips || []);
const expenses = computed(() => expenseStore.expenses || []);

const filteredExpenses = computed(() => {
  let result = [...expenses.value];
  
  // Apply trip filter
  if (tripFilter.value !== 'all') {
    result = result.filter(expense => expense.trip_id === tripFilter.value);
  }
  
  // Apply type filter
  if (typeFilter.value !== 'all') {
    result = result.filter(expense => expense.expense_type === typeFilter.value);
  }
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(expense => 
      (expense.vendor && expense.vendor.toLowerCase().includes(query)) || 
      (expense.description && expense.description.toLowerCase().includes(query)) ||
      (expense.location && expense.location.toLowerCase().includes(query))
    );
  }
  
  // Apply sorting
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'date_asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'amount_desc':
        return b.amount - a.amount;
      case 'amount_asc':
        return a.amount - b.amount;
      case 'date_desc':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });
  
  return result;
});

// Event handlers
const editExpense = (expense) => {
  navigateTo(`/expenses/${expense.id}/edit`);
};

const confirmDeleteExpense = (expense) => {
  expenseToDelete.value = expense;
  showDeleteModal.value = true;
};

const deleteExpense = async () => {
  if (!expenseToDelete.value) return;
  
  const success = await expenseStore.deleteExpense(expenseToDelete.value.id);
  
  if (success) {
    showDeleteModal.value = false;
    expenseToDelete.value = null;
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
      expenseStore.fetchExpenses()
    ]);
    
    loading.value = false;
  }
});
</script>