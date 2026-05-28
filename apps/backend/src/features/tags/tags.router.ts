import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateBody } from '../../middleware/validate-body.js';
import { createTagSchema, updateTagSchema } from '@notepad/shared';
import { createTag, listTags, updateTag, deleteTag } from './tags.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validateBody(createTagSchema), createTag);
router.get('/', listTags);
router.patch('/:id', validateBody(updateTagSchema), updateTag);
router.delete('/:id', deleteTag);

export default router;
