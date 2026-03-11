import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import apiRouter from './routes';
import { errorHandler } from './middleware/error';
import { startTtdPoller, getPollerStatus } from './jobs/ttd-poll.job';
import { startSchedulePoller, getSchedulePollerStatus } from './jobs/schedule-poll.job';
import { startPilgrimsPoller, getPilgrimsPollerStatus } from './jobs/pilgrims-poll.job';
import { startLatestUpdatesPoller, getLatestUpdatesPollerStatus } from './jobs/latest-updates-poll.job';
import { startEventsPoller, getEventsPollerStatus } from './jobs/events-poll.job';
import { startBrahmotsavamsPoller, getBrahmotsavamsPollerStatus } from './jobs/brahmotsavams-poll.job';
import { startUtsavamsPoller, getUtsavamsPollerStatus } from './jobs/utsavams-poll.job';
import { startTempleNewsPoller, getTempleNewsPollerStatus } from './jobs/temple-news-poll.job';
import { startVipNewsPoller, getVipNewsPollerStatus } from './jobs/vip-news-poll.job';
import { startDarshanNewsPoller, getDarshanNewsPollerStatus } from './jobs/darshan-news-poll.job';

const app = express();

// ─── Security & Logging ────────────────────────────────────────────────────────
app.use(helmet());

// Allow credentials (cookies) from the configured frontend origin(s)
const allowedOrigins = env.corsOrigin.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    credentials: true, // required to send/receive cookies cross-origin
  })
);

app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// ─── Body Parsing & Cookies ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
    latestUpdatesPoller: getLatestUpdatesPollerStatus(),
    eventsPoller: getEventsPollerStatus(),
    brahmotsavamsPoller: getBrahmotsavamsPollerStatus(),
    utsavamsPoller: getUtsavamsPollerStatus(),
    templeNewsPoller: getTempleNewsPollerStatus(),
    vipNewsPoller: getVipNewsPollerStatus(),
    darshanNewsPoller: getDarshanNewsPollerStatus(),
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

  // Start the 6-hourly Latest-Updates poller (00:00 / 06:00 / 12:00 / 18:00 IST)
  startLatestUpdatesPoller();

  // Start the 6-hourly Events poller (03:00 / 09:00 / 15:00 / 21:00 IST)
  startEventsPoller();

  // Start the 6-hourly Brahmotsavams poller (01:00 / 07:00 / 13:00 / 19:00 IST)
  startBrahmotsavamsPoller();

  // Start the 6-hourly Utsavams poller (02:00 / 08:00 / 14:00 / 20:00 IST)
  startUtsavamsPoller();

  // Start the 6-hourly Temple-News poller (04:00 / 10:00 / 16:00 / 22:00 IST)
  startTempleNewsPoller();

  // Start the 6-hourly VIP-News poller (05:00 / 11:00 / 17:00 / 23:00 IST)
  startVipNewsPoller();

  // Start the 4-hourly Darshan-News poller (:30 past every 4 hours IST)
  startDarshanNewsPoller();
});

export default app;
