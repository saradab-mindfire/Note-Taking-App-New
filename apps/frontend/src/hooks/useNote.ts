import { useQuery } from '@tanstack/react-query';
import { fetchNote } from '@/services/notes.service';

export function useNote(id: string) {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => fetchNote(id),
    enabled: Boolean(id),
  });
}
