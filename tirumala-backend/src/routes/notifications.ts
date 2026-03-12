import { Router, type Request, type Response } from 'express';
import {
  upsertFcmToken,
  broadcastNotification,
  getAllFcmTokens,
} from '../services/push-notification.service';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ─── POST /api/notifications/register (public) ───────────────────────────────
// Called by the Expo app on startup to register/refresh the FCM token.
router.post('/register', async (req: Request, res: Response) => {
  const { token, platform } = req.body as { token?: string; platform?: string };

  if (!token || typeof token !== 'string') {
    res.status(400).json({ success: false, error: 'token is required' });
    return;
  }

  try {
    await upsertFcmToken(token, platform);
    res.json({ success: true });
  } catch (err) {
    console.error('[notifications] register error:', err);
    res.status(500).json({ success: false, error: 'Failed to register token' });
  }
});

// ─── POST /api/notifications/send (admin only) ───────────────────────────────
// Broadcasts a push notification to all registered devices.
router.post('/send', requireAuth, async (req: Request, res: Response) => {
  const { title, body, data } = req.body as {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  };

  if (!title || !body) {
    res.status(400).json({ success: false, error: 'title and body are required' });
    return;
  }

  try {
    const result = await broadcastNotification({ title, body, data });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[notifications] send error:', err);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

// ─── GET /api/notifications/count (admin only) ───────────────────────────────
// Returns how many devices are currently registered.
router.get('/count', requireAuth, async (_req: Request, res: Response) => {
  try {
    const tokens = await getAllFcmTokens();
    res.json({ success: true, count: tokens.length });
  } catch (err) {
    console.error('[notifications] count error:', err);
    res.status(500).json({ success: false, error: 'Failed to get count' });
  }
});

export default router;
