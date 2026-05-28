import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotesFilterStore } from '@/store/notesFilterStore';

interface NotesPaginationProps {
  total: number;
  limit: number;
  page: number;
}

export function NotesPagination({ total, limit, page }: NotesPaginationProps) {
  const { setFilter } = useNotesFilterStore();
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setFilter({ page: page - 1 })}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setFilter({ page: page + 1 })}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
