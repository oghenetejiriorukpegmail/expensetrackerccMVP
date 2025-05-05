<template>
  <div>
    <div v-if="supabaseUser" class="mb-12">
      <div class="text-center max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to Expense Tracker
        </h1>
        <p class="mt-4 text-xl text-gray-600 dark:text-gray-300">
          Manage your business travel expenses efficiently
        </p>
        <div class="mt-8 flex justify-center space-x-4">
          <a
            href="/dashboard"
            class="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Go to Dashboard
          </a>
          <NuxtLink
            to="/trips/new"
            class="px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-primary-600 dark:text-primary-400 font-medium rounded-md shadow-sm border border-primary-300 dark:border-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Create New Trip
          </NuxtLink>
        </div>
      </div>
      
      <!-- Quick Stats -->
      <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div class="ml-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Active Trips</h2>
              <p class="mt-1 text-3xl font-bold text-gray-800 dark:text-gray-100">{{ stats.activeTrips }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 dark:bg-green-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="ml-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Total Expenses</h2>
              <p class="mt-1 text-3xl font-bold text-gray-800 dark:text-gray-100">{{ formatCurrency(stats.totalExpenses) }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div class="ml-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Total Mileage</h2>
              <p class="mt-1 text-3xl font-bold text-gray-800 dark:text-gray-100">{{ stats.totalMileage }} mi</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div class="mt-12">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
        
        <div v-if="recentTrips.length === 0 && recentExpenses.length === 0" class="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">No recent activity</h3>
          <p class="mt-2 text-gray-600 dark:text-gray-300">
            Start by creating a trip or adding expenses to track your business travel costs.
          </p>
          <div class="mt-6">
            <NuxtLink
              to="/trips/new"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Your First Trip
            </NuxtLink>
          </div>
        </div>
        
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Trips -->
          <div v-if="recentTrips.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Trips</h3>
            </div>
            
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div v-for="trip in recentTrips" :key="trip.id" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-750">
                <NuxtLink :to="`/trips/${trip.id}`" class="block">
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="text-base font-medium text-gray-900 dark:text-white">
                        {{ trip.name }}
                      </h4>
                      <p class="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-1">
                        {{ trip.description || 'No description' }}
                      </p>
                    </div>
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      :class="statusColors[trip.status].badge"
                    >
                      {{ statusLabels[trip.status] }}
                    </span>
                  </div>
                </NuxtLink>
              </div>
            </div>
            
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <NuxtLink to="/trips" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                View all trips
              </NuxtLink>
            </div>
          </div>
          
          <!-- Recent Expenses -->
          <div v-if="recentExpenses.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Expenses</h3>
            </div>
            
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              <div v-for="expense in recentExpenses" :key="expense.id" class="p-4 hover:bg-gray-50 dark:hover:bg-gray-750">
                <NuxtLink :to="`/expenses/${expense.id}`" class="block">
                  <div class="flex justify-between items-start">
                    <div class="flex items-start space-x-3">
                      <div 
                        class="p-2 rounded-full"
                        :class="expenseTypeColors[expense.expense_type].bg"
                      >
                        <span :class="expenseTypeColors[expense.expense_type].text">
                          <component :is="expenseTypeIcons[expense.expense_type]" class="h-4 w-4" />
                        </span>
                      </div>
                      
                      <div>
                        <h4 class="text-base font-medium text-gray-900 dark:text-white">
                          {{ expense.vendor || expenseTypeLabels[expense.expense_type] }}
                        </h4>
                        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {{ formatDate(expense.date) }}
                        </p>
                      </div>
                    </div>
                    
                    <span class="text-base font-medium text-gray-900 dark:text-white">
                      {{ formatCurrency(expense.amount, expense.currency) }}
                    </span>
                  </div>
                </NuxtLink>
              </div>
            </div>
            
            <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <NuxtLink to="/expenses" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                View all expenses
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Landing Page for non-authenticated users -->
    <div v-else class="py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span class="block">Simplify Your</span>
            <span class="block text-primary-600 dark:text-primary-400">Business Travel Expenses</span>
          </h1>
          <p class="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Track expenses, process receipts with AI, manage mileage, and generate reports for your business trips. All in one place.
          </p>
          <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div class="rounded-md shadow">
              <NuxtLink
                to="/auth/register"
                class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
              >
                Get Started
              </NuxtLink>
            </div>
            <div class="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <NuxtLink
                to="/auth/login"
                class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Sign In
              </NuxtLink>
            </div>
          </div>
        </div>
        
        <!-- Feature Sections -->
        <div class="mt-24">
          <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white text-center">Key Features</h2>
          
          <div class="mt-12 grid gap-8 md:grid-cols-3">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="h-12 w-12 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">Receipt Processing</h3>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Extract information automatically from receipts using AI to save time on data entry.
              </p>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="h-12 w-12 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">Dashboard Analytics</h3>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                View your spending patterns, track expenses by category, and monitor your travel budget.
              </p>
            </div>
            
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div class="h-12 w-12 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white">Export Reports</h3>
              <p class="mt-2 text-gray-600 dark:text-gray-300">
                Generate detailed reports in Excel format with custom templates and download all receipts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSupabaseUser, navigateTo } from '#imports';
import { Trip, TripStatus, Expense, ExpenseType } from '~/types';
import { useTripStore } from '~/stores/tripStore';
import { useExpenseStore } from '~/stores/expenseStore';
import { useMileageStore } from '~/stores/mileageStore';
import dayjs from 'dayjs';

const supabaseUser = useSupabaseUser();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const mileageStore = useMileageStore();

// Data
const recentTrips = ref<Trip[]>([]);
const recentExpenses = ref<Expense[]>([]);
const stats = ref({
  activeTrips: 0,
  totalExpenses: 0,
  totalMileage: 0
});

// Status colors
const statusColors = {
  [TripStatus.PLANNED]: {
    bg: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
  },
  [TripStatus.IN_PROGRESS]: {
    bg: 'bg-green-500',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  },
  [TripStatus.COMPLETED]: {
    bg: 'bg-gray-500',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  },
  [TripStatus.CANCELLED]: {
    bg: 'bg-red-500',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }
};

// Status labels
const statusLabels = {
  [TripStatus.PLANNED]: 'Planned',
  [TripStatus.IN_PROGRESS]: 'In Progress',
  [TripStatus.COMPLETED]: 'Completed',
  [TripStatus.CANCELLED]: 'Cancelled'
};

// Expense type colors
const expenseTypeColors = {
  [ExpenseType.ACCOMMODATION]: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-600 dark:text-blue-300'
  },
  [ExpenseType.TRANSPORTATION]: {
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-600 dark:text-purple-300'
  },
  [ExpenseType.MEALS]: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-600 dark:text-green-300'
  },
  [ExpenseType.ENTERTAINMENT]: {
    bg: 'bg-pink-100 dark:bg-pink-900',
    text: 'text-pink-600 dark:text-pink-300'
  },
  [ExpenseType.BUSINESS]: {
    bg: 'bg-yellow-100 dark:bg-yellow-900',
    text: 'text-yellow-600 dark:text-yellow-300'
  },
  [ExpenseType.OFFICE]: {
    bg: 'bg-indigo-100 dark:bg-indigo-900',
    text: 'text-indigo-600 dark:text-indigo-300'
  },
  [ExpenseType.OTHER]: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-600 dark:text-gray-300'
  }
};

// Expense type icons
const expenseTypeIcons = {
  [ExpenseType.ACCOMMODATION]: {
    name: 'HotelIcon',
    template: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>'
  },
  [ExpenseType.TRANSPORTATION]: {
    name: 'CarIcon',
    template: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>'
  },
  [ExpenseType.MEALS]: {
    name: 'FoodIcon',
    template: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" /></svg>'
  },
  [ExpenseType.ENTERTAINMENT]: {
    name: 'EntertainmentIcon',
    template: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
  },
  [ExpenseType.BUSINESS]: {
    name: 'BusinessIcon',
    template: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>'
  },
  [ExpenseType.OFFICE]: {
    name: 'OfficeIcon',
    template: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>'
  },
  [ExpenseType.OTHER]: {
    name: 'OtherIcon',
    template: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>'
  }
};

// Expense type labels
const expenseTypeLabels = {
  [ExpenseType.ACCOMMODATION]: 'Accommodation',
  [ExpenseType.TRANSPORTATION]: 'Transportation',
  [ExpenseType.MEALS]: 'Meals & Dining',
  [ExpenseType.ENTERTAINMENT]: 'Entertainment',
  [ExpenseType.BUSINESS]: 'Business',
  [ExpenseType.OFFICE]: 'Office',
  [ExpenseType.OTHER]: 'Other'
};

// Load data if user is authenticated
onMounted(async () => {
  if (supabaseUser.value) {
    // Fetch trips
    await tripStore.fetchTrips();
    recentTrips.value = tripStore.sortedTrips.slice(0, 3);
    
    // Fetch expenses
    await expenseStore.fetchExpenses();
    recentExpenses.value = expenseStore.sortedExpenses.slice(0, 5);
    
    // Fetch mileage records
    await mileageStore.fetchMileageRecords();
    
    // Calculate stats
    stats.value = {
      activeTrips: tripStore.activeTrips.length,
      totalExpenses: expenseStore.totalAmount,
      totalMileage: mileageStore.totalDistance
    };
  }
});

// Format date
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('MMM D, YYYY');
};

// Simple direct navigation if needed elsewhere
const navigateToDashboard = () => {
  window.location.href = '/dashboard';
};

// Format currency
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};
</script>