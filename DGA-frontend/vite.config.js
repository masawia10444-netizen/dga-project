import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ⭐️⭐️ นี่คือการเปลี่ยนแปลงที่สำคัญ ⭐️⭐️
  // บอก Vite ว่า Base Path ของโปรเจกต์นี้คือ /test5/
  base: '/test5/',
})