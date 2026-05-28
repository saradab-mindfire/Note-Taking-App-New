import { useMutation } from '@tanstack/react-query';
import type { ForgotPasswordDto, ApiResponse } from '@notepad/shared';
import { apiRequest } from '@/lib/apiClient';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordDto) =>
      apiRequest<ApiResponse<Record<string, never>>>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}
