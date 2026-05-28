import { useAuthStore } from '@/store/authStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

let isRefreshing = false;
let pendingRetry: (() => void) | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return null;

  const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as { success: boolean; data?: { accessToken: string } };
  if (!data.success || !data.data?.accessToken) return null;

  return data.data.accessToken;
}

// Auth endpoints issue their own 401s (wrong credentials, expired OTP, etc.)
// and must NOT trigger the token-refresh interceptor.
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password'];

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { accessToken, setAccessToken, logout } = useAuthStore.getState();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Public auth endpoints: surface the error directly — no refresh interceptor.
  if (PUBLIC_PATHS.includes(path) || response.status !== 401) {
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Request failed' }));
      throw Object.assign(new Error((errorBody as { error?: string }).error ?? 'Request failed'), {
        status: response.status,
        body: errorBody,
      });
    }
    return response.json() as Promise<T>;
  }

  // 401 on an authenticated endpoint — attempt one silent refresh
  if (isRefreshing) {
    // Another request is already refreshing; wait for it then retry
    await new Promise<void>((resolve) => {
      pendingRetry = resolve;
    });
    return apiRequest<T>(path, options);
  }

  isRefreshing = true;
  const newToken = await refreshAccessToken();
  isRefreshing = false;

  if (pendingRetry) {
    pendingRetry();
    pendingRetry = null;
  }

  if (!newToken) {
    logout();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  setAccessToken(newToken);

  // Retry original request with new token
  const retryHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${newToken}`,
  };

  const retryResponse = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: retryHeaders,
  });

  if (!retryResponse.ok) {
    const errorBody = await retryResponse.json().catch(() => ({ error: 'Request failed' }));
    throw Object.assign(new Error((errorBody as { error?: string }).error ?? 'Request failed'), {
      status: retryResponse.status,
      body: errorBody,
    });
  }

  return retryResponse.json() as Promise<T>;
}
