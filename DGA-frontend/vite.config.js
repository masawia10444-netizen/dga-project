import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// กำหนด Port ที่ Vite Dev Server รันภายใน Container
const VITE_DEV_PORT = 5174; 

// Base URL ของ Backend ที่รันบน Host Port 1040
const BACKEND_URL = 'http://localhost:1040'; 

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ⭐️ สำคัญ: กำหนด Base Path สำหรับ Deployment บน Subpath (/test5/)
  // เพื่อให้ Vite สร้าง Path ของ Assets ที่ถูกต้อง เช่น /test5/assets/index.js
  base: '/test5/', 

  server: {
    // 1. กำหนด Port ภายใน Container
    port: VITE_DEV_PORT,
    
    // 2. ให้เซิร์ฟเวอร์เข้าถึงได้จากภายนอก (จำเป็นสำหรับ Docker)
    host: true,

    // 3. การตั้งค่า PROXY สำหรับการเรียก API
    // ถ้า Frontend เรียก URL ที่ขึ้นต้นด้วย /api, ให้ส่งต่อไปที่ Backend http://localhost:1040
    proxy: {
        '/api': {
            target: BACKEND_URL, 
            changeOrigin: true, // เปลี่ยน Host Header
            secure: false,
        },
    }
  }
})