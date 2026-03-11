import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/error';
import {
  getAllDarshanUpdates,
  getDarshanUpdates,
  upsertDarshanUpdate,
} from '../services/supabase.service';
import { updateLivePilgrims } from '../services/firebase.service';

const router = Router();

/**
 * GET /api/darshan
 * Returns paginated darshan updates from Supabase.
 * Query params: ?page=1&limit=10
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const data = await getDarshanUpdates(page, limit);
    res.json({ success: true, page, limit, data });
  })
);

/**
 * GET /api/darshan/all
 * Returns all records (no pagination) for seeding the app.
 */
router.get(
  '/all',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getAllDarshanUpdates();
    res.json({ success: true, count: data.length, data });
  })
);

/**
 * POST /api/darshan
 * Upsert a darshan update (writes to Supabase) and simultaneously
 * pushes the latest day to Firebase RTDB so the app gets it live.
 *
 * Body: { date, pilgrims, tonsures, hundi, waiting, darshan_time }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const row = await upsertDarshanUpdate(payload);

    // Mirror to Firebase so all connected apps update in real time
    await updateLivePilgrims({
      date: row.date,
      pilgrims: row.pilgrims,
      tonsures: row.tonsures,
      hundi: row.hundi,
      waiting: row.waiting,
      time: row.darshan_time,
    });

    res.status(201).json({ success: true, data: row });
  })
);

export default router;
