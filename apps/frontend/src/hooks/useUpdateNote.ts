import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNote } from '@/services/notes.service';
import type { UpdateNoteDto } from '@notepad/shared';

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdateNoteDto) => updateNote(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['note', id] });
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
