import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revokeShareLink } from '@/services/sharing.service';
import type { ShareLinksListResponse } from '@notepad/shared';

export function useRevokeShareLink(noteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => revokeShareLink(token),
    onMutate: async (token: string) => {
      await queryClient.cancelQueries({ queryKey: ['shareLinks', noteId] });
      const previous = queryClient.getQueryData<ShareLinksListResponse>(['shareLinks', noteId]);
      queryClient.setQueryData<ShareLinksListResponse>(
        ['shareLinks', noteId],
        (old) => old?.filter((link) => link.token !== token) ?? [],
      );
      return { previous };
    },
    onError: (_err, _token, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(['shareLinks', noteId], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['shareLinks', noteId] });
    },
  });
}
