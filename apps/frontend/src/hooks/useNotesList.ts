import { useQuery } from '@tanstack/react-query';
import { useNotesFilterStore } from '@/store/notesFilterStore';
import { fetchNotes } from '@/services/notes.service';

export function useNotesList() {
  const { page, limit, sortBy, sortOrder, tags, includeDeleted } = useNotesFilterStore();

  return useQuery({
    queryKey: ['notes', { page, limit, sortBy, sortOrder, tags, includeDeleted }],
    queryFn: () => fetchNotes({ page, limit, sortBy, sortOrder, tags, includeDeleted }),
  });
}
