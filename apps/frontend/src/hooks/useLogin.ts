import { useMutation } from '@tanstack/react-query';
import type { LoginDto, AuthResponse, ApiResponse } from '@notepad/shared';
import { apiRequest } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';

export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginDto) =>
      apiRequest<ApiResponse<AuthResponse>>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (response) => {
      if (response.success) {
        const { accessToken, refreshToken, user } = response.data;
        setAuth(accessToken, user, refreshToken);
      }
    },
  });
}
