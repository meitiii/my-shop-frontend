import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true, // 👈 این همون جادویی هست که داکر روی ویندوز بهش نیاز داره
      interval: 500,    // هر نیم ثانیه فایل‌ها رو چک میکنه
    }
  }
})