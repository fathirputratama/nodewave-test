import axios from 'axios';
import { useAuthStore } from '@/lib/store/auth';

const api = axios.create({
  baseURL: 'https://fe-test-api.nwappservice.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;