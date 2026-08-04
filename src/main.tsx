// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'

// ساخت یک نمونه (کلاینت) برای مدیریت کوئری‌ها
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // دیتا تا ۱ دقیقه تازه در نظر گرفته میشه (درخواست تکراری نمیزنه)
      staleTime: 1000 * 60,
      // اگر تب مرورگر رو عوض کرد و برگشت، دوباره رفرش نکنه (برای فروشگاه بهتره false باشه)
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)