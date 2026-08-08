// src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL = import.meta.env.VITE_API_URL || '/api';
export const api = axios.create({
  baseURL: baseURL, 
});

// Request Interceptor: مثل قبل کار میکنه
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: هوشمندسازی برای Refresh Token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // گرفتن ریکوئستی که به ارور خورده
    const originalRequest = error.config;

    // اگر ارور 401 بود و قبلاً سعی نکرده بودیم ریکوئست رو دوباره بفرستیم (_retry یه فلگ کاستوم هست)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // علامت میزنیم که تو لوپ بی‌نهایت نیفتیم
      
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          // سعی میکنیم با رفرش توکن، یه اکسس توکن جدید بگیریم
          // نکته: اینجا از axios خام استفاده میکنیم نه api، تا دوباره تو اینترسپتور نیفته
          const response = await axios.post('http://127.0.0.1:8000/api/refresh/', {
            refresh: refreshToken,
          });

          const newAccessToken = response.data.access;
          
          // اگر جنگو یه رفرش توکن جدید هم داد اونم میگیریم، وگرنه همون قبلی رو نگه میداریم
          const newRefreshToken = response.data.refresh || refreshToken;

          // آپدیت کردن استور و لوکال استوریج با توکن‌های جدید
          useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);

          // تغییر هدرِ ریکوئستِ قبلی با توکن جدید
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // اجرای دوباره‌ی همون ریکوئستی که फेल شده بود!
          return api(originalRequest);
          
        } catch (refreshError) {
          // اگر خود رفرش توکن هم منقضی شده بود، دیگه واقعاً باید کاربر رو بیرون بندازیم
          console.warn("Refresh token expired. Logging out...");
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // اگر کلا رفرش توکن نداشتیم
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    // اگر ارور 401 نبود یا مربوط به رفرش توکن نبود، ارور رو عادی برگردون
    return Promise.reject(error);
  }
);