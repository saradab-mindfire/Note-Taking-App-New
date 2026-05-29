import { apiRequest } from '@/lib/apiClient';
import type { ApiResponse, NotesListResponse, NoteResponse, CreateNoteDto, UpdateNoteDto } from '@notepad/shared';

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

export async function fetchNote(id: string): Promise<NoteResponse> {
  const res = await apiRequest<ApiResponse<NoteResponse>>(`/api/notes/${id}`);
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function createNote(dto: CreateNoteDto): Promise<NoteResponse> {
  const res = await apiRequest<ApiResponse<NoteResponse>>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
  if (!res.success) throw new Error(res.error);
  return res.data;
}

export async function updateNote(id: string, dto: UpdateNoteDto): Promise<NoteResponse> {
  const res = await apiRequest<ApiResponse<NoteResponse>>(`/api/notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
  if (!res.success) throw new Error(res.error);
  return res.data;
}
