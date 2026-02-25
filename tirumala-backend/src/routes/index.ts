import { Router } from 'express';
import darshanRouter from './darshan';
import ssdRouter from './ssd';

const router = Router();

router.use('/darshan', darshanRouter);
router.use('/ssd', ssdRouter);

export default router;
