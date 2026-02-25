import { Router } from 'express';
import darshanRouter from './darshan';
import ssdRouter from './ssd';
import scraperRouter from './scraper';

const router = Router();

router.use('/darshan', darshanRouter);
router.use('/ssd', ssdRouter);
router.use('/scraper', scraperRouter);

export default router;
