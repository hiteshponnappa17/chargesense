import express, { type Express } from 'express';
import cors from 'cors';
import routes from './routes';
import { notFound, errorHandler } from './middleware/error';
import { env } from './config/env';

export function createApp(): Express {
  const app = express();

  const allowedOrigins = new Set([
    env.clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]);

  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser tools (no origin) and any allow-listed origin.
        if (!origin || allowedOrigins.has(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => {
    res.json({ success: true, data: { name: 'ChargeSense API', docs: '/api/health' } });
  });

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
