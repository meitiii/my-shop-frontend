import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAdmin: boolean;

  setTokens: (
    access: string,
    refresh: string,
    isAdmin?: boolean
  ) => void;

  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: localStorage.getItem('access'),
  refreshToken: localStorage.getItem('refresh'),
  isAdmin: localStorage.getItem('isAdmin') === 'true',

  setTokens: (access, refresh, isAdmin = false) => {
    localStorage.setItem('access', access);
    localStorage.setItem('refresh', refresh);
    localStorage.setItem('isAdmin', String(isAdmin));

    set({
      accessToken: access,
      refreshToken: refresh,
      isAdmin,
    });
  },

  logout: () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('isAdmin');

    set({
      accessToken: null,
      refreshToken: null,
      isAdmin: false,
    });
  },
}));