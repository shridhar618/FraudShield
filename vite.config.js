import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.FRAUDSHIELD_API_BASE || 'http://127.0.0.1:5001'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/predict': apiTarget,
      '/metrics': apiTarget,
      '/history': apiTarget,
      '/options': apiTarget,
      '/demo':    apiTarget,
      '/stats':   apiTarget,
      '/health':  apiTarget,
    }
  },
  build: { outDir: 'backend/frontend/dist' }
})
