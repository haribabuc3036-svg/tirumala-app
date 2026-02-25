import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { getLatestSsdStatus, upsertSsdStatus } from '../services/supabase.service';
import { updateLiveSsdStatus, updateSarvaQueue, getLiveSsdStatus, getSarvaQueue } from '../services/firebase.service';

const router = Router();

/**
 * GET /api/ssd
 * Returns latest SSD status from Supabase (persistent storage).
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getLatestSsdStatus();
    res.json({ success: true, data });
  })
);

/**
 * GET /api/ssd/live
 * Returns live SSD status directly from Firebase RTDB (fastest, real-time).
 */
router.get(
  '/live',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getLiveSsdStatus();
    res.json({ success: true, data });
  })
);

/**
 * POST /api/ssd
 * Update SSD status — writes to Supabase (persistent) and Firebase (live).
 *
 * Body: { running_slot, balance_tickets, date }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { running_slot, balance_tickets, date } = req.body as {
      running_slot: string;
      balance_tickets: string;
      date: string;
    };

    // 1. Persist to Supabase
    const row = await upsertSsdStatus({ running_slot, balance_tickets, date });

    // 2. Push live update to Firebase (all connected app clients update instantly)
    await updateLiveSsdStatus({ running_slot, balance_tickets, date });

    res.status(201).json({ success: true, data: row });
  })
);

/**
 * GET /api/ssd/queue
 * Returns the current Sarva Darshan queue wait time text from Firebase RTDB.
 */
router.get(
  '/queue',
  asyncHandler(async (_req: Request, res: Response) => {
    const queue_time = await getSarvaQueue();
    res.json({ success: true, data: { queue_time } });
  })
);

/**
 * PATCH /api/ssd/queue
 * Update just the Sarva Darshan queue wait time text in Firebase.
 *
 * Body: { queue_time: "18H" }
 */
router.patch(
  '/queue',
  asyncHandler(async (req: Request, res: Response) => {
    const { queue_time } = req.body as { queue_time: string };
    await updateSarvaQueue(queue_time);
    res.json({ success: true, message: `Queue updated to "${queue_time}"` });
  })
);

export default router;
