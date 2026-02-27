import { Router } from 'express';
import darshanRouter from './darshan';
import ssdRouter from './ssd';
import scraperRouter from './scraper';
import servicesRouter from './services';
import wallpapersRouter from './wallpapers';
import placesRouter from './places';
import helpRouter from './help';

const router = Router();

router.use('/darshan', darshanRouter);
router.use('/ssd', ssdRouter);
router.use('/scraper', scraperRouter);
router.use('/services', servicesRouter);
router.use('/wallpapers', wallpapersRouter);
router.use('/places', placesRouter);
router.use('/help', helpRouter);

export default router;
