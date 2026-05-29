import { apiRequest } from '@/lib/apiClient';
import type {
  ApiResponse,
  ShareLinkResponse,
  ShareLinksListResponse,
  CreateShareLinkDto,
  PublicNoteResponse,
} from '@notepad/shared';

export async function fetchShareLinks(noteId: string): Promise<ShareLinksListResponse> {
  const res = await apiRequest<ApiResponse<ShareLinksListResponse>>(`/api/notes/${noteId}/shares`);
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function createShareLink(
  noteId: string,
  dto: CreateShareLinkDto,
): Promise<ShareLinkResponse> {
  const res = await apiRequest<ApiResponse<ShareLinkResponse>>(`/api/notes/${noteId}/share`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function revokeShareLink(token: string): Promise<void> {
  await apiRequest<void>(`/api/share/${token}`, { method: 'DELETE' });
}

export async function fetchPublicNote(token: string): Promise<PublicNoteResponse> {
  const res = await apiRequest<ApiResponse<PublicNoteResponse>>(`/public/share/${token}`);
  if (!res.success) throw new Error(res.error);
  return res.data;
}
