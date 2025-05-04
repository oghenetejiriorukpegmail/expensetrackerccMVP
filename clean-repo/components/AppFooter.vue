<template>
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
    <div class="container mx-auto px-4 py-6">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="mb-4 md:mb-0">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            &copy; {{ currentYear }} Expense Tracker. All rights reserved.
          </p>
        </div>
        
        <div class="flex items-center space-x-6">
          <a href="#" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            Privacy Policy
          </a>
          <a href="#" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            Terms of Service
          </a>
          <a href="#" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            Contact
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear();
</script>