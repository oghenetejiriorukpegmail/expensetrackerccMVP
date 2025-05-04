<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300 hover:border-primary-200 dark:hover:border-primary-800 hover-scale">
    <div class="flex justify-between items-start">
      <div class="flex items-start space-x-4 slide-in-left" style="animation-duration: 0.4s;">
        <!-- Mileage Icon with animated gradient background -->
        <div class="p-3 rounded-full shadow-sm bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 transition-transform duration-300 transform hover:rotate-12">
          <span class="text-indigo-600 dark:text-indigo-300">
            <CarIcon class="h-5 w-5" />
          </span>
        </div>
        
        <!-- Mileage Main Info -->
        <div>
          <h3 class="text-lg font-semibold bg-gradient-to-r from-indigo-700 to-purple-600 dark:from-indigo-400 dark:to-purple-300 bg-clip-text text-transparent">
            {{ mileage.distance }} mi
          </h3>
          
          <p v-if="mileage.purpose" class="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
            {{ mileage.purpose }}
          </p>
          
          <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span class="flex items-center tooltip">
              <CalendarIcon class="h-4 w-4 mr-1 text-primary-500 dark:text-primary-400" />
              {{ formatDate(mileage.date) }}
              <span class="tooltip-text">Trip Date</span>
            </span>
          </div>
          
          <div class="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center tooltip">
            <DashboardIcon class="h-4 w-4 mr-1 text-primary-500 dark:text-primary-400" />
            <span>{{ mileage.start_odometer }} - {{ mileage.end_odometer }}</span>
            <span class="tooltip-text">Odometer Readings</span>
          </div>
        </div>
      </div>
      
      <!-- Estimated Cost -->
      <div class="flex flex-col items-end slide-in-right" style="animation-duration: 0.4s;">
        <span class="text-sm text-gray-500 dark:text-gray-400">Est. Cost</span>
        <span class="text-lg font-bold bg-gradient-to-br from-indigo-700 to-purple-600 dark:from-indigo-400 dark:to-purple-300 bg-clip-text text-transparent">
          {{ formatCurrency(mileage.distance * mileageRate) }}
        </span>
        
        <div v-if="showImages" class="mt-2 flex space-x-2">
          <button 
            v-if="mileage.image_start_url"
            @click="openImage('start')"
            class="text-xs px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center shadow-sm hover:shadow"
          >
            <CameraIcon class="h-3 w-3 mr-1" />
            Start
          </button>
          
          <button 
            v-if="mileage.image_end_url"
            @click="openImage('end')"
            class="text-xs px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center shadow-sm hover:shadow"
          >
            <CameraIcon class="h-3 w-3 mr-1" />
            End
          </button>
        </div>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div v-if="showActions" class="flex justify-end mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
      <button 
        @click="$emit('edit', mileage)"
        class="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
        title="Edit mileage record"
      >
        <PencilIcon class="h-4 w-4 transform transition-transform hover:rotate-12" />
      </button>
      
      <button 
        @click="$emit('delete', mileage)"
        class="p-2 ml-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
        title="Delete mileage record"
      >
        <TrashIcon class="h-4 w-4" />
      </button>
    </div>
    
    <!-- Image Modal with animations -->
    <div 
      v-if="isImageModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 fade-in"
      @click.self="isImageModalOpen = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto pop-in">
        <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium bg-gradient-to-r from-indigo-700 to-purple-600 dark:from-indigo-400 dark:to-purple-300 bg-clip-text text-transparent flex items-center">
            <CameraIcon class="h-5 w-5 mr-2 text-indigo-500 dark:text-indigo-400" />
            {{ selectedImageType === 'start' ? 'Start' : 'End' }} Odometer Reading
          </h3>
          
          <button 
            @click="isImageModalOpen = false" 
            class="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        
        <div class="p-6">
          <img
            :src="selectedImageType === 'start' ? mileage.image_start_url : mileage.image_end_url"
            :alt="`${selectedImageType === 'start' ? 'Start' : 'End'} odometer reading`"
            class="max-w-full h-auto mx-auto rounded-lg shadow-md"
          />
          <div class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ selectedImageType === 'start' ? 'Starting' : 'Ending' }} odometer reading: 
            {{ selectedImageType === 'start' ? mileage.start_odometer : mileage.end_odometer }} miles
          </div>
        </div>
        
        <div class="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <button 
            @click="isImageModalOpen = false"
            class="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-650 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, h } from 'vue';
import { MileageRecord } from '~/types';
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

const CarIcon = defineComponent({
  name: 'CarIcon',
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
      d: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
    })
  ])
});

const DashboardIcon = defineComponent({
  name: 'DashboardIcon',
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
      d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    })
  ])
});

const CameraIcon = defineComponent({
  name: 'CameraIcon',
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
      d: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    }),
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M15 13a3 3 0 11-6 0 3 3 0 016 0z"
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

const XMarkIcon = defineComponent({
  name: 'XMarkIcon',
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
      d: "M6 18L18 6M6 6l12 12"
    })
  ])
});

// Component props
const props = defineProps<{
  mileage: MileageRecord;
  mileageRate: number;
  showActions?: boolean;
  showImages?: boolean;
}>();

// Default values for props
const defaultProps = {
  showActions: false,
  showImages: true,
  mileageRate: 0.58
};

// Component emits
const emit = defineEmits<{
  (e: 'edit', mileage: MileageRecord): void;
  (e: 'delete', mileage: MileageRecord): void;
}>();

// State
const isImageModalOpen = ref(false);
const selectedImageType = ref<'start' | 'end'>('start');

// Format date
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('MMM D, YYYY');
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

// Open image modal
const openImage = (type: 'start' | 'end') => {
  selectedImageType.value = type;
  isImageModalOpen.value = true;
};
</script>