import { apiRequest } from '@/lib/apiClient';
import type { ApiResponse, TagResponse } from '@notepad/shared';

export async function fetchTags(): Promise<TagResponse[]> {
  const res = await apiRequest<ApiResponse<TagResponse[]>>('/api/tags');
  if (!res.success) throw new Error(res.error);
  return res.data;
}
