import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateQuery } from '../../middleware/validate-query.js';
import { noteVersionListQuerySchema } from '@notepad/shared';
import type { NoteVersionListQuery } from '@notepad/shared';
import { VersionsService } from './versions.service.js';

const router = Router({ mergeParams: true });
const versionsService = new VersionsService();

// All version routes require authentication
router.use(authMiddleware);

// ─── GET /:id/versions ────────────────────────────────────────────────────────

router.get('/', validateQuery(noteVersionListQuerySchema), async (req, res, next) => {
  try {
    const { id: noteId } = req.params as Record<string, string>;
    const query = res.locals['validatedQuery'] as NoteVersionListQuery;
    const result = await versionsService.listVersions(noteId!, req.user!.userId, query.page, query.limit);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:id/versions/:versionId ─────────────────────────────────────────────

router.get('/:versionId', async (req, res, next) => {
  try {
    const { id: noteId, versionId } = req.params as Record<string, string>;
    const version = await versionsService.getVersion(noteId!, versionId!, req.user!.userId);
    res.status(200).json({ success: true, data: version });
  } catch (err) {
    next(err);
  }
});

// ─── POST /:id/versions/:versionId/restore ────────────────────────────────────

router.post('/:versionId/restore', async (req, res, next) => {
  try {
    const { id: noteId, versionId } = req.params as Record<string, string>;
    const note = await versionsService.restoreVersion(noteId!, versionId!, req.user!.userId);
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

export default router;
