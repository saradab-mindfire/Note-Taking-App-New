import { randomBytes } from 'crypto';
import type { CreateShareLinkDto, ShareLinkResponse, PublicNoteResponse } from '@notepad/shared';
import prisma from '../../lib/prisma.js';
import { AppError } from '../../lib/app-error.js';

const BASE_URL = process.env['APP_URL'] ?? 'http://localhost:3000';

export class SharingService {
  async generateShareLink(userId: string, noteId: string, dto: CreateShareLinkDto): Promise<ShareLinkResponse> {
    const note = await prisma.note.findFirst({ where: { id: noteId, deletedAt: null } });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (note.userId !== userId) {
      throw new AppError(403, 'Forbidden');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    await prisma.sharedLink.create({
      data: { noteId, token, expiresAt },
    });

    return {
      token,
      shareUrl: `${BASE_URL}/public/share/${token}`,
      expiresAt,
    };
  }

  async revokeShareLink(userId: string, token: string): Promise<void> {
    const link = await prisma.sharedLink.findUnique({
      where: { token },
      include: { note: true },
    });

    if (!link) {
      throw new AppError(404, 'Share link not found');
    }

    if (link.note.userId !== userId) {
      throw new AppError(403, 'Forbidden');
    }

    await prisma.sharedLink.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }

  async getPublicNote(token: string): Promise<PublicNoteResponse> {
    const link = await prisma.sharedLink.findUnique({
      where: { token },
      include: { note: true },
    });

    if (!link) {
      throw new AppError(404, 'Share link not found');
    }

    if (link.revokedAt !== null) {
      throw new AppError(403, 'Link has been revoked');
    }

    if (link.expiresAt !== null && link.expiresAt < new Date()) {
      throw new AppError(403, 'Link has expired');
    }

    if (link.note.deletedAt !== null) {
      throw new AppError(403, 'Note is no longer available');
    }

    const updated = await prisma.sharedLink.update({
      where: { token },
      data: { viewCount: { increment: 1 } },
    });

    return {
      id: link.note.id,
      title: link.note.title,
      content: link.note.content,
      createdAt: link.note.createdAt,
      updatedAt: link.note.updatedAt,
      viewCount: updated.viewCount,
    };
  }
}
