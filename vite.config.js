import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // axiosInstance fallback về đường dẫn tương đối "/api/v1" (thay vì hardcode localhost:8081),
  // nên ở dev cần proxy này để /api/... đi tới backend. Ở production nginx lo phần proxy.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
})
