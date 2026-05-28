import { useNotesList } from '@/hooks/useNotesList';
import { useTagsList } from '@/hooks/useTagsList';
import { useNotesFilterStore } from '@/store/notesFilterStore';
import { NotesList } from '@/components/notes/NotesList';
import { NotesFilterBar } from '@/components/notes/NotesFilterBar';
import { NotesPagination } from '@/components/notes/NotesPagination';

export function NotesListPage() {
  const { page, limit } = useNotesFilterStore();
  const { data, isLoading, isError, refetch } = useNotesList();
  const { data: tags = [], isError: tagsError } = useTagsList();

  const notes = data?.notes ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">My Notes</h1>
          {!isLoading && !isError && (
            <p className="text-sm text-muted-foreground mt-1">
              {total} {total === 1 ? 'note' : 'notes'}
            </p>
          )}
        </header>

        <NotesFilterBar tags={tags} tagsError={tagsError} />

        <NotesList
          notes={notes}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => void refetch()}
        />

        {!isLoading && !isError && (
          <NotesPagination total={total} limit={limit} page={page} />
        )}
      </div>
    </div>
  );
}
