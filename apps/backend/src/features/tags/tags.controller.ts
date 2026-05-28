import type { Request, Response, NextFunction } from 'express';
import { TagsService } from './tags.service.js';

const tagsService = new TagsService();

export async function createTag(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tag = await tagsService.createTag(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: tag });
  } catch (err) {
    next(err);
  }
}

export async function listTags(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tags = await tagsService.listTags(req.user!.userId);
    res.status(200).json({ success: true, data: tags });
  } catch (err) {
    next(err);
  }
}

export async function updateTag(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tagId = req.params['id'] as string;
    const tag = await tagsService.updateTag(req.user!.userId, tagId, req.body);
    res.status(200).json({ success: true, data: tag });
  } catch (err) {
    next(err);
  }
}

export async function deleteTag(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tagId = req.params['id'] as string;
    await tagsService.deleteTag(req.user!.userId, tagId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
