// src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// ۱. ساخت نمونه (Instance) از Axios
export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api', // حتماً آدرس پایه بک‌اند خودت رو چک کن
});

// ۲. Request Interceptor (رهگیر درخواست‌ها)
api.interceptors.request.use(
  (config) => {
    // گرفتن توکن از Zustand
    // نکته: چون اینجا داخل یک کامپوننت React نیستیم، نمی‌تونیم از هوک استفاده کنیم.
    // به جاش از متد .getState() استفاده می‌کنیم.
    const token = useAuthStore.getState().accessToken;
    
    // اگر توکن وجود داشت، اون رو به هدر اضافه کن
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ۳. Response Interceptor (رهگیر جواب‌ها از سمت سرور)
api.interceptors.response.use(
  (response) => {
    // اگر ریکوئست موفق بود که همون جواب رو برگردون
    return response;
  },
  (error) => {
    // اگر ارور ۴۰۱ (غیرمجاز / توکن منقضی) دریافت کردیم
    if (error.response?.status === 401) {
      console.warn("Token expired or invalid. Logging out...");
      
      // توکن رو از سیستم پاک کن
      useAuthStore.getState().logout();
      
      // کاربر رو بفرست به صفحه لاگین
      // (چون هوک useNavigate اینجا کار نمیکنه از window.location استفاده میکنیم)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);  