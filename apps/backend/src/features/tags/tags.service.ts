import type { CreateTagDto, UpdateTagDto, TagResponse } from '@notepad/shared';
import prisma from '../../lib/prisma.js';
import { AppError } from '../../lib/app-error.js';

// ─── Types ────────────────────────────────────────────────────────────────────

type PrismaTag = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { notes: number };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const tagWithCountInclude = {
  _count: { select: { notes: true } },
} as const;

function mapTag(tag: PrismaTag): TagResponse {
  return {
    id: tag.id,
    userId: tag.userId,
    name: tag.name,
    color: tag.color,
    noteCount: tag._count.notes,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class TagsService {
  async createTag(userId: string, dto: CreateTagDto): Promise<TagResponse> {
    const name = dto.name.trim();

    const duplicate = await prisma.tag.findFirst({
      where: { userId, name: { equals: name, mode: 'insensitive' } },
    });

    if (duplicate) {
      throw new AppError(409, 'Tag name already exists');
    }

    const tag = await prisma.tag.create({
      data: { userId, name, color: dto.color },
      include: tagWithCountInclude,
    });

    return mapTag(tag);
  }

  async listTags(userId: string): Promise<TagResponse[]> {
    const tags = await prisma.tag.findMany({
      where: { userId },
      include: tagWithCountInclude,
      orderBy: { createdAt: 'asc' },
    });

    return tags.map(mapTag);
  }

  async updateTag(userId: string, tagId: string, dto: UpdateTagDto): Promise<TagResponse> {
    const existing = await prisma.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!existing) {
      throw new AppError(404, 'Tag not found');
    }

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const duplicate = await prisma.tag.findFirst({
        where: { userId, name: { equals: name, mode: 'insensitive' }, NOT: { id: tagId } },
      });
      if (duplicate) {
        throw new AppError(409, 'Tag name already exists');
      }
    }

    const tag = await prisma.tag.update({
      where: { id: tagId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
      include: tagWithCountInclude,
    });

    return mapTag(tag);
  }

  async deleteTag(userId: string, tagId: string): Promise<void> {
    const existing = await prisma.tag.findFirst({
      where: { id: tagId, userId },
    });

    if (!existing) {
      throw new AppError(404, 'Tag not found');
    }

    await prisma.tag.delete({ where: { id: tagId } });
  }
}
