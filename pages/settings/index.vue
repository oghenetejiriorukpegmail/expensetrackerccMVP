<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Settings</h1>
    
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Profile Settings -->
      <div class="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold mb-4">Profile</h2>
        
        <form @submit.prevent="updateProfile">
          <div class="grid grid-cols-1 gap-6">
            <!-- Profile Picture -->
            <div class="flex items-center">
              <div class="mr-4">
                <div v-if="profile.avatar_url" class="h-16 w-16 rounded-full overflow-hidden">
                  <img :src="profile.avatar_url" :alt="profile.full_name || profile.email" class="h-full w-full object-cover" />
                </div>
                <div v-else class="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xl font-medium">
                  {{ profileInitials }}
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  class="w-full text-sm text-gray-600 dark:text-gray-400"
                  @change="handleAvatarChange"
                />
              </div>
            </div>
            
            <!-- Name -->
            <div>
              <label for="full_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <input
                id="full_name"
                v-model="profileForm.full_name"
                type="text"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your name"
              />
            </div>
            
            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                v-model="profileForm.email"
                type="email"
                disabled
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed.
              </p>
            </div>
            
            <!-- Buttons -->
            <div class="flex justify-end pt-4">
              <button
                type="submit"
                :disabled="profileSaving"
                class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="profileSaving">Saving...</span>
                <span v-else>Save Profile</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <!-- Preferences -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold mb-4">Preferences</h2>
        
        <form @submit.prevent="updateSettings">
          <div class="grid grid-cols-1 gap-6">
            <!-- Default Currency -->
            <div>
              <label for="default_currency" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Currency
              </label>
              <select
                id="default_currency"
                v-model="settingsForm.default_currency"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CNY">CNY - Chinese Yuan</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="RUB">RUB - Russian Ruble</option>
                <option value="BRL">BRL - Brazilian Real</option>
                <option value="MXN">MXN - Mexican Peso</option>
                <option value="ZAR">ZAR - South African Rand</option>
              </select>
            </div>
            
            <!-- Default Expense Type -->
            <div>
              <label for="default_expense_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Expense Type
              </label>
              <select
                id="default_expense_type"
                v-model="settingsForm.default_expense_type"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="accommodation">Accommodation</option>
                <option value="transportation">Transportation</option>
                <option value="meals">Meals</option>
                <option value="entertainment">Entertainment</option>
                <option value="business">Business</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <!-- Mileage Rate -->
            <div>
              <label for="mileage_rate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mileage Rate ($/mi)
              </label>
              <input
                id="mileage_rate"
                v-model="settingsForm.mileage_rate"
                type="number"
                step="0.01"
                min="0"
                class="w-full rounded-md border border-gray-300 dark:border-gray-600 py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <!-- Buttons -->
            <div class="flex justify-end pt-4">
              <button
                type="submit"
                :disabled="settingsSaving"
                class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="settingsSaving">Saving...</span>
                <span v-else>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <!-- Excel Template -->
      <div class="md:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold mb-4">Excel Export Template</h2>
        
        <div v-if="settings?.excel_template_url" class="mb-6">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Current template:
          </p>
          <div class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
            </svg>
            <span class="ml-2 text-gray-900 dark:text-white">{{ templateFilename }}</span>
            
            <div class="ml-4 flex space-x-2">
              <a 
                :href="settings.excel_template_url" 
                target="_blank"
                class="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Download
              </a>
              <button 
                @click="removeTemplate"
                class="text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
        
        <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          
          <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Upload your custom Excel template for expense reports
          </p>
          
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Accepted formats: .xlsx, .xls
          </p>
          
          <div class="mt-1 flex space-x-4">
            <a href="/template-variables-guide.md" target="_blank" class="text-xs text-primary-600 dark:text-primary-400 hover:underline">
              View Template Variables Guide
            </a>
            <a href="/templates/sample-template.xlsx" download class="text-xs text-primary-600 dark:text-primary-400 hover:underline">
              Download Sample Template
            </a>
          </div>
          
          <div class="mt-4">
            <label class="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
              <span>Select Template</span>
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                class="sr-only"
                @change="handleTemplateChange"
              />
            </label>
          </div>
        </div>
      </div>
      
      <!-- AI Settings Panel -->
      <div class="md:col-span-3">
        <AISettingsPanel />
      </div>
      
      <!-- Danger Zone -->
      <div class="md:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-red-200 dark:border-red-900">
        <h2 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
        
        <div class="flex flex-col space-y-4">
          <div>
            <h3 class="text-base font-medium text-gray-900 dark:text-white">Delete Account</h3>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button 
              @click="confirmDeleteAccount"
              class="mt-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Account Confirmation Modal -->
    <div v-if="showDeleteAccountModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Delete Account</h3>
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          Are you sure you want to delete your account? All of your data will be permanently removed. This action cannot be undone.
        </p>
        <div class="flex justify-end space-x-3">
          <button 
            @click="showDeleteAccountModal = false"
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button 
            @click="deleteAccount"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSupabaseUser, useSupabaseClient, navigateTo } from '#imports';
import { useUserStore } from '~/stores/userStore';
import AISettingsPanel from '~/components/AISettingsPanel.vue';

// State
const loading = ref(true);
const profileSaving = ref(false);
const settingsSaving = ref(false);
const showDeleteAccountModal = ref(false);
const avatarFile = ref(null);
const templateFile = ref(null);

const supabaseUser = useSupabaseUser();
const supabase = useSupabaseClient();
const userStore = useUserStore();

// Form state
const profile = ref({
  id: '',
  email: '',
  full_name: '',
  avatar_url: ''
});

const profileForm = ref({
  email: '',
  full_name: ''
});

const settings = ref({
  user_id: '',
  default_currency: 'USD',
  mileage_rate: 0.58,
  excel_template_url: '',
  default_expense_type: 'other'
});

const settingsForm = ref({
  default_currency: 'USD',
  mileage_rate: 0.58,
  default_expense_type: 'other'
});

// Computed values
const profileInitials = computed(() => {
  if (!profile.value.full_name) {
    return profile.value.email?.charAt(0)?.toUpperCase() || '?';
  }
  
  return profile.value.full_name
    .split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
});

const templateFilename = computed(() => {
  if (!settings.value.excel_template_url) return '';
  
  const url = settings.value.excel_template_url;
  return url.substring(url.lastIndexOf('/') + 1);
});

// File change handlers
function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (file) {
    avatarFile.value = file;
  }
}

function handleTemplateChange(event) {
  const file = event.target.files[0];
  if (file) {
    templateFile.value = file;
    uploadTemplate();
  }
}

// Update profile
async function updateProfile() {
  profileSaving.value = true;
  
  try {
    // Upload avatar if changed
    let avatarUrl = profile.value.avatar_url;
    
    if (avatarFile.value) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${profile.value.id}/${Date.now()}`, avatarFile.value, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path);
      
      avatarUrl = publicUrl;
    }
    
    // Update profile
    await userStore.updateProfile({
      full_name: profileForm.value.full_name,
      avatar_url: avatarUrl
    });
    
    // Update local state
    profile.value = { ...profile.value, ...userStore.profile };
    avatarFile.value = null;
    
    // Show success message in a real app
  } catch (error) {
    console.error('Error updating profile:', error);
    // Show error message in a real app
  } finally {
    profileSaving.value = false;
  }
}

// Update settings
async function updateSettings() {
  settingsSaving.value = true;
  
  try {
    await userStore.updateSettings({
      default_currency: settingsForm.value.default_currency,
      mileage_rate: parseFloat(settingsForm.value.mileage_rate),
      default_expense_type: settingsForm.value.default_expense_type
    });
    
    // Update local state
    settings.value = { ...settings.value, ...userStore.settings };
    
    // Show success message in a real app
  } catch (error) {
    console.error('Error updating settings:', error);
    // Show error message in a real app
  } finally {
    settingsSaving.value = false;
  }
}

// Upload template
async function uploadTemplate() {
  if (!templateFile.value) return;
  
  settingsSaving.value = true;
  
  try {
    const templateUrl = await userStore.uploadExcelTemplate(templateFile.value);
    
    if (templateUrl) {
      settings.value.excel_template_url = templateUrl;
      templateFile.value = null;
      
      // Trigger template preprocessing in the background
      try {
        if (supabaseUser.value?.id) {
          const userId = supabaseUser.value.id;
          
          // Call the preprocessing function
          const response = await fetch('/.netlify/functions/preprocess-template', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              templateUrl,
              userId
            })
          });
          
          if (!response.ok) {
            console.warn('Template preprocessing request failed:', await response.text());
          } else {
            console.log('Template preprocessing initiated successfully');
          }
        }
      } catch (preprocessError) {
        console.error('Error initiating template preprocessing:', preprocessError);
        // Non-critical error, can continue without preprocessing
      }
      
      // Show success message in a real app
    }
  } catch (error) {
    console.error('Error uploading template:', error);
    // Show error message in a real app
  } finally {
    settingsSaving.value = false;
  }
}

// Remove template
async function removeTemplate() {
  settingsSaving.value = true;
  
  try {
    await userStore.updateSettings({
      excel_template_url: null
    });
    
    settings.value.excel_template_url = null;
    
    // Show success message in a real app
  } catch (error) {
    console.error('Error removing template:', error);
    // Show error message in a real app
  } finally {
    settingsSaving.value = false;
  }
}

// Account deletion
function confirmDeleteAccount() {
  showDeleteAccountModal.value = true;
}

async function deleteAccount() {
  try {
    // In a real app, this would call an API endpoint to delete the account
    // For this demo, we'll just sign out
    
    await supabase.auth.signOut();
    userStore.resetState();
    navigateTo('/');
    
    // Show success message in a real app
  } catch (error) {
    console.error('Error deleting account:', error);
    // Show error message in a real app
  } finally {
    showDeleteAccountModal.value = false;
  }
}

// Load user data
onMounted(async () => {
  if (supabaseUser.value) {
    try {
      await userStore.fetchProfile();
      await userStore.fetchSettings();
      
      // Set form values
      profile.value = { ...userStore.profile };
      profileForm.value = {
        email: profile.value.email,
        full_name: profile.value.full_name || ''
      };
      
      settings.value = { ...userStore.settings };
      settingsForm.value = {
        default_currency: settings.value.default_currency,
        mileage_rate: settings.value.mileage_rate,
        default_expense_type: settings.value.default_expense_type
      };
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      loading.value = false;
    }
  }
});
</script>