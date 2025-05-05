// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/supabase'
  ],
  // Explicitly configure pages directory
  pages: true,
  router: {
    options: {
      strict: false,
      hashMode: false,
      trailingSlash: false
    }
  },
  ssr: false, // Disable server-side rendering to avoid hydration issues
  nitro: {
    preset: process.env.NITRO_PRESET || 'netlify',
    static: true
  },
  experimental: {
    payloadExtraction: false
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_ANON_KEY,
      openRouterApiKey: process.env.OPENROUTER_API_KEY,
      geminiApiKey: process.env.GEMINI_API_KEY,
      googleApiKey: process.env.GOOGLE_API_KEY,
      googleProjectId: process.env.GOOGLE_PROJECT_ID,
      googleProcessorId: process.env.GOOGLE_PROCESSOR_ID
    }
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/confirm',
      exclude: ['/auth/register', '/']
    },
    cookieName: 'supabase-auth-token',
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/' // Ensure cookies are available across the entire site
    },
    clientOptions: {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'supabase-auth',
        storage: process.client ? localStorage : undefined,
        detectSessionInUrl: false, // Don't automatically detect sessions in URLs
        flowType: 'pkce', // Use PKCE flow for better security
      }
    }
  },
  app: {
    head: {
      title: 'Expense Tracker',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A comprehensive expense tracking application for business trips' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  typescript: {
    strict: true
  }
})