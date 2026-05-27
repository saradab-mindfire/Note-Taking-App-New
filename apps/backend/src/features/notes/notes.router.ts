import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate-body.js';
import { validateQuery } from '../../middleware/validate-query.js';
import { createNoteSchema, updateNoteSchema, listNotesQuerySchema } from '@notepad/shared';
import type { ListNotesQuery } from '@notepad/shared';
import { NotesService } from './notes.service.js';

const router = Router();
const notesService = new NotesService();

// All notes routes require authentication
router.use(authMiddleware);

// ─── POST / ───────────────────────────────────────────────────────────────────

/**
 * POST /api/notes
 * Creates a new note for the authenticated user.
 * Returns 201 { success: true, data: note }
 */
router.post('/', validateBody(createNoteSchema), async (req, res, next) => {
  try {
    const note = await notesService.createNote(req.user!.userId, req.body);
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

// ─── GET / ────────────────────────────────────────────────────────────────────

/**
 * GET /api/notes
 * Lists notes for the authenticated user with pagination, sorting, tag filtering,
 * and optional inclusion of soft-deleted notes.
 * Returns 200 { success: true, data: { notes, total, page, limit } }
 */
router.get('/', validateQuery(listNotesQuerySchema), async (req, res, next) => {
  try {
    const query = res.locals['validatedQuery'] as ListNotesQuery;
    const result = await notesService.listNotes(req.user!.userId, query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:id ─────────────────────────────────────────────────────────────────

/**
 * GET /api/notes/:id
 * Returns a single non-deleted note belonging to the authenticated user.
 * Returns 200 { success: true, data: note } or 404.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const noteId = req.params['id'] as string;
    const note = await notesService.getNoteById(req.user!.userId, noteId);
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /:id ───────────────────────────────────────────────────────────────

/**
 * PATCH /api/notes/:id
 * Partially updates title, content, and/or tags (full tag-set replace).
 * Returns 200 { success: true, data: note } or 404.
 */
router.patch('/:id', validateBody(updateNoteSchema), async (req, res, next) => {
  try {
    const noteId = req.params['id'] as string;
    const note = await notesService.updateNote(req.user!.userId, noteId, req.body);
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

/**
 * DELETE /api/notes/:id
 * Soft-deletes a note (sets deletedAt). Returns 204 No Content or 404.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const noteId = req.params['id'] as string;
    await notesService.deleteNote(req.user!.userId, noteId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── POST /:id/restore ────────────────────────────────────────────────────────

/**
 * POST /api/notes/:id/restore
 * Restores a soft-deleted note within the 30-day recovery window.
 * Returns 200 { success: true, data: note }, 404, or 410.
 */
router.post('/:id/restore', async (req, res, next) => {
  try {
    const noteId = req.params['id'] as string;
    const note = await notesService.restoreNote(req.user!.userId, noteId);
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
});

export default router;
