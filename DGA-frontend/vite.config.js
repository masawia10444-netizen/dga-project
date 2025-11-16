import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  
  base: '/test5/', // ⭐️ แก้ไข: ต้องมี / ปิดท้าย

  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  
  // LAST UPDATE 14-NOV

  server: {
    port: 5174,
    allowedHosts: ['czp-staging.biza.me'],

    watch: {
        usePolling: true,
    }
  }
})