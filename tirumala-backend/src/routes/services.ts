import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '../middleware/error';
import {
  createServiceCatalogItem,
  deleteServiceCatalogItem,
  getServiceById,
  getServicesCatalog,
  syncServicesCatalog,
  updateServiceCatalogItem,
} from '../services/supabase.service';

const router = Router();

/**
 * GET /api/services
 * Returns service categories from Supabase.
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getServicesCatalog();
    res.json({ success: true, count: data.length, data });
  })
);

/**
 * GET /api/services/:id
 * Returns one service item by id from Supabase.
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await getServiceById(id);
    if (!data) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, data });
  })
);

/**
 * POST /api/services
 * Creates one service item in services_catalog.
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;

    if (!payload?.id || !payload?.title || !payload?.category_id || !payload?.category_heading) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: id, title, category_id, category_heading',
      });
      return;
    }

    const data = await createServiceCatalogItem(payload);
    res.status(201).json({ success: true, data });
  })
);

/**
 * PUT /api/services/:id
 * Updates one service item by id.
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await updateServiceCatalogItem(id, req.body ?? {});

    if (!data) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    res.json({ success: true, data });
  })
);

/**
 * DELETE /api/services/:id
 * Deletes one service item by id.
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const deleted = await deleteServiceCatalogItem(id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    res.json({ success: true, deleted: true, id });
  })
);

/**
 * POST /api/services/sync
 * Upserts seed service catalog data into Supabase.
 */
router.post(
  '/sync',
  asyncHandler(async (_req: Request, res: Response) => {
    const upserted = await syncServicesCatalog();
    res.status(201).json({ success: true, upserted });
  })
);

export default router;
