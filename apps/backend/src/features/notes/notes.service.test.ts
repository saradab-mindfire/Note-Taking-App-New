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
  };
  const noteTag = {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  };

  return {
    default: {
      note,
      noteTag,
      // $transaction executes the callback with a tx that has the same mocks
      $transaction: vi.fn((cb: (tx: unknown) => unknown) => cb({ note, noteTag })),
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

const mockTag = { id: TAG_ID, userId: USER_ID, name: 'Work', color: '#6366f1', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') };

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

describe('NotesService.listNotes', () => {
  it('returns all active notes for user, excluding content', async () => {
    mock.note.findMany.mockResolvedValue([mockNoteWithTags]);

    const result = await service.listNotes(USER_ID);

    expect(mock.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_ID, deletedAt: null },
      }),
    );
    expect(result).toHaveLength(1);
    expect((result[0] as Record<string, unknown>)['content']).toBeUndefined();
    expect(result[0]!.title).toBe('Test Note');
    expect(result[0]!.tags).toHaveLength(1);
  });

  it('returns empty array when user has no active notes', async () => {
    mock.note.findMany.mockResolvedValue([]);

    const result = await service.listNotes(USER_ID);

    expect(result).toEqual([]);
  });

  it('excludes soft-deleted notes (Prisma filter applied via where clause)', async () => {
    // Only active notes returned — soft-deleted excluded by the where: { deletedAt: null } filter
    mock.note.findMany.mockResolvedValue([mockNoteNoTags]);

    const result = await service.listNotes(USER_ID);

    expect(result).toHaveLength(1);
    // Confirm the where clause passes deletedAt: null
    expect(mock.note.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ deletedAt: null }) }),
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
      tags: [{ tag: { id: TAG_B, userId: USER_ID, name: 'Personal', color: '#ff0000', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01') } }],
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
