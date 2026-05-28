import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { NoteListItem } from '@notepad/shared';

interface NoteCardProps {
  note: NoteListItem;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function NoteCard({ note }: NoteCardProps) {
  return (
    <Link to={`/notes/${note.id}`} className="block h-full">
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <h3 className="font-semibold text-base leading-snug line-clamp-2">{note.title}</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Updated {dateFormatter.format(new Date(note.updatedAt))}
          </p>
          {note.deletedAt && (
            <p className="text-xs text-destructive font-medium">Deleted</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
