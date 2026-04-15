import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Check if we're building for Vercel (outputs to client/dist)
// Otherwise output to server/dist for Render
const isVercel = process.env.VERCEL || process.env.BUILD_TARGET === 'vercel'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: isVercel ? 'dist' : '../server/dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
