import type { NoteResponse, NoteVersion, NoteVersionListResponse } from '@notepad/shared';
import prisma from '../../lib/prisma.js';
import { AppError } from '../../lib/app-error.js';

const noteWithTagsInclude = {
  tags: {
    include: { tag: true },
  },
} as const;

function mapVersion(v: { id: string; title: string; content: string; createdAt: Date }): NoteVersion {
  return { id: v.id, title: v.title, content: v.content, createdAt: v.createdAt };
}

function mapNote(note: {
  id: string;
  userId: string;
  title: string;
  content: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ tag: { id: string; userId: string; name: string; color: string; createdAt: Date; updatedAt: Date } }>;
}): NoteResponse {
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

export class VersionsService {
  async listVersions(
    noteId: string,
    userId: string,
    page: number,
    limit: number,
  ): Promise<NoteVersionListResponse> {
    const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    const skip = (page - 1) * limit;
    const [versions, total] = await prisma.$transaction([
      prisma.noteVersion.findMany({
        where: { noteId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.noteVersion.count({ where: { noteId } }),
    ]);

    return { versions: versions.map(mapVersion), total, page, limit };
  }

  async getVersion(noteId: string, versionId: string, userId: string): Promise<NoteVersion> {
    const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    const version = await prisma.noteVersion.findFirst({ where: { id: versionId, noteId } });
    if (!version) {
      throw new AppError(404, 'Version not found');
    }

    return mapVersion(version);
  }

  async restoreVersion(noteId: string, versionId: string, userId: string): Promise<NoteResponse> {
    const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    const version = await prisma.noteVersion.findFirst({ where: { id: versionId, noteId } });
    if (!version) {
      throw new AppError(404, 'Version not found');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Snapshot the current state before restoring
      await tx.noteVersion.create({
        data: { noteId, title: note.title, content: note.content },
      });

      return tx.note.update({
        where: { id: noteId },
        data: { title: version.title, content: version.content },
        include: noteWithTagsInclude,
      });
    });

    return mapNote(updated);
  }

  async purgeOldVersions(retentionDays: number): Promise<number> {
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await prisma.noteVersion.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  }
}
