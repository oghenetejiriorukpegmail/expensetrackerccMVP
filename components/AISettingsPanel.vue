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
            Try uploading a test receipt to verify Document AI functionality:
          </p>
          <div class="flex">
            <a 
              href="https://raw.githubusercontent.com/google-research-datasets/Document-AI-Demo-Data/main/receipts/receipt1.jpg" 
              target="_blank"
              class="text-xs text-primary-600 dark:text-primary-400 mr-2 underline"
            >
              Download Sample Receipt 1
            </a>
            <a 
              href="https://raw.githubusercontent.com/google-research-datasets/Document-AI-Demo-Data/main/receipts/receipt2.jpg" 
              target="_blank"
              class="text-xs text-primary-600 dark:text-primary-400 underline"
            >
              Download Sample Receipt 2
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

// Computed properties
const isAnyTesting = computed(() => {
  return documentAIStatus.value === 'loading' || openRouterStatus.value === 'loading';
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

// Test all connections
async function testAllConnections() {
  // Run both tests in parallel
  await Promise.all([
    testDocumentAI(),
    testOpenRouter()
  ]);
}
</script>