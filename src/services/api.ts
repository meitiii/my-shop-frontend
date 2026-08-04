// src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});