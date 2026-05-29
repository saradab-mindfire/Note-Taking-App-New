import { useParams, useNavigate } from 'react-router-dom';
import { useNote } from '@/hooks/useNote';
import { useTagsList } from '@/hooks/useTagsList';
import { useNoteEditor } from '@/hooks/useNoteEditor';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export function NoteEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const isEditMode = Boolean(id);

  const {
    data: note,
    isLoading: isNoteLoading,
    isError: isNoteError,
    error: noteError,
    refetch,
  } = useNote(id ?? '');

  const { data: tags = [], isError: isTagsError } = useTagsList();

  const {
    editor,
    title,
    setTitle,
    tagIds,
    setTagIds,
    titleError,
    saveStatus,
    isSaving,
    save,
  } = useNoteEditor({
    noteId: id,
    initialNote: isEditMode ? note : undefined,
  });

  // Handle 401 on note fetch — log out and redirect
  if (
    isNoteError &&
    noteError &&
    (noteError as Error & { status?: number }).status === 401
  ) {
    logout();
    void navigate('/login', { replace: true });
    return null;
  }

  if (isEditMode && isNoteLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
          <div className="h-10 w-2/3 rounded-md bg-muted animate-pulse" />
          <div className="h-64 rounded-md bg-muted animate-pulse" />
        </div>
      </div>
    );
  }

  if (isEditMode && isNoteError) {
    const status = (noteError as Error & { status?: number })?.status;
    const message =
      status === 404
        ? 'Note not found.'
        : 'Failed to load note.';

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">{message}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const saveStatusLabel: Record<typeof saveStatus, string> = {
    idle: '',
    saving: 'Saving…',
    saved: 'Saved',
    error: 'Error saving',
  };

  const toggleTag = (tagId: string) => {
    setTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId],
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        {/* Header toolbar */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void navigate('/notes')}
          >
            ← Back
          </Button>
          <div className="flex items-center gap-3">
            {saveStatus !== 'idle' && (
              <span
                className={`text-sm ${
                  saveStatus === 'error'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                {saveStatusLabel[saveStatus]}
              </span>
            )}
            <Button onClick={save} disabled={isSaving} size="sm">
              Save
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-2xl font-bold placeholder:text-muted-foreground focus:outline-none border-b border-transparent focus:border-input pb-1 transition-colors"
          />
          {titleError && (
            <p className="text-xs text-destructive">{titleError}</p>
          )}
        </div>

        {/* Tag selector */}
        <div className="flex flex-wrap gap-2">
          {isTagsError ? (
            <span className="text-xs text-muted-foreground">Tags unavailable</span>
          ) : (
            tags.map((tag) => {
              const selected = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-opacity ${
                    selected ? 'opacity-100' : 'opacity-40 hover:opacity-70'
                  }`}
                  style={{
                    backgroundColor: selected ? tag.color : 'transparent',
                    borderColor: tag.color,
                    color: selected ? '#fff' : tag.color,
                  }}
                >
                  {tag.name}
                </button>
              );
            })
          )}
        </div>

        {/* Rich text editor */}
        <RichTextEditor editor={editor} />
      </div>
    </div>
  );
}
