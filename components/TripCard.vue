<template>
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary-200 dark:hover:border-primary-800 hover-scale"
  >
    <!-- Trip Header with Status - Enhanced with gradient -->
    <div 
      class="h-3 bg-gradient-to-r"
      :class="[statusColors[trip.status].gradientFrom, statusColors[trip.status].gradientTo]"
    ></div>
    
    <div class="p-5">
      <div class="flex justify-between items-start">
        <div class="slide-in-left" style="animation-duration: 0.4s;">
          <div class="flex items-center">
            <h3 class="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {{ trip.name }}
            </h3>
            <span 
              class="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm"
              :class="statusColors[trip.status].badge"
            >
              {{ statusLabels[trip.status] }}
            </span>
          </div>
          
          <p v-if="trip.description" class="mt-1 text-gray-600 dark:text-gray-300 line-clamp-2">
            {{ trip.description }}
          </p>
        </div>
        
        <div class="flex space-x-2" v-if="showActions">
          <button 
            @click="$emit('edit', trip)"
            class="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
            title="Edit trip"
          >
            <PencilIcon class="h-4 w-4 transform transition-transform hover:rotate-12" />
          </button>
          
          <button 
            @click="$emit('delete', trip)"
            class="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
            title="Delete trip"
          >
            <TrashIcon class="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div class="mt-4 flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 slide-in-left" style="animation-delay: 0.1s; animation-duration: 0.4s;">
        <span class="flex items-center mr-4 mb-1 tooltip">
          <CalendarIcon class="h-4 w-4 mr-1 text-primary-500 dark:text-primary-400" />
          {{ formatDateRange(trip.start_date, trip.end_date) }}
          <span class="tooltip-text">Trip Dates</span>
        </span>
        
        <span v-if="trip.location" class="flex items-center mb-1 tooltip">
          <MapPinIcon class="h-4 w-4 mr-1 text-primary-500 dark:text-primary-400" />
          {{ trip.location }}
          <span class="tooltip-text">Location</span>
        </span>
      </div>
      
      <!-- Trip Stats - Enhanced with animations and modern styling -->
      <div v-if="showStats" class="mt-5 grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-700 pt-4 slide-in-bottom" style="animation-delay: 0.2s;">
        <div class="text-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
          <p class="text-xs text-gray-500 dark:text-gray-400">Expenses</p>
          <p class="text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-300 bg-clip-text text-transparent">{{ stats.expenseCount }}</p>
        </div>
        
        <div class="text-center border-l border-r border-gray-100 dark:border-gray-700 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
          <p class="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
          <p class="text-lg font-semibold bg-gradient-to-r from-green-600 to-green-400 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">{{ formatCurrency(stats.totalAmount) }}</p>
        </div>
        
        <div class="text-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
          <p class="text-xs text-gray-500 dark:text-gray-400">Mileage</p>
          <p class="text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-400 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">{{ stats.totalMileage }} mi</p>
        </div>
      </div>
      
      <!-- View Trip Button - Enhanced with modern styling -->
      <div v-if="showViewButton" class="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 pop-in" style="animation-delay: 0.3s;">
        <NuxtLink 
          :to="`/trips/${trip.id}`"
          class="inline-flex justify-center items-center w-full py-2 px-4 border border-primary-200 dark:border-primary-800 shadow-sm text-sm font-medium rounded-md text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 group"
        >
          View Trip Details
          <ArrowRightIcon class="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue';
import { Trip, TripStatus } from '~/types';
import dayjs from 'dayjs';

// Convert SVG icons to proper Vue components using h() function
// This helps avoid hydration mismatches between server and client
const CalendarIcon = defineComponent({
  name: 'CalendarIcon',
  render: () => h('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, [
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    })
  ])
});

const MapPinIcon = defineComponent({
  name: 'MapPinIcon',
  render: () => h('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, [
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    }),
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    })
  ])
});

const PencilIcon = defineComponent({
  name: 'PencilIcon',
  render: () => h('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, [
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    })
  ])
});

const TrashIcon = defineComponent({
  name: 'TrashIcon',
  render: () => h('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, [
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    })
  ])
});

const ArrowRightIcon = defineComponent({
  name: 'ArrowRightIcon',
  render: () => h('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor"
  }, [
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M14 5l7 7m0 0l-7 7m7-7H3"
    })
  ])
});

// Status colors
const statusColors = {
  [TripStatus.PLANNED]: {
    bg: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-400'
  },
  [TripStatus.IN_PROGRESS]: {
    bg: 'bg-green-500',
    badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-green-400'
  },
  [TripStatus.COMPLETED]: {
    bg: 'bg-gray-500',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    gradientFrom: 'from-gray-500',
    gradientTo: 'to-gray-400'
  },
  [TripStatus.CANCELLED]: {
    bg: 'bg-red-500',
    badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-red-400'
  }
};

// Status labels
const statusLabels = {
  [TripStatus.PLANNED]: 'Planned',
  [TripStatus.IN_PROGRESS]: 'In Progress',
  [TripStatus.COMPLETED]: 'Completed',
  [TripStatus.CANCELLED]: 'Cancelled'
};

// Component props
const props = defineProps<{
  trip: Trip;
  showActions?: boolean;
  showStats?: boolean;
  showViewButton?: boolean;
  stats?: {
    expenseCount: number;
    totalAmount: number;
    totalMileage: number;
  };
}>();

// Default values for props
const defaultProps = {
  showActions: false,
  showStats: false,
  showViewButton: true,
  stats: {
    expenseCount: 0,
    totalAmount: 0,
    totalMileage: 0
  }
};

// Component emits
const emit = defineEmits<{
  (e: 'edit', trip: Trip): void;
  (e: 'delete', trip: Trip): void;
}>();

// Format date range
const formatDateRange = (startDate?: string, endDate?: string) => {
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

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};
</script>