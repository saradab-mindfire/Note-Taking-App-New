import { NoteCard } from './NoteCard';
import { Button } from '@/components/ui/button';
import type { NoteListItem } from '@notepad/shared';

interface NotesListProps {
  notes: NoteListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function NotesList({ notes, isLoading, isError, onRetry }: NotesListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 rounded-lg border bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <p className="text-sm text-destructive">Failed to load notes.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <p className="text-sm font-medium text-foreground">No notes found</p>
        <p className="text-xs text-muted-foreground">
          Adjust your filters or create a new note to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
