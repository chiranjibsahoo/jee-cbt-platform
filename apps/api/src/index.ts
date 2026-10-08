import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { authRouter } from './routes/auth';
import { examRouter } from './routes/exams';
import { questionRouter } from './routes/questions';
import { attemptRouter } from './routes/attempts';
import { analyticsRouter } from './routes/analytics';
import { bookmarkRouter } from './routes/bookmarks';
import { mistakeRouter } from './routes/mistakes';
import { adminRouter } from './routes/admin';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/exams', examRouter);
app.use('/api/questions', questionRouter);
app.use('/api/attempts', attemptRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/bookmarks', bookmarkRouter);
app.use('/api/mistakes', mistakeRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 JEE CBT API running on http://localhost:${PORT}`);
});

export default app;
