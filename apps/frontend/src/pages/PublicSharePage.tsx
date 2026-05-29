import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { fetchPublicNote } from '@/services/sharing.service';

type ShareError = Error & { status?: number };

function getErrorMessage(error: ShareError): string {
  const msg = error.message.toLowerCase();
  if (error.status === 404) return 'Share link not found.';
  if (error.status === 403) {
    if (msg.includes('expired')) return 'This share link has expired.';
    if (msg.includes('revoked')) return 'This share link has been revoked.';
    if (msg.includes('no longer available')) return 'This note is no longer available.';
  }
  return 'Failed to load the shared note. Please try again later.';
}

interface NoteViewerProps {
  content: string;
}

function NoteViewer({ content }: NoteViewerProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content ? (JSON.parse(content) as object) : '',
    editable: false,
  });

  return (
    <EditorContent
      editor={editor}
      className="prose prose-sm max-w-none focus:outline-none"
    />
  );
}

export function PublicSharePage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['publicNote', token],
    queryFn: () => fetchPublicNote(token!),
    enabled: Boolean(token),
    retry: false,
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {isLoading && (
          <div className="space-y-4">
            <div className="h-9 w-2/3 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
            <div className="h-4 w-4/6 rounded bg-muted animate-pulse" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-lg font-medium text-foreground">
              {getErrorMessage(error as ShareError)}
            </p>
          </div>
        )}

        {data && (
          <article className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight break-words">{data.title}</h1>
            <div className="rounded-md border border-input bg-background px-3 py-2">
              <NoteViewer content={data.content} />
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
