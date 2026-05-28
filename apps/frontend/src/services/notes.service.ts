import { apiRequest } from '@/lib/apiClient';
import type { ApiResponse, NotesListResponse } from '@notepad/shared';

export interface FetchNotesParams {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
  tags: string[];
  includeDeleted: boolean;
}

export async function fetchNotes(params: FetchNotesParams): Promise<NotesListResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    includeDeleted: String(params.includeDeleted),
  });

  if (params.tags.length > 0) {
    query.set('tags', params.tags.join(','));
  }

  const res = await apiRequest<ApiResponse<NotesListResponse>>(`/api/notes?${query}`);
  if (!res.success) throw new Error(res.error);
  return res.data;
}
