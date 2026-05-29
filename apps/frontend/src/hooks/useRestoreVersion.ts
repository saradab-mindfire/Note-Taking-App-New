import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { restoreNoteVersion } from '@/services/versions.service';

export function useRestoreVersion(noteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (versionId: string) => restoreNoteVersion(noteId, versionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['note', noteId] });
      void queryClient.invalidateQueries({ queryKey: ['versions', noteId] });
      toast.success('Version restored successfully');
    },
    onError: (error: Error) => {
      const status = (error as Error & { status?: number }).status;
      if (status === 404) {
        toast.error('Version not found. It may have been deleted.');
      } else if (status === 401 || status === 403) {
        toast.error('You are not authorized to restore this version.');
      } else {
        toast.error('Restore failed. Please try again.');
      }
    },
  });
}
