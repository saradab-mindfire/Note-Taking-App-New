import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../lib/app-error.js';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock('../../lib/prisma.js', () => {
  const note = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  };
  const noteTag = {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  };

  return {
    default: {
      note,
      noteTag,
      // $transaction handles both callback form and array form (interactive vs batch)
      $transaction: vi.fn((cbOrQueries: unknown) => {
        if (Array.isArray(cbOrQueries)) {
          return Promise.all(cbOrQueries);
        }
        return (cbOrQueries as (tx: unknown) => unknown)({ note, noteTag });
      }),
    },
  };
});

import prisma from '../../lib/prisma.js';
import { NotesService, RESTORE_WINDOW_DAYS } from './notes.service.js';

// ─── Typed mock helpers ───────────────────────────────────────────────────────

type MockPrisma = {
  note: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  noteTag: {
    createMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const mock = prisma as unknown as MockPrisma;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-1';
const NOTE_ID = 'note-1';
const TAG_ID = 'tag-1';

const mockTag = { id: TAG_ID, userId: USER_ID, name: 'Work', color: '#6366f1' };

const mockNoteWithTags = {
  id: NOTE_ID,
  userId: USER_ID,
  title: 'Test Note',
  content: 'Hello world',
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  tags: [{ tag: mockTag }],
};

const mockNoteNoTags = { ...mockNoteWithTags, tags: [] };

// ─── Setup ────────────────────────────────────────────────────────────────────

let service: NotesService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new NotesService();
});

// ─── createNote ───────────────────────────────────────────────────────────────

describe('NotesService.createNote', () => {
  it('creates a note without tags and returns NoteResponse', async () => {
    mock.note.create.mockResolvedValue(mockNoteNoTags);

    const result = await service.createNote(USER_ID, { title: 'Test Note', content: 'Hello world' });

    expect(mock.note.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: USER_ID, title: 'Test Note' }),
      }),
    );
    expect(result.id).toBe(NOTE_ID);
    expect(result.tags).toEqual([]);
  });

  it('creates note with tags using a transaction', async () => {
    mock.note.create.mockResolvedValue(mockNoteNoTags);
    mock.noteTag.createMany.mockResolvedValue({ count: 1 });
    mock.note.findUnique.mockResolvedValue(mockNoteWithTags);

    const result = await service.createNote(USER_ID, {
      title: 'Test Note',
      content: 'Hello world',
      tagIds: [TAG_ID],
    });

    expect(mock.noteTag.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [{ noteId: NOTE_ID, tagId: TAG_ID }],
      }),
    );
    expect(result.tags).toHaveLength(1);
    expect(result.tags[0]!.id).toBe(TAG_ID);
  });

  it('does not call createMany when tagIds is empty', async () => {
    mock.note.create.mockResolvedValue(mockNoteNoTags);

    await service.createNote(USER_ID, { title: 'Test Note', tagIds: [] });

    expect(mock.noteTag.createMany).not.toHaveBeenCalled();
  });
});

// ─── getNoteById ──────────────────────────────────────────────────────────────

describe('NotesService.getNoteById', () => {
  it('returns note when found, active, and owned by user', async () => {
    mock.note.findFirst.mockResolvedValue(mockNoteWithTags);

    const result = await service.getNoteById(USER_ID, NOTE_ID);

    expect(mock.note.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: NOTE_ID, userId: USER_ID, deletedAt: null },
      }),
    );
    expect(result.id).toBe(NOTE_ID);
    expect(result.content).toBe('Hello world');
  });

  it('throws 404 when note does not exist', async () => {
    mock.note.findFirst.mockResolvedValue(null);

    await expect(service.getNoteById(USER_ID, 'no-such-note')).rejects.toThrow(
      new AppError(404, 'Note not found'),
    );
  });

  it('throws 404 when note belongs to another user (findFirst returns null due to userId filter)', async () => {
    mock.note.findFirst.mockResolvedValue(null);

    await expect(service.getNoteById('other-user', NOTE_ID)).rejects.toThrow(AppError);
  });

  it('throws 404 when note is soft-deleted (findFirst returns null due to deletedAt filter)', async () => {
    mock.note.findFirst.mockResolvedValue(null);

    await expect(service.getNoteById(USER_ID, NOTE_ID)).rejects.toThrow(AppError);
  });
});

// ─── listNotes ────────────────────────────────────────────────────────────────

const defaultQuery = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const,
  includeDeleted: false,
};

describe('NotesService.listNotes', () => {
  it('returns paginated envelope with active notes, excluding content', async () => {
    mock.note.findMany.mockResolvedValue([mockNoteWithTags]);
    mock.note.count.mockResolvedValue(1);

    const result = await service.listNotes(USER_ID, defaultQuery);

    expect(mock.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    );
    expect(result.notes).toHaveLength(1);
    expect((result.notes[0] as Record<string, unknown>)['content']).toBeUndefined();
    expect(result.notes[0]!.title).toBe('Test Note');
    expect(result.notes[0]!.tags).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('returns empty notes array with total 0 when user has no active notes', async () => {
    mock.note.findMany.mockResolvedValue([]);
    mock.note.count.mockResolvedValue(0);

    const result = await service.listNotes(USER_ID, defaultQuery);

    expect(result.notes).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('excludes soft-deleted notes by default (deletedAt: null in where clause)', async () => {
    mock.note.findMany.mockResolvedValue([mockNoteNoTags]);
    mock.note.count.mockResolvedValue(1);

    await service.listNotes(USER_ID, defaultQuery);

    expect(mock.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
    );
    expect(mock.note.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
    );
  });

  it('includes soft-deleted notes when includeDeleted=true', async () => {
    mock.note.findMany.mockResolvedValue([mockNoteWithTags, { ...mockNoteNoTags, deletedAt: new Date() }]);
    mock.note.count.mockResolvedValue(2);

    const result = await service.listNotes(USER_ID, { ...defaultQuery, includeDeleted: true });

    // deletedAt: null should NOT be in the where clause
    expect(mock.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: USER_ID } }),
    );
    expect(result.total).toBe(2);
  });

  it('applies tag filtering with AND semantics', async () => {
    mock.note.findMany.mockResolvedValue([mockNoteWithTags]);
    mock.note.count.mockResolvedValue(1);

    await service.listNotes(USER_ID, { ...defaultQuery, tags: [TAG_ID, 'tag-2'] });

    expect(mock.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [
            { tags: { some: { tagId: TAG_ID } } },
            { tags: { some: { tagId: 'tag-2' } } },
          ],
        }),
      }),
    );
  });

  it('applies correct pagination skip/take', async () => {
    mock.note.findMany.mockResolvedValue([]);
    mock.note.count.mockResolvedValue(25);

    await service.listNotes(USER_ID, { ...defaultQuery, page: 3, limit: 5 });

    expect(mock.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 5 }),
    );
    const result = await service.listNotes(USER_ID, { ...defaultQuery, page: 3, limit: 5 });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(5);
  });

  it('sorts by title ascending when specified', async () => {
    mock.note.findMany.mockResolvedValue([]);
    mock.note.count.mockResolvedValue(0);

    await service.listNotes(USER_ID, { ...defaultQuery, sortBy: 'title', sortOrder: 'asc' });

    expect(mock.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { title: 'asc' } }),
    );
  });
});

// ─── updateNote ───────────────────────────────────────────────────────────────

describe('NotesService.updateNote', () => {
  it('partially updates title only', async () => {
    mock.note.findFirst.mockResolvedValue(mockNoteNoTags);
    const updated = { ...mockNoteNoTags, title: 'New Title' };
    mock.note.update.mockResolvedValue(updated);

    const result = await service.updateNote(USER_ID, NOTE_ID, { title: 'New Title' });

    expect(mock.note.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: NOTE_ID },
        data: { title: 'New Title' },
      }),
    );
    expect(result.title).toBe('New Title');
  });

  it('replaces full tag set when tagIds provided', async () => {
    const TAG_B = 'tag-b';
    mock.note.findFirst.mockResolvedValue(mockNoteWithTags); // has tag-1
    mock.note.update.mockResolvedValue(mockNoteNoTags);
    mock.noteTag.deleteMany.mockResolvedValue({ count: 1 });
    mock.noteTag.createMany.mockResolvedValue({ count: 1 });
    mock.note.findUnique.mockResolvedValue({
      ...mockNoteNoTags,
      tags: [{ tag: { id: TAG_B, userId: USER_ID, name: 'Personal', color: '#ff0000' } }],
    });

    const result = await service.updateNote(USER_ID, NOTE_ID, { tagIds: [TAG_B] });

    expect(mock.noteTag.deleteMany).toHaveBeenCalledWith({ where: { noteId: NOTE_ID } });
    expect(mock.noteTag.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: [{ noteId: NOTE_ID, tagId: TAG_B }] }),
    );
    expect(result.tags[0]!.id).toBe(TAG_B);
  });

  it('clears all tags when tagIds is empty array', async () => {
    mock.note.findFirst.mockResolvedValue(mockNoteWithTags);
    mock.note.update.mockResolvedValue(mockNoteNoTags);
    mock.noteTag.deleteMany.mockResolvedValue({ count: 1 });
    mock.note.findUnique.mockResolvedValue(mockNoteNoTags);

    const result = await service.updateNote(USER_ID, NOTE_ID, { tagIds: [] });

    expect(mock.noteTag.deleteMany).toHaveBeenCalled();
    expect(mock.noteTag.createMany).not.toHaveBeenCalled();
    expect(result.tags).toEqual([]);
  });

  it('throws 404 when note not found or soft-deleted', async () => {
    mock.note.findFirst.mockResolvedValue(null);

    await expect(service.updateNote(USER_ID, NOTE_ID, { title: 'x' })).rejects.toThrow(
      new AppError(404, 'Note not found'),
    );
  });
});

// ─── deleteNote ───────────────────────────────────────────────────────────────

describe('NotesService.deleteNote', () => {
  it('sets deletedAt on the note', async () => {
    mock.note.findFirst.mockResolvedValue(mockNoteNoTags);
    mock.note.update.mockResolvedValue({ ...mockNoteNoTags, deletedAt: new Date() });

    await service.deleteNote(USER_ID, NOTE_ID);

    expect(mock.note.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: NOTE_ID },
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });

  it('throws 404 when note not found', async () => {
    mock.note.findFirst.mockResolvedValue(null);

    await expect(service.deleteNote(USER_ID, NOTE_ID)).rejects.toThrow(
      new AppError(404, 'Note not found'),
    );
  });
});

// ─── restoreNote ──────────────────────────────────────────────────────────────

describe('NotesService.restoreNote', () => {
  it('restores note within recovery window', async () => {
    const recentlyDeleted = {
      ...mockNoteNoTags,
      deletedAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    };
    mock.note.findFirst.mockResolvedValue(recentlyDeleted);
    mock.note.update.mockResolvedValue(mockNoteNoTags);

    const result = await service.restoreNote(USER_ID, NOTE_ID);

    expect(mock.note.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: NOTE_ID },
        data: { deletedAt: null },
      }),
    );
    expect(result.deletedAt).toBeNull();
  });

  it('throws 410 when recovery window has expired', async () => {
    const expiredDeletion = {
      ...mockNoteNoTags,
      deletedAt: new Date(
        Date.now() - (RESTORE_WINDOW_DAYS + 1) * 24 * 60 * 60 * 1000,
      ),
    };
    mock.note.findFirst.mockResolvedValue(expiredDeletion);

    await expect(service.restoreNote(USER_ID, NOTE_ID)).rejects.toThrow(
      new AppError(410, 'Recovery window expired'),
    );
    expect(mock.note.update).not.toHaveBeenCalled();
  });

  it('throws 404 when note is not soft-deleted', async () => {
    mock.note.findFirst.mockResolvedValue(null); // deletedAt: {not: null} filter returns nothing

    await expect(service.restoreNote(USER_ID, NOTE_ID)).rejects.toThrow(
      new AppError(404, 'Note not found'),
    );
  });

  it('throws 404 when note belongs to another user', async () => {
    mock.note.findFirst.mockResolvedValue(null);

    await expect(service.restoreNote('other-user', NOTE_ID)).rejects.toThrow(AppError);
  });
});
