import { useQuery } from '@tanstack/react-query';
import { searchNotes } from '@/services/notes.service';
import type { SearchResultsResponse } from '@notepad/shared';

export function useSearchNotes(params: { q: string; page: number; limit: number }) {
  return useQuery<SearchResultsResponse>({
    queryKey: ['search', { q: params.q, page: params.page, limit: params.limit }],
    queryFn: () => searchNotes(params),
    enabled: params.q.trim().length > 0,
  });
}
