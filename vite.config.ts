import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    proxy: {
      // 代理所有以 /api 开头的请求
      '/api': {
        target: 'http://localhost:8091',
        changeOrigin: true,
      }
    }
  }
})