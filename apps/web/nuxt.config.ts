// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  telemetry: false,
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: [],
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL ?? 'http://localhost:3001',
    },
  },
})
