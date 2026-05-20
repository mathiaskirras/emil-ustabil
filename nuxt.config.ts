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
  },

  pwa: {
    manifest: {
      name: 'Emil Mødeustabil',
      short_name: 'Mødeustabil',
      theme_color: '#020617',
      background_color: '#020617',
      display: 'standalone',

      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }
  }
})