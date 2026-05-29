import { useQuery } from '@tanstack/react-query';
import { fetchShareLinks } from '@/services/sharing.service';
import type { ShareLinksListResponse } from '@notepad/shared';

export function useShareLinks(noteId: string | undefined) {
  return useQuery<ShareLinksListResponse>({
    queryKey: ['shareLinks', noteId],
    queryFn: () => fetchShareLinks(noteId!),
    enabled: Boolean(noteId),
  });
}
