import { create } from 'zustand';
import apiClient from '@/lib/api/client';
import type { AuthUser, LoginCredentials } from '@/lib/auth/types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials: LoginCredentials) => {
    const response: any = await apiClient.post('/auth/login', credentials);
    const user = response.data || response;
    localStorage.setItem('auth-token', user.token);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('auth-token');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        set({ isLoading: false });
        return;
      }

      const response: any = await apiClient.get('/auth/profile');
      const profile = response.data || response;
      set({
        user: { ...profile, token },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('auth-token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
