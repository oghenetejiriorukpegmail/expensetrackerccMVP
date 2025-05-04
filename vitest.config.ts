import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage'
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx,vue}'],
    exclude: ['node_modules', 'dist', '.nuxt', '.output'],
    alias: {
      '~': resolve(__dirname),
      '@': resolve(__dirname),
      '#app': resolve(__dirname, './test/mocks/app.ts')
    }
  },
  resolve: {
    alias: {
      '~': resolve(__dirname),
      '@': resolve(__dirname),
      '#app': resolve(__dirname, './test/mocks/app.ts')
    }
  }
});