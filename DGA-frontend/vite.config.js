import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Sets the base path for assets during build (crucial for deployment under /test5/)
  base: '/test5/', 

  server: {
    // Port for the development server inside the container
    port: 5174,
    
    // Allows the server to be accessible externally (required for Docker)
    host: true,

    // PROXY configuration for API calls during development
    proxy: {
      '/api': {
        target: 'http://localhost:1040', 
        changeOrigin: true,
        secure: false,
      },
    }
  },
  // Setting base to '/test5/' is the correct way to handle subpath deployment for Vite/React.
  // The Nginx config we created earlier will ensure this works correctly in production.
})