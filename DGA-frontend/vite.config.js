import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/test5/',

  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],

  server: {
    port: 5174,
    allowedHosts: ['czp-staging.biza.me'],

    watch: {
      usePolling: true,
    },

    // ⭐⭐⭐ เพิ่ม Proxy เพื่อแก้ปัญหา 502 ⭐⭐⭐
    proxy: {
      '/api': {
        target: 'http://backend:1040',  // ← backend service จาก docker-compose
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
