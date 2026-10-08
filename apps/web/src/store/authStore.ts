import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authApi } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.login({ email, password });
          const { user, token } = res.data;
          localStorage.setItem('jee_token', token);
          localStorage.setItem('jee_user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (email, name, password) => {
        set({ isLoading: true });
        try {
          const res = await authApi.register({ email, name, password });
          const { user, token } = res.data;
          localStorage.setItem('jee_token', token);
          localStorage.setItem('jee_user', JSON.stringify(user));
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('jee_token');
        localStorage.removeItem('jee_user');
        set({ user: null, token: null, isAuthenticated: false });
      },

      loadUser: async () => {
        const token = localStorage.getItem('jee_token');
        if (!token) return;
        try {
          const res = await authApi.me();
          set({ user: res.data, token, isAuthenticated: true });
        } catch {
          localStorage.removeItem('jee_token');
          set({ user: null, token: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'jee-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
