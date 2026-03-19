import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/stats':    { target: 'http://localhost:5000', changeOrigin: true },
      '/health':   { target: 'http://localhost:5000', changeOrigin: true },
      '/api':      { target: 'http://localhost:5000', changeOrigin: true },
      '/simulate': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
