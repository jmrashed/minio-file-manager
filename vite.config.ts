import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import EnvironmentPlugin from 'vite-plugin-environment'

export default defineConfig({
  plugins: [
    react(),
    EnvironmentPlugin(['VITE_MINIO_ENDPOINT', 'VITE_MINIO_PORT', 'VITE_MINIO_USE_SSL'])
  ],
  server: {
    port: 5173,
    strictPort: false,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})