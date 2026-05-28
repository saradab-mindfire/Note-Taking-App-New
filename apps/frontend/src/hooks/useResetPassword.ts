import { useMutation } from '@tanstack/react-query';
import type { ResetPasswordDto, ApiResponse } from '@notepad/shared';
import { apiRequest } from '@/lib/apiClient';

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordDto) =>
      apiRequest<ApiResponse<Record<string, never>>>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}
