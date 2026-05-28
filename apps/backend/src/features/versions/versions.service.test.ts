import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppError } from '../../lib/app-error.js';

// ─── Mock Prisma ──────────────────────────────────────────────────────────────

vi.mock('../../lib/prisma.js', () => {
  const note = {
    findFirst: vi.fn(),
    update: vi.fn(),
  };
  const noteVersion = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
  };
  return {
    default: {
      note,
      noteVersion,
      $transaction: vi.fn((cbOrQueries: unknown) => {
        if (Array.isArray(cbOrQueries)) {
          return Promise.all(cbOrQueries);
        }
        return (cbOrQueries as (tx: unknown) => unknown)({ note, noteVersion });
      }),
    },
  };
});

import prisma from '../../lib/prisma.js';
import { VersionsService } from './versions.service.js';

type MockNote = {
  findFirst: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
type MockNoteVersion = {
  findMany: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  count: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
};

const mockNote = (prisma as unknown as { note: MockNote }).note;
const mockNoteVersion = (prisma as unknown as { noteVersion: MockNoteVersion }).noteVersion;

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-1';
const NOTE_ID = 'note-1';
const VERSION_ID = 'version-1';

const mockNoteRow = {
  id: NOTE_ID,
  userId: USER_ID,
  title: 'Test Note',
  content: 'Hello world',
  deletedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockVersionRow = {
  id: VERSION_ID,
  noteId: NOTE_ID,
  title: 'Old Title',
  content: 'Old content',
  createdAt: new Date('2026-01-01'),
};

// ─── Setup ────────────────────────────────────────────────────────────────────

let service: VersionsService;

beforeEach(() => {
  vi.clearAllMocks();
  service = new VersionsService();
});

// ─── purgeOldVersions ─────────────────────────────────────────────────────────

describe('VersionsService.purgeOldVersions', () => {
  it('deletes versions older than the retention window', async () => {
    mockNoteVersion.deleteMany.mockResolvedValue({ count: 3 });

    const deleted = await service.purgeOldVersions(30);

    expect(mockNoteVersion.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: { lt: expect.any(Date) },
        },
      }),
    );
    expect(deleted).toBe(3);
  });

  it('does not delete versions within the retention window', async () => {
    mockNoteVersion.deleteMany.mockResolvedValue({ count: 0 });

    const deleted = await service.purgeOldVersions(30);

    const callArg = mockNoteVersion.deleteMany.mock.calls[0][0] as {
      where: { createdAt: { lt: Date } };
    };
    const cutoff = callArg.where.createdAt.lt;
    // cutoff should be approximately 30 days ago
    const expectedCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoff.getTime() - expectedCutoff)).toBeLessThan(5000);
    expect(deleted).toBe(0);
  });

  it('returns 0 when no versions qualify for purge', async () => {
    mockNoteVersion.deleteMany.mockResolvedValue({ count: 0 });

    const deleted = await service.purgeOldVersions(90);

    expect(deleted).toBe(0);
  });
});

// ─── listVersions ─────────────────────────────────────────────────────────────

describe('VersionsService.listVersions', () => {
  it('throws 404 when note does not belong to user', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    await expect(service.listVersions(NOTE_ID, USER_ID, 1, 20)).rejects.toThrow(
      new AppError(404, 'Note not found'),
    );
  });

  it('returns paginated version list ordered by createdAt desc', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findMany.mockResolvedValue([mockVersionRow]);
    mockNoteVersion.count.mockResolvedValue(1);

    const result = await service.listVersions(NOTE_ID, USER_ID, 1, 20);

    expect(mockNoteVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { noteId: NOTE_ID },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      }),
    );
    expect(result.versions).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

// ─── getVersion ───────────────────────────────────────────────────────────────

describe('VersionsService.getVersion', () => {
  it('throws 404 when note not found', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    await expect(service.getVersion(NOTE_ID, VERSION_ID, USER_ID)).rejects.toThrow(
      new AppError(404, 'Note not found'),
    );
  });

  it('throws 404 when version not found', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findFirst.mockResolvedValue(null);

    await expect(service.getVersion(NOTE_ID, 'no-such', USER_ID)).rejects.toThrow(
      new AppError(404, 'Version not found'),
    );
  });

  it('returns the version when found', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findFirst.mockResolvedValue(mockVersionRow);

    const result = await service.getVersion(NOTE_ID, VERSION_ID, USER_ID);

    expect(result.id).toBe(VERSION_ID);
    expect(result.title).toBe('Old Title');
  });
});

// ─── restoreVersion ───────────────────────────────────────────────────────────

describe('VersionsService.restoreVersion', () => {
  it('throws 404 when note not found', async () => {
    mockNote.findFirst.mockResolvedValue(null);

    await expect(service.restoreVersion(NOTE_ID, VERSION_ID, USER_ID)).rejects.toThrow(
      new AppError(404, 'Note not found'),
    );
  });

  it('throws 404 when version not found', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findFirst.mockResolvedValue(null);

    await expect(service.restoreVersion(NOTE_ID, 'no-such', USER_ID)).rejects.toThrow(
      new AppError(404, 'Version not found'),
    );
  });

  it('snapshots current state and updates note to restored content', async () => {
    mockNote.findFirst.mockResolvedValue(mockNoteRow);
    mockNoteVersion.findFirst.mockResolvedValue(mockVersionRow);
    mockNoteVersion.create.mockResolvedValue({});
    mockNote.update.mockResolvedValue({ ...mockNoteRow, title: 'Old Title', content: 'Old content', tags: [] });

    const result = await service.restoreVersion(NOTE_ID, VERSION_ID, USER_ID);

    expect(mockNoteVersion.create).toHaveBeenCalledWith({
      data: { noteId: NOTE_ID, title: 'Test Note', content: 'Hello world' },
    });
    expect(mockNote.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: NOTE_ID },
        data: { title: 'Old Title', content: 'Old content' },
      }),
    );
    expect(result.id).toBe(NOTE_ID);
  });
});
