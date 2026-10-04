import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { User, AuthData, ApiResponse } from '@/types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  
  // Actions
  setAuth: (data: AuthData) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false,

      setAuth: (data) => {
        if (typeof document !== 'undefined') {
          document.cookie = 'cogna-session=1; path=/; SameSite=Lax';
        }
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          error: null,
        });
      },

      clearAuth: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'cogna-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      updateUser: (updatedFields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedFields } : null,
        })),

      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),
      setHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: 'cogna-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist tokens, user info, and auth status
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (typeof document !== 'undefined' && state?.isAuthenticated) {
          document.cookie = 'cogna-session=1; path=/; SameSite=Lax';
        }
      },
    }
  )
);
