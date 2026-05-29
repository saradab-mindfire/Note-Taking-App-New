import { apiRequest } from '@/lib/apiClient';
import type { ApiResponse, NoteVersionListResponse, NoteResponse } from '@notepad/shared';

export async function fetchNoteVersions(
  noteId: string,
  params: { page: number; limit: number },
): Promise<NoteVersionListResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  const res = await apiRequest<ApiResponse<NoteVersionListResponse>>(
    `/api/notes/${noteId}/versions?${query}`,
  );
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function restoreNoteVersion(
  noteId: string,
  versionId: string,
): Promise<NoteResponse> {
  const res = await apiRequest<ApiResponse<NoteResponse>>(
    `/api/notes/${noteId}/versions/${versionId}/restore`,
    { method: 'POST' },
  );
  if (!res.success) throw new Error(res.error);
  return res.data;
}
