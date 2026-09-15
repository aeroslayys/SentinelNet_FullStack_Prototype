import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { apiRouter } from './routes/api.js';
import { requestId } from './middleware/requestId.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: allowedOrigin }));
  app.use(express.json({ limit: '250kb' }));
  app.use(requestId);
  app.use(morgan('dev'));
  app.use(rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
    limit: Number(process.env.RATE_LIMIT_MAX || 240),
    standardHeaders: 'draft-7',
    legacyHeaders: false
  }));

  app.use('/api', apiRouter);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
