// Mock for Nuxt runtime config
export const useRuntimeConfig = () => ({
  public: {
    openRouterApiKey: 'mock-openrouter-key',
    geminiApiKey: 'mock-gemini-key',
    supabaseUrl: 'https://example.supabase.co',
    supabaseKey: 'mock-supabase-key'
  },
  apiSecret: 'mock-api-secret'
});

// Mock for Nuxt composables
export const useState = (key: string, initialValue?: any) => {
  return {
    value: initialValue,
  };
};

export const useAsyncData = async (key: string, fn: () => Promise<any>) => {
  try {
    const data = await fn();
    return {
      data: { value: data },
      pending: false,
      error: { value: null },
      refresh: () => Promise.resolve(data)
    };
  } catch (error) {
    return {
      data: { value: null },
      pending: false,
      error: { value: error },
      refresh: () => Promise.reject(error)
    };
  }
};

export const navigateTo = (route: string) => {
  return Promise.resolve();
};

export const useRoute = () => {
  return {
    params: {
      id: 'test-id'
    },
    query: {},
    path: '/test/path'
  };
};

export const useRouter = () => {
  return {
    push: (route: string) => Promise.resolve(),
    replace: (route: string) => Promise.resolve(),
    go: (n: number) => Promise.resolve(),
    back: () => Promise.resolve(),
    forward: () => Promise.resolve()
  };
};

export const definePageMeta = (meta: any) => {
  return;
};

// Mock for Nuxt plugins and API
export const defineNuxtPlugin = (plugin: any) => plugin;

export const defineNuxtRouteMiddleware = (middleware: any) => middleware;

export const useFetch = async (url: string, options: any = {}) => {
  return {
    data: { value: {} },
    pending: false,
    error: { value: null },
    refresh: () => Promise.resolve({})
  };
};