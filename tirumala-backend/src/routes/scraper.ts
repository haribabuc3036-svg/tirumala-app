import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { runPollCycle, getPollerStatus } from '../jobs/ttd-poll.job';
import { scrapeSsdFromTirumala } from '../scraper/ssd.scraper';

const router = Router();

/**
 * GET /api/scraper/status
 * Returns the current state of the background poller.
 */
router.get(
  '/status',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: getPollerStatus() });
  })
);

/**
 * POST /api/scraper/run
 * Manually trigger one poll cycle immediately (outside the cron schedule).
 * Useful for testing or forcing a refresh after a known TTD update.
 */
router.post(
  '/run',
  asyncHandler(async (_req: Request, res: Response) => {
    const startTime = Date.now();
    const { updated, changes, errors } = await runPollCycle();
    const elapsed = Date.now() - startTime;

    res.json({
      success: true,
      updated,
      changes,
      elapsed_ms: elapsed,
      errors,
    });
  })
);

/**
 * POST /api/scraper/preview
 * Run the scraper and return the raw parsed data WITHOUT writing to Firebase/Supabase.
 * Great for debugging selectors and checking what the scraper sees.
 */
router.post(
  '/preview',
  asyncHandler(async (_req: Request, res: Response) => {
    const startTime = Date.now();
    const result = await scrapeSsdFromTirumala();
    const elapsed = Date.now() - startTime;

    res.json({
      success: true,
      elapsed_ms: elapsed,
      data: result,
    });
  })
);

export default router;
