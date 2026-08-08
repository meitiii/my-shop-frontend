// src/store/authStore.ts
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAdmin: boolean;
  // تابعمون رو تغییر دادیم که هر دو توکن رو بگیره
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('access'), 
  refreshToken: localStorage.getItem('refresh'),
  isAdmin: localStorage.getItem('isAdmin') === 'true', // اضافه شد
  
  setTokens: (access, refresh) => {
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh); // اضافه شد
    localStorage.setItem('isAdmin', String(isAdmin));
    set({ accessToken: access, refreshToken: refresh });
  },
  
  logout: () => {
    localStorage.removeItem('access'); 
    localStorage.removeItem('refresh'); // اضافه شد
    
    localStorage.removeItem('isAdmin');
    set({ accessToken: null, refreshToken: null }); 
  },
}));