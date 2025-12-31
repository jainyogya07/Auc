import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    proxy: {
      '/api': {
        target: 'http://192.168.1.11:4000', // Use network IP instead of localhost
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://192.168.1.11:4000', // Use network IP instead of localhost
        ws: true,
      },
    }
  }
})

