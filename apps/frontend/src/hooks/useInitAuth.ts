import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export function useInitAuth() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      clearAuth();
      return;
    }

    fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Refresh failed');
        const data = (await res.json()) as { success: boolean; data?: { accessToken: string } };
        if (!data.success || !data.data?.accessToken) throw new Error('Refresh failed');
        setAccessToken(data.data.accessToken);
        useAuthStore.setState({ isAuthLoading: false });
      })
      .catch(() => {
        localStorage.removeItem('refresh_token');
        clearAuth();
      });
  }, [setAccessToken, clearAuth]);
}
