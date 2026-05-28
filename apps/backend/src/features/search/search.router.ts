import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validateQuery } from '../../middleware/validate-query.js';
import { searchQuerySchema } from '@notepad/shared';
import type { SearchQuery } from '@notepad/shared';
import { SearchService } from './search.service.js';

const router = Router();
const searchService = new SearchService();

router.use(authMiddleware);

router.get('/', validateQuery(searchQuerySchema), async (req, res, next) => {
  try {
    const query = res.locals['validatedQuery'] as SearchQuery;
    const result = await searchService.searchNotes(req.user!.userId, query);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
