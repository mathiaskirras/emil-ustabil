export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: true
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@vite-pwa/nuxt'
  ],

  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI,
    adminPassword: process.env.ADMIN_PASSWORD
  }
})
