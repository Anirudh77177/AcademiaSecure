import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 🔥 ERROR FIX: Ye line Vite ko ngrok links allow karne degi
    allowedHosts: true, // true likhne se baar-baar link change hone pe error nahi aayega
    
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})