import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { noteEditorFormSchema } from '@notepad/shared';
import { useCreateNote } from './useCreateNote';
import { useUpdateNote } from './useUpdateNote';
import type { NoteResponse } from '@notepad/shared';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseNoteEditorOptions {
  noteId?: string;
  initialNote?: NoteResponse;
}

export function useNoteEditor({ noteId, initialNote }: UseNoteEditorOptions) {
  const navigate = useNavigate();
  const isEditMode = Boolean(noteId);

  const [title, setTitle] = useState(initialNote?.title ?? '');
  const [tagIds, setTagIds] = useState<string[]>(
    initialNote?.tags.map((t) => t.id) ?? [],
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [titleError, setTitleError] = useState<string | null>(null);

  // Holds the last-saved snapshot for dirty-state comparison
  const lastSavedRef = useRef<string>('');
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks the noteId after first create so subsequent saves use PATCH
  const resolvedNoteIdRef = useRef<string | undefined>(noteId);

  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote(noteId ?? '');

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialNote?.content ? (JSON.parse(initialNote.content) as object) : '',
    editable: true,
  });

  // Sync resolvedNoteId when prop changes (e.g. after navigation)
  useEffect(() => {
    resolvedNoteIdRef.current = noteId;
  }, [noteId]);

  // Initialise last-saved snapshot once initial note data arrives
  useEffect(() => {
    if (initialNote) {
      lastSavedRef.current = JSON.stringify({
        title: initialNote.title,
        content: initialNote.content,
        tagIds: initialNote.tags.map((t) => t.id),
      });
    }
  }, [initialNote]);

  const getCurrentSnapshot = useCallback(() => {
    return JSON.stringify({
      title,
      content: editor ? JSON.stringify(editor.getJSON()) : '',
      tagIds,
    });
  }, [title, tagIds, editor]);

  const isDirty = useCallback(() => {
    return getCurrentSnapshot() !== lastSavedRef.current;
  }, [getCurrentSnapshot]);

  const performSave = useCallback(async () => {
    const content = editor ? JSON.stringify(editor.getJSON()) : '';
    const validation = noteEditorFormSchema.safeParse({ title, content, tagIds });

    if (!validation.success) {
      setTitleError(validation.error.issues.find((i) => i.path.includes('title'))?.message ?? null);
      return;
    }

    setTitleError(null);
    setSaveStatus('saving');

    try {
      if (resolvedNoteIdRef.current) {
        await updateMutation.mutateAsync({ title, content, tagIds });
      } else {
        const created = await createMutation.mutateAsync({ title, content, tagIds });
        resolvedNoteIdRef.current = created.id;
        navigate(`/notes/${created.id}`, { replace: true });
      }
      lastSavedRef.current = getCurrentSnapshot();
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, [title, tagIds, editor, createMutation, updateMutation, navigate, getCurrentSnapshot]);

  const save = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (!isDirty()) return;
    void performSave();
  }, [isDirty, performSave]);

  // Wire autosave on editor content changes
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        if (isDirty()) void performSave();
      }, 1000);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, isDirty, performSave]);

  // Trigger autosave when title or tagIds change
  useEffect(() => {
    if (!isEditMode && !resolvedNoteIdRef.current && title === '' && tagIds.length === 0) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      if (isDirty()) void performSave();
    }, 1000);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [title, tagIds, isDirty, performSave, isEditMode]);

  const isSaving = saveStatus === 'saving' || createMutation.isPending || updateMutation.isPending;

  return {
    editor,
    title,
    setTitle,
    tagIds,
    setTagIds,
    titleError,
    saveStatus,
    isSaving,
    save,
  };
}
