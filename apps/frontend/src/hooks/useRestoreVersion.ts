import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restoreNoteVersion } from '@/services/versions.service';

export function useRestoreVersion(noteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => restoreNoteVersion(noteId, versionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      void queryClient.invalidateQueries({ queryKey: ['versions', noteId] });
    },
  });
}
