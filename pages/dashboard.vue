<template>
  <div>
    <h1 class="text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent slide-in-left">
      Your Dashboard
    </h1>
    
    <div v-if="loading" class="flex flex-col justify-center items-center h-64">
      <div class="spinner rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-400 mb-4"></div>
      <p class="text-gray-500 dark:text-gray-400 fade-in" style="animation-delay: 0.3s">Loading your data...</p>
    </div>
    
    <div v-else class="fade-in">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          v-for="(card, index) in summaryCards" 
          :key="card.title"
          class="pop-in"
          :style="`animation-delay: ${index * 0.1}s`"
        >
          <DashboardCard 
            :title="card.title" 
            :value="card.value" 
            :icon="card.icon"
            :color="card.color" 
            class="hover-scale"
          />
        </div>
      </div>
      
      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Expense by Category Chart -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover-scale slide-in-bottom" style="animation-delay: 0.1s">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Expenses by Category
            </h2>
            <div class="tooltip">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="tooltip-text">View your expenses broken down by category</span>
            </div>
          </div>
          <div class="h-64">
            <ExpensePieChart v-if="expensesByCategory.length > 0" :data="expensesByCategory" />
            <div v-else class="flex flex-col justify-center items-center h-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p class="text-gray-500 dark:text-gray-400">No expense data available</p>
              <NuxtLink 
                to="/expenses/new" 
                class="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
              >
                <span>Add your first expense</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
        
        <!-- Expenses by Month Chart -->
        <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover-scale slide-in-bottom" style="animation-delay: 0.2s">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Expenses by Month
            </h2>
            <div class="tooltip">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="tooltip-text">Track your spending over time</span>
            </div>
          </div>
          <div class="h-64">
            <ExpenseBarChart v-if="expensesByMonth.length > 0" :data="expensesByMonth" />
            <div v-else class="flex flex-col justify-center items-center h-full">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-gray-500 dark:text-gray-400">No expense history yet</p>
              <NuxtLink 
                to="/expenses/new" 
                class="mt-3 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center"
              >
                <span>Add your first expense</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity Section -->
      <div class="mb-8 slide-in-bottom" style="animation-delay: 0.3s">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Recent Activity
          </h2>
          <NuxtLink to="/trips" class="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center group">
            <span>View All Trips</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </NuxtLink>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover-scale">
          <div v-if="recentTrips.length === 0" class="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-gray-500 dark:text-gray-400 mb-4">No recent trips found</p>
            <NuxtLink 
              to="/trips/new" 
              class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white rounded-lg shadow hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create New Trip
            </NuxtLink>
          </div>
          
          <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
            <div 
              v-for="(trip, index) in recentTrips" 
              :key="trip.id" 
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200 stagger-item-enter-active"
              :style="`animation-delay: ${0.05 * index}s`"
            >
              <NuxtLink :to="`/trips/${trip.id}`" class="block">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white text-lg">{{ trip.name }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {{ formatDateRange(trip.start_date, trip.end_date) }}
                    </p>
                  </div>
                  <span 
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    :class="statusColors[trip.status]"
                  >
                    {{ statusLabels[trip.status] }}
                  </span>
                </div>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Expenses Section -->
      <div class="slide-in-bottom" style="animation-delay: 0.4s">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Expenses
          </h2>
          <NuxtLink to="/expenses" class="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center group">
            <span>View All Expenses</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </NuxtLink>
        </div>
        
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover-scale">
          <div v-if="recentExpenses.length === 0" class="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-gray-500 dark:text-gray-400 mb-4">No recent expenses found</p>
            <NuxtLink 
              to="/expenses/new" 
              class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white rounded-lg shadow hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add New Expense
            </NuxtLink>
          </div>
          
          <div v-else>
            <div 
              v-for="(expense, index) in recentExpenses" 
              :key="expense.id" 
              class="border-b border-gray-200 dark:border-gray-700 last:border-0 stagger-item-enter-active"
              :style="`animation-delay: ${0.05 * index}s`"
            >
              <ExpenseCard :expense="expense" :show-receipt="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, nextTick } from 'vue';
import { useSupabaseUser } from '#imports';
import { useTripStore } from '~/stores/tripStore';
import { useExpenseStore } from '~/stores/expenseStore';
import { useMileageStore } from '~/stores/mileageStore';
import { useUserStore } from '~/stores/userStore';
import { TripStatus, ExpenseType } from '~/types';
import dayjs from 'dayjs';
import ExpensePieChart from '~/components/charts/ExpensePieChart.vue';
import ExpenseBarChart from '~/components/charts/ExpenseBarChart.vue';

// Define components to be used
const DashboardCard = defineComponent({
  props: {
    title: String,
    value: [String, Number],
    icon: String,
    color: {
      type: String,
      default: 'blue'
    }
  },
  setup(props) {
    const iconComponent = computed(() => {
      switch(props.icon) {
        case 'trip':
          return {
            template: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>'
          };
        case 'money':
          return {
            template: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
          };
        case 'car':
          return {
            template: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>'
          };
        default:
          return {
            template: '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'
          };
      }
    });
    
    const colorClasses = computed(() => {
      const colors = {
        blue: {
          bg: 'bg-blue-100 dark:bg-blue-900',
          text: 'text-blue-600 dark:text-blue-300'
        },
        green: {
          bg: 'bg-green-100 dark:bg-green-900',
          text: 'text-green-600 dark:text-green-300'
        },
        indigo: {
          bg: 'bg-indigo-100 dark:bg-indigo-900',
          text: 'text-indigo-600 dark:text-indigo-300'
        },
        red: {
          bg: 'bg-red-100 dark:bg-red-900',
          text: 'text-red-600 dark:text-red-300'
        },
        yellow: {
          bg: 'bg-yellow-100 dark:bg-yellow-900',
          text: 'text-yellow-600 dark:text-yellow-300'
        }
      };
      
      return colors[props.color] || colors.blue;
    });
    
    return {
      iconComponent,
      colorClasses
    };
  },
  template: `
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ title }}</h3>
          <div class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ value }}</div>
        </div>
        <div :class="[colorClasses.bg, 'p-3 rounded-full']">
          <component :is="iconComponent" :class="colorClasses.text" />
        </div>
      </div>
    </div>
  `
});

// Chart components are imported from separate files

// State
const loading = ref(true);
const supabaseUser = useSupabaseUser();
const userStore = useUserStore();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const mileageStore = useMileageStore();

// Computed values
const activeTrips = computed(() => tripStore.activeTrips || []);
const recentTrips = computed(() => tripStore.sortedTrips.slice(0, 5) || []);
const recentExpenses = computed(() => expenseStore.sortedExpenses.slice(0, 5) || []);
const totalExpenses = computed(() => expenseStore.totalAmount || 0);
const totalMileage = computed(() => mileageStore.totalDistance || 0);

// Summary cards with animation
const summaryCards = computed(() => [
  {
    title: "Active Trips",
    value: activeTrips.value.length,
    icon: "trip",
    color: "blue"
  },
  {
    title: "Total Expenses",
    value: formatCurrency(totalExpenses.value),
    icon: "money",
    color: "green"
  },
  {
    title: "Total Mileage",
    value: formatNumber(totalMileage.value) + ' mi',
    icon: "car",
    color: "indigo"
  }
]);

// Expense chart data
const expensesByCategory = computed(() => {
  const categories = {};
  
  expenseStore.expenses.forEach(expense => {
    if (!categories[expense.expense_type]) {
      categories[expense.expense_type] = 0;
    }
    categories[expense.expense_type] += expense.amount;
  });
  
  return Object.entries(categories).map(([category, amount]) => ({
    category,
    amount
  }));
});

const expensesByMonth = computed(() => {
  const months = {};
  
  expenseStore.expenses.forEach(expense => {
    const month = dayjs(expense.date).format('MMM YYYY');
    if (!months[month]) {
      months[month] = 0;
    }
    months[month] += expense.amount;
  });
  
  // Sort by date
  return Object.entries(months)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => {
      return dayjs(a.month, 'MMM YYYY').unix() - dayjs(b.month, 'MMM YYYY').unix();
    });
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

// Format helpers
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

// Load data
onMounted(async () => {
  if (supabaseUser.value) {
    try {
      // Make sure user profile and settings are loaded first
      if (!userStore.profile) {
        console.log('Loading user profile on dashboard page');
        await userStore.fetchProfile();
      }
      
      // Then load all data in parallel
      await Promise.all([
        tripStore.fetchTrips(),
        expenseStore.fetchExpenses(),
        mileageStore.fetchMileageRecords()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      loading.value = false;
    }
  }
});
</script>