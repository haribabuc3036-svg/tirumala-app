import { Router, type Request, type Response, type NextFunction } from 'express';
import darshanRouter from './darshan';
import ssdRouter from './ssd';
import scraperRouter from './scraper';
import servicesRouter from './services';
import wallpapersRouter from './wallpapers';
import placesRouter from './places';
import helpRouter from './help';
import ssdLocationsRouter from './ssd-locations';
import authRouter from './auth';
import aiRouter from './ai';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ─── Auth (public) ────────────────────────────────────────────────────────────
router.use('/auth', authRouter);

// ─── AI chat (public — no auth required) ─────────────────────────────────────
router.use('/ai', aiRouter);

// ─── Write-protection ─────────────────────────────────────────────────────────
// All POST / PUT / PATCH / DELETE requests on every route below this point
// require a valid Bearer JWT obtained from POST /api/auth/login.
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

router.use((req: Request, res: Response, next: NextFunction) => {
  if (WRITE_METHODS.has(req.method)) {
    return requireAuth(req, res, next);
  }
  next();
});

// ─── Resource routes ─────────────────────────────────────────────────────────
router.use('/darshan', darshanRouter);
router.use('/ssd', ssdRouter);
router.use('/scraper', scraperRouter);
router.use('/services', servicesRouter);
router.use('/wallpapers', wallpapersRouter);
router.use('/places', placesRouter);
router.use('/help', helpRouter);
router.use('/ssd-locations', ssdLocationsRouter);

export default router;
