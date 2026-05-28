import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate-body.js';
import { createShareLinkSchema } from '@notepad/shared';
import { SharingService } from './sharing.service.js';

const sharingService = new SharingService();

// ─── Auth-protected routes ────────────────────────────────────────────────────

const router = Router();
router.use(authMiddleware);

// POST /api/notes/:id/share
router.post('/notes/:id/share', validateBody(createShareLinkSchema), async (req, res, next) => {
  try {
    const noteId = req.params['id'] as string;
    const result = await sharingService.generateShareLink(req.user!.userId, noteId, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/share/:token
router.delete('/share/:token', async (req, res, next) => {
  try {
    const token = req.params['token'] as string;
    await sharingService.revokeShareLink(req.user!.userId, token);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

// ─── Public routes (no auth) ──────────────────────────────────────────────────

export const publicSharingRouter = Router();

// GET /public/share/:token
publicSharingRouter.get('/share/:token', async (req, res, next) => {
  try {
    const token = req.params['token'] as string;
    const note = await sharingService.getPublicNote(token);
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});
