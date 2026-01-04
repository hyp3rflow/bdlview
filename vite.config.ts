import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/bdl': {
        target: process.env.BDL_SERVER_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
