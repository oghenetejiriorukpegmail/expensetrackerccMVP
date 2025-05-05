<template>
  <div>
    <div class="mb-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex">
        <button
          @click="activeTab = 'login'"
          :class="[
            'py-2 px-4 text-center w-1/2',
            activeTab === 'login'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 font-medium'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          ]"
        >
          Sign In
        </button>
        <button
          @click="activeTab = 'register'"
          :class="[
            'py-2 px-4 text-center w-1/2',
            activeTab === 'register'
              ? 'border-b-2 border-primary-500 text-primary-600 dark:text-primary-400 font-medium'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          ]"
        >
          Register
        </button>
      </div>
    </div>

    <!-- Login Form -->
    <form v-if="activeTab === 'login'" @submit.prevent="handleLogin">
      <div class="mb-4">
        <label for="login-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Address
        </label>
        <input
          id="login-email"
          v-model="loginForm.email"
          type="email"
          required
          autocomplete="email"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="your@email.com"
        />
      </div>
      
      <div class="mb-6">
        <label for="login-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="login-password"
          v-model="loginForm.password"
          type="password"
          required
          autocomplete="current-password"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="••••••••"
        />
        <div class="mt-1 text-right">
          <button
            type="button"
            @click="activeTab = 'reset'"
            class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
          >
            Forgot password?
          </button>
        </div>
      </div>
      
      <div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading">Signing in...</span>
          <span v-else>Sign In</span>
        </button>
      </div>
      
      <div v-if="error" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
        {{ error }}
      </div>
    </form>

    <!-- Register Form -->
    <form v-if="activeTab === 'register'" @submit.prevent="handleRegister">
      <div class="mb-4">
        <label for="register-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Full Name
        </label>
        <input
          id="register-name"
          v-model="registerForm.name"
          type="text"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="John Doe"
        />
      </div>
      
      <div class="mb-4">
        <label for="register-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Address
        </label>
        <input
          id="register-email"
          v-model="registerForm.email"
          type="email"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="your@email.com"
        />
      </div>
      
      <div class="mb-4">
        <label for="register-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="register-password"
          v-model="registerForm.password"
          type="password"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="••••••••"
        />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Password must be at least 8 characters long.
        </p>
      </div>
      
      <div class="mb-6">
        <label for="register-password-confirm" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          id="register-password-confirm"
          v-model="registerForm.passwordConfirm"
          type="password"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="••••••••"
        />
      </div>
      
      <div>
        <button
          type="submit"
          :disabled="loading || registerForm.password !== registerForm.passwordConfirm"
          class="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading">Creating account...</span>
          <span v-else>Create Account</span>
        </button>
      </div>
      
      <div v-if="error" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
        {{ error }}
      </div>
    </form>

    <!-- Password Reset Form -->
    <form v-if="activeTab === 'reset'" @submit.prevent="handlePasswordReset">
      <div class="mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Reset Password
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        <label for="reset-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Address
        </label>
        <input
          id="reset-email"
          v-model="resetForm.email"
          type="email"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          placeholder="your@email.com"
        />
      </div>
      
      <div class="mb-4">
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="loading">Sending reset link...</span>
          <span v-else>Send Reset Link</span>
        </button>
      </div>
      
      <div class="text-center">
        <button
          type="button"
          @click="activeTab = 'login'"
          class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
        >
          Back to Sign In
        </button>
      </div>
      
      <div v-if="success" class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md text-sm">
        {{ success }}
      </div>
      
      <div v-if="error" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
        {{ error }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSupabaseClient, navigateTo } from '#imports';
import { useUserStore } from '~/stores/userStore';

const supabase = useSupabaseClient();
const userStore = useUserStore();

const activeTab = ref('login');
const loading = ref(false);
const error = ref('');
const success = ref('');

const loginForm = ref({
  email: '',
  password: ''
});

const registerForm = ref({
  name: '',
  email: '',
  password: '',
  passwordConfirm: ''
});

const resetForm = ref({
  email: ''
});

// Handle user login
const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    // Sign in with email and password with persistent session
    const { data: { session, user }, error: loginError } = await supabase.auth.signInWithPassword({
      email: loginForm.value.email,
      password: loginForm.value.password,
      options: {
        // Explicitly set the session to be persistent
        storeSession: true
      }
    });
    
    if (loginError) {
      throw loginError;
    }
    
    if (!session || !user) {
      throw new Error('Authentication failed. No session created.');
    }
    
    console.log('Login successful, user:', user.id);
    
    // Wait a moment for the auth state to fully propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      // Fetch or create profile with the same Supabase client to ensure auth state is consistent
      await userStore.fetchProfile(supabase);
      console.log('Profile loaded successfully');
      navigateTo('/dashboard');
    } catch (profileError: any) {
      console.error('Error loading profile:', profileError);
      error.value = 'Login successful but failed to load profile. Please try again.';
    }
  } catch (err: any) {
    console.error('Login error:', err);
    error.value = err.message || 'Failed to sign in. Please check your credentials.';
  } finally {
    loading.value = false;
  }
};

// Handle user registration
const handleRegister = async () => {
  error.value = '';
  loading.value = true;
  
  if (registerForm.value.password !== registerForm.value.passwordConfirm) {
    error.value = 'Passwords do not match.';
    loading.value = false;
    return;
  }
  
  if (registerForm.value.password.length < 8) {
    error.value = 'Password must be at least 8 characters long.';
    loading.value = false;
    return;
  }
  
  try {
    // Sign up the user
    const { data: { user, session }, error: registerError } = await supabase.auth.signUp({
      email: registerForm.value.email,
      password: registerForm.value.password,
      options: {
        data: {
          full_name: registerForm.value.name
        }
      }
    });
    
    if (registerError) {
      throw registerError;
    }
    
    console.log('Registration successful, user created:', user?.id);
    
    // If auto-confirm is enabled (development mode)
    if (session) {
      console.log('Session created, creating profile...');
      
      try {
        // Manually create profile for testing
        await userStore.createProfile(user, supabase);
        
        console.log('Profile created successfully');
        navigateTo('/dashboard');
        return;
      } catch (profileError: any) {
        console.error('Error creating profile:', profileError);
      }
    }
    
    // Switch to login tab after successful registration
    activeTab.value = 'login';
    success.value = 'Account created successfully. You can now sign in.';
  } catch (err: any) {
    console.error('Registration error:', err);
    error.value = err.message || 'Failed to create account. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Handle password reset
const handlePasswordReset = async () => {
  error.value = '';
  success.value = '';
  loading.value = true;
  
  try {
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      resetForm.value.email,
      {
        redirectTo: `${window.location.origin}/auth/reset-password`
      }
    );
    
    if (resetError) {
      throw resetError;
    }
    
    success.value = 'Password reset link sent to your email.';
    resetForm.value.email = '';
  } catch (err: any) {
    error.value = err.message || 'Failed to send reset link. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>