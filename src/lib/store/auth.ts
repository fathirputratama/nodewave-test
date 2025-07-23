import { create } from 'zustand';

interface AuthState {
  token: string | null;
  role: string | null;
  setAuth: (token: string | null, role: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  role: typeof window !== 'undefined' ? localStorage.getItem('role') : null,
  setAuth: (token, role) => {
    set({ token, role });
    if (typeof window !== 'undefined') {
      if (token && role) {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        document.cookie = `token=${token}; path=/; secure; sameSite=strict`;
        document.cookie = `role=${role}; path=/; secure; sameSite=strict`;
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; sameSite=strict';
        document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; sameSite=strict';
      }
    }
  },
  logout: () => {
    set({ token: null, role: null });
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; sameSite=strict';
      document.cookie = 'role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; sameSite=strict';
    }
  },
}));