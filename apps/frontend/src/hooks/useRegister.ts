import { useMutation } from '@tanstack/react-query';
import type { RegisterDto, ApiResponse } from '@notepad/shared';
import { apiRequest } from '@/lib/apiClient';

interface RegisterResponse {
  id: string;
  email: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterDto) =>
      apiRequest<ApiResponse<RegisterResponse>>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}
