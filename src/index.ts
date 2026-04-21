import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

import authRouter from './routes/auth';
import eventsRouter from './routes/events';
import forumRouter from './routes/forum';
import notificationsRouter from './routes/notifications';
import professionalsRouter from './routes/professionals';
import servicesRouter from './routes/services';
import usersRouter from './routes/users';

const app = express();

// ─── Security ────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// ─── Rate limiting ───────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use(limiter);

// ─── Parsing ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ─────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/professionals', professionalsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/forum', forumRouter);
app.use('/api/events', eventsRouter);
app.use('/api/notifications', notificationsRouter);

// ─── Error handling ──────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start ───────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`\n🚀 LADS Backend running on http://localhost:${env.PORT}`);
  console.log(`📖 Health check: http://localhost:${env.PORT}/health`);
  console.log(`🗄️  Prisma Studio: npx prisma studio\n`);
});

export default app;
