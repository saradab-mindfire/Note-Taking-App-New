import { useQuery } from '@tanstack/react-query';
import { fetchNoteVersions } from '@/services/versions.service';

export function useVersionList(noteId: string, isOpen: boolean) {
  return useQuery({
    queryKey: ['versions', noteId],
    queryFn: () => fetchNoteVersions(noteId, { page: 1, limit: 20 }),
    enabled: Boolean(noteId) && isOpen,
  });
}
