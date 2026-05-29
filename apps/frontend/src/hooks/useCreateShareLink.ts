import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createShareLink } from '@/services/sharing.service';
import type { CreateShareLinkDto } from '@notepad/shared';

export function useCreateShareLink(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateShareLinkDto) => createShareLink(noteId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shareLinks', noteId] });
    },
  });
}
