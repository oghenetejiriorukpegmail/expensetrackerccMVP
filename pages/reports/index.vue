<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Reports & Exports</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Report Configuration -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold mb-4">Configure Report</h2>
        
        <form @submit.prevent="generateReport">
          <div class="grid grid-cols-1 gap-6">
            <!-- Trip Selection -->
            <div>
              <label for="trip" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trip
              </label>
              <select
                id="trip"
                v-model="form.tripId"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Trips</option>
                <option v-for="trip in trips" :key="trip.id" :value="trip.id">
                  {{ trip.name }}
                </option>
              </select>
            </div>
            
            <!-- Date Range -->
            <div v-if="!form.tripId" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="start_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  id="start_date"
                  v-model="form.startDate"
                  type="date"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label for="end_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  id="end_date"
                  v-model="form.endDate"
                  type="date"
                  class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <!-- Export Format -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Export Format
              </label>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex items-center">
                  <input
                    id="format_excel"
                    v-model="form.format"
                    type="radio"
                    value="excel"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                  />
                  <label for="format_excel" class="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Excel Spreadsheet
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    id="format_csv"
                    v-model="form.format"
                    type="radio"
                    value="csv"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                  />
                  <label for="format_csv" class="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CSV File
                  </label>
                </div>
                <div class="flex items-center">
                  <input
                    id="format_pdf"
                    v-model="form.format"
                    type="radio"
                    value="pdf"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600"
                  />
                  <label for="format_pdf" class="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    PDF Report
                  </label>
                </div>
              </div>
            </div>
            
            <!-- Options -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Options
              </label>
              <div class="space-y-3">
                <div class="flex items-center">
                  <input
                    id="include_receipts"
                    v-model="form.includeReceipts"
                    type="checkbox"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label for="include_receipts" class="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Include receipts as ZIP file
                  </label>
                </div>
                
                <div class="flex items-center">
                  <input
                    id="use_template"
                    v-model="form.useTemplate"
                    type="checkbox"
                    class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label for="use_template" class="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Use custom Excel template
                  </label>
                </div>
                
                <div v-if="form.useTemplate && !userSettings?.excel_template_url" class="mt-2 pl-6">
                  <div class="text-sm text-amber-600 dark:text-amber-400 mb-2">
                    No template uploaded. Please upload a template in Settings.
                  </div>
                  <NuxtLink 
                    to="/settings" 
                    class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Go to Settings
                  </NuxtLink>
                </div>
              </div>
            </div>
            
            <!-- Submit Button -->
            <div class="pt-4">
              <button
                type="submit"
                :disabled="loading"
                class="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loading">Generating...</span>
                <span v-else>Generate Report</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <!-- Report Preview -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold mb-4">Report Summary</h2>
        
        <div v-if="previewLoading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
        
        <div v-else-if="!reportData.expenses.length && !reportData.mileage.length" class="flex flex-col justify-center items-center h-64 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-4 text-gray-600 dark:text-gray-300">
            Select a trip or date range to preview report data
          </p>
        </div>
        
        <div v-else>
          <h3 class="font-medium text-gray-900 dark:text-white mb-2">
            {{ reportData.tripName || 'All Trips' }}
          </h3>
          
          <div v-if="reportData.dateRange" class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ reportData.dateRange }}
          </div>
          
          <!-- Stats -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
              <div class="text-xs text-gray-500 dark:text-gray-400">Expenses</div>
              <div class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(reportData.totalExpenses) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ reportData.expenses.length }} items
              </div>
            </div>
            
            <div class="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
              <div class="text-xs text-gray-500 dark:text-gray-400">Mileage</div>
              <div class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                {{ reportData.mileage.length > 0 ? formatNumber(reportData.totalMileage) + ' mi' : 'None' }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatCurrency(reportData.totalMileage * userSettings.mileage_rate) }}
              </div>
            </div>
          </div>
          
          <!-- Expense Types -->
          <div class="mb-6">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expense Types</h4>
            <div class="space-y-2">
              <div 
                v-for="(value, key) in reportData.expensesByType" 
                :key="key"
                class="flex justify-between text-sm"
              >
                <span class="text-gray-600 dark:text-gray-400 capitalize">{{ key }}</span>
                <span class="text-gray-900 dark:text-white font-medium">{{ formatCurrency(value) }}</span>
              </div>
            </div>
          </div>
          
          <!-- Receipts -->
          <div>
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Receipts</h4>
            <div class="text-sm text-gray-600 dark:text-gray-400">
              {{ reportData.receiptCount }} receipts available for export
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Recent Reports -->
    <div class="mt-8">
      <h2 class="text-lg font-semibold mb-4">Recent Reports</h2>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div v-if="recentReports.length === 0" class="p-8 text-center text-gray-500 dark:text-gray-400">
          <p>No reports have been generated yet.</p>
          <p class="mt-2 text-sm">Generate a report using the form above to see it here.</p>
        </div>
        
        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <div 
            v-for="(report, index) in recentReports" 
            :key="index"
            class="p-4 hover:bg-gray-50 dark:hover:bg-gray-750"
          >
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-medium text-gray-900 dark:text-white">
                  {{ report.title }}
                </h3>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Generated on {{ formatDate(report.date) }}
                </p>
                <div class="mt-1 flex space-x-2">
                  <span 
                    v-if="report.format" 
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="{
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': report.format === 'excel',
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': report.format === 'csv',
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': report.format === 'pdf',
                    }"
                  >
                    {{ report.format.toUpperCase() }}
                  </span>
                  <span 
                    v-if="report.includesReceipts" 
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  >
                    + Receipts
                  </span>
                </div>
              </div>
              <div class="flex space-x-2">
                <button 
                  @click="regenerateReport(report)"
                  class="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  title="Generate again"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useSupabaseUser } from '#imports';
import { useTripStore } from '~/stores/tripStore';
import { useExpenseStore } from '~/stores/expenseStore';
import { useMileageStore } from '~/stores/mileageStore';
import { useUserStore } from '~/stores/userStore';
import dayjs from 'dayjs';

// Route and query params
const route = useRoute();

// State
const loading = ref(false);
const previewLoading = ref(false);
const form = ref({
  tripId: route.query.tripId || '',
  startDate: '',
  endDate: '',
  format: 'excel',
  includeReceipts: true,
  useTemplate: false
});

// Recent reports state (stored in localStorage)
const recentReports = ref([]);

// Initialize with last month if no trip ID
if (!form.value.tripId) {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  
  form.value.startDate = formatDateForInput(lastMonth);
  form.value.endDate = formatDateForInput(endOfLastMonth);
}

const reportData = ref({
  tripName: '',
  dateRange: '',
  expenses: [],
  mileage: [],
  totalExpenses: 0,
  totalMileage: 0,
  expensesByType: {},
  receiptCount: 0
});

const supabaseUser = useSupabaseUser();
const tripStore = useTripStore();
const expenseStore = useExpenseStore();
const mileageStore = useMileageStore();
const userStore = useUserStore();

// Computed values
const trips = computed(() => tripStore.trips || []);
const userSettings = computed(() => userStore.settings || { mileage_rate: 0.58 });

const selectedTrip = computed(() => {
  if (!form.value.tripId) return null;
  return trips.value.find(trip => trip.id === form.value.tripId);
});

// Watch for changes to update preview
watch([() => form.value.tripId, () => form.value.startDate, () => form.value.endDate], updatePreview);

// Format helpers
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1
  }).format(value);
}

function formatDate(dateString) {
  return dayjs(dateString).format('MMM D, YYYY');
}

function formatDateForInput(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return '';
  if (startDate && !endDate) return `From ${formatDate(startDate)}`;
  if (!startDate && endDate) return `Until ${formatDate(endDate)}`;
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

// Update the report preview
async function updatePreview() {
  previewLoading.value = true;
  
  try {
    // Get expenses based on filter
    let expenses = [];
    let mileage = [];
    
    if (form.value.tripId) {
      // Filter by trip
      expenses = await expenseStore.fetchTripExpenses(form.value.tripId);
      mileage = await mileageStore.fetchTripMileage(form.value.tripId);
      
      reportData.value.tripName = selectedTrip.value?.name || '';
      reportData.value.dateRange = formatDateRange(
        selectedTrip.value?.start_date, 
        selectedTrip.value?.end_date
      );
    } else {
      // Filter by date range
      const allExpenses = expenseStore.expenses;
      const allMileage = mileageStore.mileageRecords;
      
      if (form.value.startDate && form.value.endDate) {
        const start = new Date(form.value.startDate);
        const end = new Date(form.value.endDate);
        
        expenses = allExpenses.filter(exp => {
          const expDate = new Date(exp.date);
          return expDate >= start && expDate <= end;
        });
        
        mileage = allMileage.filter(m => {
          const mDate = new Date(m.date);
          return mDate >= start && mDate <= end;
        });
        
        reportData.value.dateRange = formatDateRange(form.value.startDate, form.value.endDate);
      } else {
        expenses = allExpenses;
        mileage = allMileage;
      }
    }
    
    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalMileage = mileage.reduce((sum, m) => sum + m.distance, 0);
    
    // Calculate expenses by type
    const expensesByType = {};
    expenses.forEach(exp => {
      if (!expensesByType[exp.expense_type]) {
        expensesByType[exp.expense_type] = 0;
      }
      expensesByType[exp.expense_type] += exp.amount;
    });
    
    // Count receipts
    const receiptCount = expenses.filter(exp => exp.receipt_url).length;
    
    // Update report data
    reportData.value = {
      ...reportData.value,
      expenses,
      mileage,
      totalExpenses,
      totalMileage,
      expensesByType,
      receiptCount
    };
  } catch (error) {
    console.error('Error updating preview:', error);
  } finally {
    previewLoading.value = false;
  }
}

// Generate and download the report
async function generateReport() {
  loading.value = true;
  
  try {
    const format = form.value.format;
    
    if (format === 'excel') {
      await generateExcelReport();
    } else if (format === 'csv') {
      await generateCsvReport();
    } else if (format === 'pdf') {
      await generatePdfReport();
    }
    
    if (form.value.includeReceipts && form.value.tripId) {
      await generateReceiptsZip();
    }
    
    // Store the report in recent reports
    const reportInfo = {
      title: reportTitle(),
      date: new Date(),
      format: form.value.format,
      includesReceipts: form.value.includeReceipts && form.value.tripId,
      params: {
        tripId: form.value.tripId,
        startDate: form.value.startDate,
        endDate: form.value.endDate,
        format: form.value.format,
        includeReceipts: form.value.includeReceipts,
        useTemplate: form.value.useTemplate
      }
    };
    
    // Add to recent reports
    recentReports.value.unshift(reportInfo);
    
    // Keep only the most recent 10 reports
    if (recentReports.value.length > 10) {
      recentReports.value = recentReports.value.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem('recentReports', JSON.stringify(recentReports.value));
  } catch (error) {
    console.error('Error generating report:', error);
    alert(`Error generating report: ${error.message || 'Unknown error'}`);
  } finally {
    loading.value = false;
  }
}

// Generate Excel report
async function generateExcelReport() {
  try {
    // Make sure we have the template URL if user wants to use it
    if (form.value.useTemplate && !userSettings.value?.excel_template_url) {
      throw new Error('No Excel template found. Please upload a template in Settings.');
    }
    
    const params = {
      tripId: form.value.tripId || null,
      startDate: form.value.startDate || null,
      endDate: form.value.endDate || null,
      templateUrl: form.value.useTemplate ? userSettings.value.excel_template_url : null,
      userId: supabaseUser.value?.id // Pass the current user's ID explicitly
    };
    
    // Call the Netlify function
    const response = await fetch('/.netlify/functions/excel-generator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate Excel report');
    }
    
    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'expense-report.xlsx';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Get blob from response
    const blob = await response.blob();
    
    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error generating Excel report:', error);
    throw error;
  }
}

// Generate CSV report (simplified version)
async function generateCsvReport() {
  try {
    // For now, we'll generate a simple CSV from the reportData
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers for expenses
    csvContent += "Date,Type,Vendor,Description,Amount,Currency,Location\n";
    
    // Add expense data
    reportData.value.expenses.forEach(expense => {
      csvContent += `${expense.date},${expense.expense_type},"${expense.vendor || ''}","${expense.description || ''}",${expense.amount},${expense.currency},"${expense.location || ''}"\n`;
    });
    
    // Create a download link and trigger the download
    const encodedUri = encodeURI(csvContent);
    const tripName = reportData.value.tripName ? reportData.value.tripName.replace(/[^a-z0-9]/gi, '-').toLowerCase() : 'all-trips';
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `expense-report-${tripName}-${dateStr}.csv`;
    
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error generating CSV report:', error);
    throw error;
  }
}

// Generate PDF report (placeholder)
async function generatePdfReport() {
  alert('PDF export functionality will be implemented in a future update.');
}

// Generate ZIP file of receipts
async function generateReceiptsZip() {
  try {
    // Only proceed if we have a trip ID and receipts
    if (!form.value.tripId || reportData.value.receiptCount === 0) {
      return;
    }
    
    // Call the Netlify function
    const response = await fetch('/.netlify/functions/receipt-zip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tripId: form.value.tripId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate receipts ZIP');
    }
    
    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'receipts.zip';
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    // Get blob from response
    const blob = await response.blob();
    
    // Create a download link and trigger the download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error generating receipts ZIP:', error);
    alert(`Error generating receipts ZIP: ${error.message}`);
  }
}

// Generate a report title based on the current form
function reportTitle() {
  if (form.value.tripId) {
    const trip = trips.value.find(t => t.id === form.value.tripId);
    return trip ? `${trip.name} Report` : 'Trip Report';
  } else if (form.value.startDate && form.value.endDate) {
    return `Expense Report: ${formatDate(form.value.startDate)} - ${formatDate(form.value.endDate)}`;
  } else if (form.value.startDate) {
    return `Expense Report: From ${formatDate(form.value.startDate)}`;
  } else if (form.value.endDate) {
    return `Expense Report: Until ${formatDate(form.value.endDate)}`;
  } else {
    return 'All Expenses Report';
  }
}

// Regenerate a previous report
function regenerateReport(report) {
  // Copy saved params to the form
  Object.assign(form.value, report.params);
  
  // Generate the report
  generateReport();
}

// Load initial data
onMounted(async () => {
  if (supabaseUser.value) {
    // Load all data in parallel
    await Promise.all([
      tripStore.fetchTrips(),
      expenseStore.fetchExpenses(),
      mileageStore.fetchMileageRecords(),
      userStore.fetchSettings()
    ]);
    
    // Update the preview
    await updatePreview();
    
    // Load recent reports from localStorage
    try {
      const savedReports = localStorage.getItem('recentReports');
      if (savedReports) {
        recentReports.value = JSON.parse(savedReports);
      }
    } catch (error) {
      console.error('Error loading recent reports:', error);
    }
  }
});
</script>