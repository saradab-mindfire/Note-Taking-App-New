import express from 'express';
import cors from 'cors';
import authRouter from './features/auth/auth.router.js';
import notesRouter from './features/notes/notes.router.js';
import searchRouter from './features/search/search.router.js';
import sharingRouter, { publicSharingRouter } from './features/sharing/sharing.router.js';
import tagsRouter from './features/tags/tags.router.js';
import { errorHandler } from './middleware/error-handler.js';
import { startVersionPurgeJob } from './lib/purge-versions.js';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Public share routes (no auth — registered before auth-protected routes)
app.use('/public', publicSharingRouter);

// Auth routes
app.use('/api/auth', authRouter);

// Notes routes
app.use('/api/notes', notesRouter);

// Search routes
app.use('/api/search', searchRouter);

// Sharing routes (auth-protected)
app.use('/api', sharingRouter);

// Tags routes
app.use('/api/tags', tagsRouter);

// Global error handler — must be registered after all routes
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startVersionPurgeJob();
});

export default app;
