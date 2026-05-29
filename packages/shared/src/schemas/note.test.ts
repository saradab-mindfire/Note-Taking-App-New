import { describe, it, expect } from 'vitest';
import { noteEditorFormSchema } from './note.js';

describe('noteEditorFormSchema', () => {
  it('rejects empty title', () => {
    const result = noteEditorFormSchema.safeParse({ title: '', content: '{}', tagIds: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('title');
    }
  });

  it('rejects missing title', () => {
    const result = noteEditorFormSchema.safeParse({ content: '{}' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('title');
    }
  });

  it('rejects title exceeding 500 characters', () => {
    const result = noteEditorFormSchema.safeParse({ title: 'a'.repeat(501), content: '{}' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('title');
    }
  });

  it('accepts valid input without tagIds', () => {
    const result = noteEditorFormSchema.safeParse({ title: 'My Note', content: '{}' });
    expect(result.success).toBe(true);
  });

  it('accepts valid input with tagIds', () => {
    const result = noteEditorFormSchema.safeParse({
      title: 'My Note',
      content: '{}',
      tagIds: ['tag-1', 'tag-2'],
    });
    expect(result.success).toBe(true);
  });

  it('defaults content to empty string when omitted', () => {
    const result = noteEditorFormSchema.safeParse({ title: 'My Note' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe('');
    }
  });
});
