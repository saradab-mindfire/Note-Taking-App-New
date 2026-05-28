import { describe, it, expect } from 'vitest';
import { searchQuerySchema, searchResultItemSchema } from './search.js';

describe('searchQuerySchema', () => {
  it('rejects missing q', () => {
    const result = searchQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty q', () => {
    const result = searchQuerySchema.safeParse({ q: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('q');
    }
  });

  it('accepts valid q with default page and limit', () => {
    const result = searchQuerySchema.safeParse({ q: 'notes' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it('accepts explicit page and limit', () => {
    const result = searchQuerySchema.safeParse({ q: 'test', page: '2', limit: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(10);
    }
  });

  it('rejects page=0', () => {
    const result = searchQuerySchema.safeParse({ q: 'test', page: '0' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('page');
    }
  });

  it('rejects limit=200 (exceeds max)', () => {
    const result = searchQuerySchema.safeParse({ q: 'test', limit: '200' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain('limit');
    }
  });

  it('rejects limit=0', () => {
    const result = searchQuerySchema.safeParse({ q: 'test', limit: '0' });
    expect(result.success).toBe(false);
  });
});

describe('searchResultItemSchema', () => {
  it('accepts a valid result item', () => {
    const result = searchResultItemSchema.safeParse({
      id: 'abc',
      title: 'My Note',
      snippet: '...highlighted...',
      score: 0.75,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing id', () => {
    const result = searchResultItemSchema.safeParse({
      title: 'My Note',
      snippet: '...',
      score: 0.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-number score', () => {
    const result = searchResultItemSchema.safeParse({
      id: 'abc',
      title: 'My Note',
      snippet: '...',
      score: 'high',
    });
    expect(result.success).toBe(false);
  });
});
