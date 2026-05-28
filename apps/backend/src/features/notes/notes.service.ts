import type { CreateNoteDto, UpdateNoteDto, NoteResponse, NoteListItem, ListNotesQuery, NotesListResponse } from '@notepad/shared';
import prisma from '../../lib/prisma.js';
import { AppError } from '../../lib/app-error.js';

// TODO: schedule hard-delete job for notes outside the recovery window
export const RESTORE_WINDOW_DAYS = 30;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const noteWithTagsInclude = {
  tags: {
    include: { tag: true },
  },
} as const;

/**
 * Maps a Prisma note+tags result to the shared NoteResponse shape.
 * Flattens the NoteTag join rows to plain TagResponse objects.
 */
function mapNote(note: PrismaNote): NoteResponse {
  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    tags: note.tags.map((nt) => ({
      id: nt.tag.id,
      userId: nt.tag.userId,
      name: nt.tag.name,
      color: nt.tag.color,
      createdAt: nt.tag.createdAt,
      updatedAt: nt.tag.updatedAt,
    })),
    deletedAt: note.deletedAt,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

/**
 * Maps a Prisma note+tags result to the shared NoteListItem shape (no content).
 */
function mapNoteListItem(note: PrismaNote): NoteListItem {
  const mapped = mapNote(note);
  return {
    id: mapped.id,
    userId: mapped.userId,
    title: mapped.title,
    tags: mapped.tags,
    deletedAt: mapped.deletedAt,
    createdAt: mapped.createdAt,
    updatedAt: mapped.updatedAt,
  };
}

// Prisma return type for a note with tags included
type PrismaNote = {
  id: string;
  userId: string;
  title: string;
  content: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{
    tag: {
      id: string;
      userId: string;
      name: string;
      color: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }>;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export class NotesService {
  /**
   * Creates a new note owned by userId.
   * If tagIds are provided, creates NoteTag associations in the same transaction.
   */
  async createNote(userId: string, dto: CreateNoteDto): Promise<NoteResponse> {
    const { tagIds, ...noteData } = dto;

    const note = await prisma.$transaction(async (tx) => {
      const created = await tx.note.create({
        data: {
          userId,
          title: noteData.title,
          content: noteData.content ?? '',
        },
        include: noteWithTagsInclude,
      });

      if (tagIds && tagIds.length > 0) {
        await tx.noteTag.createMany({
          data: tagIds.map((tagId) => ({ noteId: created.id, tagId })),
          skipDuplicates: true,
        });

        // Re-fetch with tags populated
        const withTags = await tx.note.findUnique({
          where: { id: created.id },
          include: noteWithTagsInclude,
        });
        return withTags!;
      }

      return created;
    });

    return mapNote(note);
  }

  /**
   * Returns a single non-deleted note belonging to userId.
   * Throws 404 if not found, soft-deleted, or owned by a different user.
   */
  async getNoteById(userId: string, noteId: string): Promise<NoteResponse> {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId, deletedAt: null },
      include: noteWithTagsInclude,
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    return mapNote(note);
  }

  /**
   * Returns a paginated, sorted, and filtered list of notes for userId.
   * Supports tag filtering (AND semantics), includeDeleted, sortBy/sortOrder, and page/limit.
   */
  async listNotes(userId: string, query: ListNotesQuery): Promise<NotesListResponse> {
    const { page, limit, sortBy, sortOrder, tags, includeDeleted } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { userId };
    if (!includeDeleted) {
      where['deletedAt'] = null;
    }
    if (tags && tags.length > 0) {
      where['AND'] = tags.map((tagId) => ({
        tags: { some: { tagId } },
      }));
    }

    // Build orderBy clause
    const orderBy = { [sortBy]: sortOrder };

    const [notes, total] = await prisma.$transaction([
      prisma.note.findMany({
        where,
        include: noteWithTagsInclude,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    return {
      notes: notes.map(mapNoteListItem),
      total,
      page,
      limit,
    };
  }

  /**
   * Updates title, content, and/or tags (full tag-set replace) for a note.
   * PATCH semantics — only provided fields are changed.
   * Throws 404 if not found, soft-deleted, or owned by a different user.
   */
  async updateNote(userId: string, noteId: string, dto: UpdateNoteDto): Promise<NoteResponse> {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new AppError(404, 'Note not found');
    }

    const { tagIds, ...fields } = dto;

    const note = await prisma.$transaction(async (tx) => {
      const updated = await tx.note.update({
        where: { id: noteId },
        data: {
          ...(fields.title !== undefined && { title: fields.title }),
          ...(fields.content !== undefined && { content: fields.content }),
        },
        include: noteWithTagsInclude,
      });

      if (tagIds !== undefined) {
        // Full replace: delete existing associations then re-create
        await tx.noteTag.deleteMany({ where: { noteId } });

        if (tagIds.length > 0) {
          await tx.noteTag.createMany({
            data: tagIds.map((tagId) => ({ noteId, tagId })),
            skipDuplicates: true,
          });
        }

        const withTags = await tx.note.findUnique({
          where: { id: noteId },
          include: noteWithTagsInclude,
        });
        return withTags!;
      }

      return updated;
    });

    return mapNote(note);
  }

  /**
   * Soft-deletes a note by setting deletedAt to now().
   * Throws 404 if not found or owned by a different user.
   */
  async deleteNote(userId: string, noteId: string): Promise<void> {
    const existing = await prisma.note.findFirst({
      where: { id: noteId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new AppError(404, 'Note not found');
    }

    await prisma.note.update({
      where: { id: noteId },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restores a soft-deleted note if within the recovery window.
   * Throws 404 if note is not soft-deleted or not owned by userId.
   * Throws 410 if the recovery window has expired.
   */
  async restoreNote(userId: string, noteId: string): Promise<NoteResponse> {
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId, deletedAt: { not: null } },
      include: noteWithTagsInclude,
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    const windowMs = RESTORE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const expiry = new Date(note.deletedAt!.getTime() + windowMs);

    if (new Date() > expiry) {
      throw new AppError(410, 'Recovery window expired');
    }

    const restored = await prisma.note.update({
      where: { id: noteId },
      data: { deletedAt: null },
      include: noteWithTagsInclude,
    });

    return mapNote(restored);
  }
}
