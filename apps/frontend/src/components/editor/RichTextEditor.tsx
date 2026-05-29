import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';

interface RichTextEditorProps {
  editor: Editor | null;
}

export function RichTextEditor({ editor }: RichTextEditorProps) {
  return (
    <div className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-within:outline-none focus-within:border-ring">
      <EditorContent editor={editor} className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none" />
    </div>
  );
}
