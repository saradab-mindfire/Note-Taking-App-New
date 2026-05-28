import express from 'express';
import authRouter from './features/auth/auth.router.js';
import notesRouter from './features/notes/notes.router.js';
import tagsRouter from './features/tags/tags.router.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.use('/api/auth', authRouter);

// Notes routes
app.use('/api/notes', notesRouter);

// Tags routes
app.use('/api/tags', tagsRouter);

// Global error handler — must be registered after all routes
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
