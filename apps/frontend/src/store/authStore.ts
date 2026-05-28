import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthLoading: boolean;
  setAuth: (accessToken: string, user: AuthUser, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthLoading: true,

  setAuth: (accessToken, user, refreshToken) => {
    localStorage.setItem('refresh_token', refreshToken);
    set({ accessToken, user });
  },

  setAccessToken: (accessToken) => {
    set({ accessToken });
  },

  clearAuth: () => {
    set({ accessToken: null, user: null, isAuthLoading: false });
  },

  logout: () => {
    localStorage.removeItem('refresh_token');
    set({ accessToken: null, user: null, isAuthLoading: false });
  },
}));
