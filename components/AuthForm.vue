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
      
      <div class="my-4 flex items-center justify-center">
        <div class="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
        <div class="mx-4 text-sm text-gray-500 dark:text-gray-400">OR</div>
        <div class="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
      </div>
      
      <div>
        <button
          type="button"
          @click="handleGoogleLogin"
          :disabled="loading"
          class="w-full flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Sign in with Google
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
      
      <div class="my-4 flex items-center justify-center">
        <div class="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
        <div class="mx-4 text-sm text-gray-500 dark:text-gray-400">OR</div>
        <div class="flex-grow h-px bg-gray-300 dark:bg-gray-600"></div>
      </div>
      
      <div>
        <button
          type="button"
          @click="handleGoogleLogin"
          :disabled="loading"
          class="w-full flex items-center justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Sign up with Google
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

// Handle user login - simplified version
const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    // Basic login with no extra options
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: loginForm.value.email,
      password: loginForm.value.password
    });
    
    if (loginError) {
      throw loginError;
    }
    
    if (!data || !data.session || !data.user) {
      throw new Error('Authentication failed. No session created.');
    }
    
    console.log('Login successful! Redirecting to dashboard...');
    
    // Use proper Nuxt navigation - more reliable than window.location
    navigateTo('/dashboard');
    
  } catch (err: any) {
    console.error('Login error:', err);
    error.value = err.message || 'Failed to sign in. Please check your credentials.';
    loading.value = false;
  }
};

// Handle Google sign-in
const handleGoogleLogin = async () => {
  error.value = '';
  loading.value = true;
  
  try {
    const { data, error: loginError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (loginError) {
      throw loginError;
    }
    
    // This won't be reached as the OAuth flow redirects the browser
    console.log('Redirecting to Google authentication...');
    
  } catch (err: any) {
    console.error('Google login error:', err);
    error.value = err.message || 'Failed to sign in with Google. Please try again.';
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