import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
  base: '/test5',
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  
  // ⭐️ เพิ่มบรรทัดนี้เพื่อบังคับอัปเดต ⭐️
// LAST UPDATE 14-NOV

  // (ส่วน server ของคุณ OK แล้วครับ เก็บไว้ได้)
  server: {
    port: 5173,
    allowedHosts: ['czp-staging.biza.me'],

    watch: {
        usePolling: true,
    }
  }
})