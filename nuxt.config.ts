export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  devtools: {
    enabled: true
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@vite-pwa/nuxt'
  ],

  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/favicon.png'
        }
      ]
    }
  },

  runtimeConfig: {
    mongodbUri: process.env.MONGODB_URI,
    adminPassword: process.env.ADMIN_PASSWORD
  }
})