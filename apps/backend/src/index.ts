import express from 'express';
import authRouter from './features/auth/auth.router.js';

const app = express();
const PORT = process.env['PORT'] ?? 3000;

app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes
app.use('/api/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
