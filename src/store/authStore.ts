// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  // تابعمون رو تغییر دادیم که هر دو توکن رو بگیره
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('access'), 
  refreshToken: localStorage.getItem('refresh'), // اضافه شد
  
  setTokens: (access, refresh) => {
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh); // اضافه شد
    set({ accessToken: access, refreshToken: refresh });
  },
  
  logout: () => {
    localStorage.removeItem('access'); 
    localStorage.removeItem('refresh'); // اضافه شد
    set({ accessToken: null, refreshToken: null }); 
  },
}));