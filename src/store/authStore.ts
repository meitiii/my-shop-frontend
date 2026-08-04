// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  setAccessToken: (token: string) => void;
  logout: () => void; // این خط به اینترفیس اضافه شد
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('access'), 
  
  setAccessToken: (token) => {
    localStorage.setItem('access', token);
    set({ accessToken: token });
  },
  
  // تابع خروج: هم از مرورگر پاک میکنه، هم از حافظه موقتِ ریکت
  logout: () => {
    localStorage.removeItem('access'); 
    set({ accessToken: null }); 
  },
}));