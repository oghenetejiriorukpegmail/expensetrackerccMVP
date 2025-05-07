<template>
  <div 
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300 hover:border-primary-200 dark:hover:border-primary-800 hover-scale"
  >
    <div class="flex justify-between items-start">
      <div class="flex items-start space-x-4">
        <!-- Expense Type Icon with animated gradient background -->
        <div 
          class="p-3 rounded-full shadow-sm transition-transform duration-300 transform hover:rotate-12"
          :class="[
            expenseTypeColors[expense.expense_type].bg,
            expense.receipt_url ? 'cursor-pointer' : ''
          ]"
          @click="expense.receipt_url ? openReceipt() : null"
        >
          <span :class="expenseTypeColors[expense.expense_type].text">
            <component :is="expenseTypeIcons[expense.expense_type]" class="h-5 w-5" />
          </span>
        </div>
        
        <!-- Expense Main Info -->
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {{ expense.vendor || expenseTypeLabels[expense.expense_type] }}
          </h3>
          
          <p v-if="expense.description" class="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
            {{ expense.description }}
          </p>
          <!-- Debug description info (only visible during development) -->
          <p v-if="false" class="text-xs text-red-500 mt-1">
            Raw description: "{{ expense.description }}"
          </p>
          
          <div class="flex flex-wrap items-center mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span class="flex items-center mr-4 mb-1">
              <CalendarIcon class="h-4 w-4 mr-1" />
              {{ formatDate(expense.date) }}
            </span>
            
            <span v-if="expense.location" class="flex items-center mb-1">
              <MapPinIcon class="h-4 w-4 mr-1" />
              {{ expense.location }}
            </span>
          </div>
          
          <!-- Receipt badge for mobile -->
          <div v-if="showReceipt && expense.receipt_url" class="mt-2 md:hidden">
            <button 
              @click="openReceipt"
              class="text-xs px-2 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full border border-primary-100 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors flex items-center"
            >
              <DocumentIcon class="h-3 w-3 mr-1" />
              View Receipt
            </button>
          </div>
        </div>
      </div>
      
      <!-- Amount and Receipt Button -->
      <div class="flex flex-col items-end">
        <span class="text-lg font-bold bg-gradient-to-br from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {{ formatCurrency(expense.amount, expense.currency) }}
        </span>
        
        <span v-if="showReceipt && expense.receipt_url" class="mt-2 hidden md:block">
          <button 
            @click="openReceipt"
            class="text-xs px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full border border-primary-100 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors flex items-center shadow-sm hover:shadow"
          >
            <DocumentIcon class="h-3 w-3 mr-1" />
            View Receipt
          </button>
        </span>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div v-if="showActions" class="flex justify-end mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
      <button 
        @click="$emit('edit', expense)"
        class="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
        title="Edit expense"
      >
        <PencilIcon class="h-4 w-4" />
      </button>
      
      <button 
        @click="$emit('delete', expense)"
        class="p-2 ml-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
        title="Delete expense"
      >
        <TrashIcon class="h-4 w-4" />
      </button>
    </div>
    
    <!-- Receipt Modal with animations -->
    <div 
      v-if="isReceiptModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 fade-in"
      @click.self="isReceiptModalOpen = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto pop-in">
        <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-800 dark:text-white flex items-center">
            <DocumentIcon class="h-5 w-5 mr-2 text-primary-500 dark:text-primary-400" />
            Receipt for {{ expense.vendor || expenseTypeLabels[expense.expense_type] }}
          </h3>
          
          <button 
            @click="isReceiptModalOpen = false" 
            class="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon class="h-5 w-5" />
          </button>
        </div>
        
        <div class="p-6">
          <img
            :src="expense.receipt_url"
            :alt="`Receipt for ${expense.vendor || 'expense'}`"
            class="max-w-full h-auto mx-auto rounded-lg shadow-md"
          />
          <div class="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {{ formatCurrency(expense.amount, expense.currency) }} • {{ formatDate(expense.date) }}
          </div>
        </div>
        
        <div class="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <button 
            @click="isReceiptModalOpen = false"
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
import { ref, computed, defineComponent, h } from 'vue';
import { Expense, ExpenseType } from '~/types';
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

const DocumentIcon = defineComponent({
  name: 'DocumentIcon',
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
      d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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

// Expense type icons using defineComponent and h() function
const HotelIcon = defineComponent({
  name: 'HotelIcon',
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
      d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
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
      d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    })
  ])
});

const FoodIcon = defineComponent({
  name: 'FoodIcon',
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
      d: "M12 4.5v15m7.5-7.5h-15"
    })
  ])
});

const EntertainmentIcon = defineComponent({
  name: 'EntertainmentIcon',
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
      d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
    }),
    h('path', {
      'stroke-linecap': "round",
      'stroke-linejoin': "round",
      'stroke-width': "2",
      d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    })
  ])
});

const BusinessIcon = defineComponent({
  name: 'BusinessIcon',
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
      d: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    })
  ])
});

const OfficeIcon = defineComponent({
  name: 'OfficeIcon',
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
      d: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    })
  ])
});

const OtherIcon = defineComponent({
  name: 'OtherIcon',
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
      d: "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
    })
  ])
});

// Map expense types to icon components
const expenseTypeIcons = {
  [ExpenseType.ACCOMMODATION]: HotelIcon,
  [ExpenseType.TRANSPORTATION]: CarIcon,
  [ExpenseType.MEALS]: FoodIcon,
  [ExpenseType.ENTERTAINMENT]: EntertainmentIcon,
  [ExpenseType.BUSINESS]: BusinessIcon,
  [ExpenseType.OFFICE]: OfficeIcon,
  [ExpenseType.OTHER]: OtherIcon
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

// Component props
const props = defineProps<{
  expense: Expense;
  showActions?: boolean;
  showReceipt?: boolean;
}>();

// Component emits
const emit = defineEmits<{
  (e: 'edit', expense: Expense): void;
  (e: 'delete', expense: Expense): void;
}>();

// State
const isReceiptModalOpen = ref(false);

// Format date
const formatDate = (dateString: string) => {
  return dayjs(dateString).format('MMM D, YYYY');
};

// Format currency
const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

// Open receipt modal
const openReceipt = () => {
  isReceiptModalOpen.value = true;
};
</script>