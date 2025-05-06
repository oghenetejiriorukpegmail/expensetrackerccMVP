<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
    <h2 class="text-lg font-semibold mb-4">AI Service Settings</h2>
    
    <div class="grid grid-cols-1 gap-6">
      <!-- Document AI Connection -->
      <div>
        <h3 class="text-md font-medium mb-2">Google Document AI</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Used for processing receipts and extracting data from images
        </p>
        
        <div class="flex items-center">
          <div
            :class="[
              'w-4 h-4 rounded-full mr-2',
              documentAIStatus === 'success' ? 'bg-green-500' :
              documentAIStatus === 'error' ? 'bg-red-500' :
              documentAIStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'
            ]"
          ></div>
          <span class="text-sm mr-4">
            {{ documentAIStatus === 'success' ? 'Connected' :
               documentAIStatus === 'error' ? 'Connection Failed' :
               documentAIStatus === 'loading' ? 'Testing...' : 'Not Tested' }}
          </span>
          <button
            @click="testDocumentAI"
            :disabled="documentAIStatus === 'loading'"
            class="text-sm px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Connection
          </button>
        </div>
        
        <div v-if="documentAIMessage" class="mt-2 p-2 rounded text-sm" :class="{
          'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200': documentAIStatus === 'success',
          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200': documentAIStatus === 'error'
        }">
          {{ documentAIMessage }}
        </div>
        
        <div class="mt-3">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Sample receipt for testing:
          </p>
          <div class="flex">
            <a 
              href="/samples/receipts/sample-receipt.svg" 
              download="sample-receipt.svg"
              class="text-xs text-primary-600 dark:text-primary-400 mr-2 underline"
            >
              Sample Receipt (Image)
            </a>
          </div>
        </div>
      </div>
      
      <!-- OpenRouter (LLM) Connection -->
      <div>
        <h3 class="text-md font-medium mb-2">OpenRouter LLM API</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Used for generating report summaries and expense descriptions
        </p>
        
        <div class="mb-3">
          <label for="openrouter_key" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            API Key
          </label>
          <div class="flex items-center">
            <input
              id="openrouter_key"
              v-model="openRouterKey"
              type="password"
              class="flex-1 rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter OpenRouter API key"
            />
            <button
              @click="toggleApiKeyVisibility"
              class="ml-2 p-2 text-gray-500 dark:text-gray-400"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path v-if="showOpenRouterKey" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div class="flex items-center">
          <div
            :class="[
              'w-4 h-4 rounded-full mr-2',
              openRouterStatus === 'success' ? 'bg-green-500' :
              openRouterStatus === 'error' ? 'bg-red-500' :
              openRouterStatus === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-300'
            ]"
          ></div>
          <span class="text-sm mr-4">
            {{ openRouterStatus === 'success' ? 'Connected' :
               openRouterStatus === 'error' ? 'Connection Failed' :
               openRouterStatus === 'loading' ? 'Testing...' : 'Not Tested' }}
          </span>
          <button
            @click="testOpenRouter"
            :disabled="openRouterStatus === 'loading'"
            class="text-sm px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Test Connection
          </button>
        </div>
        
        <div v-if="openRouterMessage" class="mt-2 p-2 rounded text-sm" :class="{
          'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200': openRouterStatus === 'success',
          'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200': openRouterStatus === 'error'
        }">
          {{ openRouterMessage }}
        </div>
      </div>
      
      <!-- Receipt Description Test -->
      <div>
        <h3 class="text-md font-medium mb-2">Test Receipt Description Generation</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Upload a receipt to test AI-powered description generation
        </p>
        
        <div class="mb-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
          <div class="flex flex-col items-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            
            <div class="mt-3">
              <label class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <span>Upload Sample Receipt</span>
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  class="sr-only"
                  @change="handleReceiptUpload"
                />
              </label>
            </div>
            
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Upload a receipt image (.jpg, .png) or PDF to test the AI receipt description feature.
              You can use our <a href="/samples/receipts/sample-receipt.svg" download="sample-receipt.svg" class="text-primary-600 dark:text-primary-400 underline">sample receipt image</a>.
            </p>
          </div>
        </div>
        
        <!-- Receipt preview if uploaded -->
        <div v-if="receiptImage" class="mb-4 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="mb-2 flex justify-center">
            <img
              v-if="receiptImage.startsWith('data:image')"
              :src="receiptImage" 
              alt="Receipt preview" 
              class="max-h-40 w-auto object-contain border border-gray-200 dark:border-gray-700 rounded"
            />
            <div 
              v-else 
              class="h-20 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"
            >
              <p class="text-sm text-gray-500 dark:text-gray-400">PDF Document</p>
            </div>
          </div>
          
          <div class="flex justify-center space-x-3">
            <button
              @click="testReceiptDescription"
              :disabled="receiptProcessing"
              class="text-sm px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="receiptProcessing">Processing...</span>
              <span v-else>Generate Description</span>
            </button>
            <button
              @click="clearReceipt"
              :disabled="receiptProcessing"
              class="text-sm px-3 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          </div>
        </div>
        
        <!-- Receipt processing results -->
        <div v-if="receiptResult" class="mt-4 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 class="font-medium text-gray-900 dark:text-white mb-2">Results</h4>
          
          <!-- Extracted data -->
          <div class="mb-3">
            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Extracted Data
              <span v-if="receiptResult.extractedData && receiptResult.extractedData._fallback" 
                class="ml-2 inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                Fallback
              </span>
            </h5>
            <div v-if="receiptResult.extractedData" class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              <ul class="list-disc list-inside pl-2 space-y-1">
                <li>Vendor: {{ receiptResult.extractedData.vendor || 'Unknown' }}</li>
                <li>Amount: {{ receiptResult.extractedData.amount || 0 }}</li>
                <li>Date: {{ receiptResult.extractedData.date || 'Unknown' }}</li>
                <li>Type: {{ receiptResult.extractedData.expenseType || 'Other' }}</li>
                <li>Confidence: {{ Math.round((receiptResult.extractedData.confidence || 0) * 100) }}%</li>
              </ul>
            </div>
            <div v-else class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              No data extracted from receipt
            </div>
          </div>
          
          <!-- Generated description -->
          <div>
            <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI-Generated Description
            </h5>
            <div v-if="receiptResult.description" class="mt-1 p-3 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-sm rounded-md border border-green-100 dark:border-green-800">
              {{ receiptResult.description }}
            </div>
            <div v-else class="mt-1 p-3 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm rounded-md border border-red-100 dark:border-red-800">
              Failed to generate description: {{ receiptResult.message }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Test All Button -->
      <div class="flex justify-end pt-4">
        <button
          @click="testAllConnections"
          :disabled="isAnyTesting"
          class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isAnyTesting">Testing...</span>
          <span v-else>Test All Connections</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// State for connection status
const documentAIStatus = ref('idle');
const documentAIMessage = ref('');
const openRouterStatus = ref('idle');
const openRouterMessage = ref('');
const openRouterKey = ref('');
const showOpenRouterKey = ref(false);

// State for receipt processing
const receiptImage = ref(null);
const receiptProcessing = ref(false);
const receiptResult = ref(null);

// Computed properties
const isAnyTesting = computed(() => {
  return documentAIStatus.value === 'loading' || 
         openRouterStatus.value === 'loading' || 
         receiptProcessing.value;
});

// Toggle API key visibility
function toggleApiKeyVisibility() {
  showOpenRouterKey.value = !showOpenRouterKey.value;
}

// Test Document AI connection
async function testDocumentAI() {
  documentAIStatus.value = 'loading';
  documentAIMessage.value = '';
  
  try {
    const response = await fetch('/api/test-ai-connections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const data = await response.json();
    
    if (data.documentAI) {
      if (data.documentAI.success) {
        documentAIStatus.value = 'success';
      } else {
        documentAIStatus.value = 'error';
      }
      documentAIMessage.value = data.documentAI.message;
    } else {
      documentAIStatus.value = 'error';
      documentAIMessage.value = 'No response from Document AI test';
    }
  } catch (error) {
    documentAIStatus.value = 'error';
    documentAIMessage.value = `Error: ${error.message}`;
  }
}

// Test OpenRouter connection
async function testOpenRouter() {
  openRouterStatus.value = 'loading';
  openRouterMessage.value = '';
  
  try {
    const response = await fetch('/api/test-ai-connections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        openRouterApiKey: openRouterKey.value
      })
    });
    
    const data = await response.json();
    
    if (data.openRouter) {
      if (data.openRouter.success) {
        openRouterStatus.value = 'success';
      } else {
        openRouterStatus.value = 'error';
      }
      openRouterMessage.value = data.openRouter.message;
    } else {
      openRouterStatus.value = 'error';
      openRouterMessage.value = 'No response from OpenRouter test';
    }
  } catch (error) {
    openRouterStatus.value = 'error';
    openRouterMessage.value = `Error: ${error.message}`;
  }
}

// Handle receipt file upload
async function handleReceiptUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  receiptResult.value = null;
  
  // Read the file as base64
  const reader = new FileReader();
  reader.onload = () => {
    receiptImage.value = reader.result;
  };
  reader.onerror = () => {
    console.error('Error reading file');
    receiptImage.value = null;
  };
  
  // Read as data URL (base64)
  reader.readAsDataURL(file);
}

// Clear receipt image and results
function clearReceipt() {
  receiptImage.value = null;
  receiptResult.value = null;
}

// Test receipt description generation
async function testReceiptDescription() {
  if (!receiptImage.value) return;
  
  receiptProcessing.value = true;
  receiptResult.value = null;
  
  try {
    const response = await fetch('/api/test-receipt-description', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiptImage: receiptImage.value
      })
    });
    
    const data = await response.json();
    receiptResult.value = data;
  } catch (error) {
    console.error('Error testing receipt description:', error);
    receiptResult.value = {
      success: false,
      message: `Error: ${error.message || 'Unknown error'}`
    };
  } finally {
    receiptProcessing.value = false;
  }
}

// Test all connections
async function testAllConnections() {
  // Run both tests in parallel
  await Promise.all([
    testDocumentAI(),
    testOpenRouter()
  ]);
}
</script>