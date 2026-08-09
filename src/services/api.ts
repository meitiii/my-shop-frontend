import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL,
});

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

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // خود login/refresh را دوباره refresh نکن
    if (
      originalRequest.url?.includes('/token/') ||
      originalRequest.url?.includes('/refresh/')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken =
        useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        window.location.replace('/login');

        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${baseURL}/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        const newAccessToken = response.data.access;

        const newRefreshToken =
          response.data.refresh || refreshToken;

        const currentIsAdmin =
          useAuthStore.getState().isAdmin;

        useAuthStore.getState().setTokens(
          newAccessToken,
          newRefreshToken,
          currentIsAdmin
        );

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.replace('/login');

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);