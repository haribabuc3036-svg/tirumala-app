import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { getLatestSsdStatus, upsertSsdStatus } from '../services/supabase.service';
import { updateLiveSsdStatus, updateSarvaQueue, getLiveSsdStatus, getSarvaQueue } from '../services/firebase.service';
import { scrapeSsdFromTirumala } from '../scraper/ssd.scraper';

const router = Router();

/**
 * GET /api/ssd/scrape
 * Scrapes the Slotted Sarva Darshan status live from tirumala.org using
 * Playwright headless browser. No DB reads/writes — pure live scrape.
 *
 * Returns:
 *   running_slot, slot_date, balance_tickets, balance_date, note, scraped_at
 */
router.get(
  '/scrape',
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await scrapeSsdFromTirumala();

    if (!result.success) {
      return res.status(502).json({
        success: false,
        error: result.error,
        hint: 'tirumala.org may be down or its page structure may have changed.',
      });
    }

    res.json({ success: true, data: result.data });
  })
);

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
 * Update SSD status — writes to Firebase (live broadcast).
 *
 * Body: { running_slot, slot_date, balance_date, balance_tickets }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { running_slot, slot_date, balance_date, balance_tickets } = req.body as {
      running_slot: string;
      slot_date: string;
      balance_date: string;
      balance_tickets: string;
    };

    await updateLiveSsdStatus({ running_slot, slot_date, balance_date, balance_tickets });

    res.status(201).json({ success: true, data: { running_slot, slot_date, balance_date, balance_tickets } });
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
