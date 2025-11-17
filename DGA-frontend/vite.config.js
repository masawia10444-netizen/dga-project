import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  
  base: '/test5/', // Base path สำหรับ deploy/เข้าถึง production (ถูกต้องแล้ว)

  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  
  // LAST UPDATE 14-NOV

  server: {
    port: 5174, // Port ที่ Vite Dev Server ใช้งาน (ถูกต้องแล้ว)
    allowedHosts: ['czp-staging.biza.me'],

    watch: {
        usePolling: true,
    },

    // 🌟 เพิ่ม PROXY CONFIGURATION 🌟
    // การตั้งค่านี้จะใช้ในระหว่างการพัฒนา (Development) เท่านั้น
    proxy: {
      '/api': {
        // ชี้ไปที่ Backend ที่รันบน Port 1040
        // (อ้างอิงจาก server.js ของคุณ)
        target: 'http://localhost:1040', 
        changeOrigin: true, // สำคัญ: เปลี่ยน origin header เพื่อให้ Backend รับรู้ว่าเป็นการเรียกจาก localhost:1040
        secure: false,      // ใช้ false ถ้า Backend ไม่ได้ใช้ HTTPS
      }
    }
    // ------------------------------------
  }
})