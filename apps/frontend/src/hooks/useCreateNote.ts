import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createNote } from '@/services/notes.service';
import type { CreateNoteDto } from '@notepad/shared';

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateNoteDto) => createNote(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
