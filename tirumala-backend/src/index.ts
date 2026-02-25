import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import apiRouter from './routes';
import { errorHandler } from './middleware/error';
import { startTtdPoller, getPollerStatus } from './jobs/ttd-poll.job';
import { startSchedulePoller, getSchedulePollerStatus } from './jobs/schedule-poll.job';
import { startPilgrimsPoller, getPilgrimsPollerStatus } from './jobs/pilgrims-poll.job';

const app = express();

// ─── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// ─── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'tirumala-backend',
    timestamp: new Date().toISOString(),
    env: env.nodeEnv,
    poller: getPollerStatus(),
    schedulePoller: getSchedulePollerStatus(),
    pilgrimsPoller: getPilgrimsPollerStatus(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(env.port, () => {
  console.log(`\n🚀  Tirumala backend running on http://localhost:${env.port}`);
  console.log(`   ENV  : ${env.nodeEnv}`);
  console.log(`   Health: http://localhost:${env.port}/health\n`);

  // Start the TTD website poller after the server is ready
  startTtdPoller(env.scrapeSchedule);

  // Start the daily Day-Schedule poller (00:01 IST)
  startSchedulePoller();

  // Start the 8-hourly Pilgrims poller (00:00 / 08:00 / 16:00 IST)
  startPilgrimsPoller();
});

export default app;
