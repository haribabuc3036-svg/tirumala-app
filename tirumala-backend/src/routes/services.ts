import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/error';
import {
  deleteFromCloudinary,
  uploadServiceCategoryImageToCloudinary,
  uploadServiceDetailImageToCloudinary,
  uploadServiceIconToCloudinary,
} from '../services/cloudinary.service';
import {
  createServiceImage,
  deleteServiceImageById,
  createServiceCatalogItem,
  deleteServiceCatalogItem,
  getNextServiceImageSortOrder,
  getServiceDetailById,
  getServiceImageById,
  getServiceById,
  getServicesByCategoryId,
  getServicesCatalog,
  syncServicesCatalog,
  updateCategoryImageForServices,
  updateServiceCatalogItem,
} from '../services/supabase.service';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

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
 * POST /api/services/category/:categoryId/image
 * Upload category image to Cloudinary and apply to all services in that category.
 */
router.post(
  '/category/:categoryId/image',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const categoryId = Array.isArray(req.params.categoryId) ? req.params.categoryId[0] : req.params.categoryId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'Missing image file. Send multipart/form-data with key "image".' });
      return;
    }

    const rows = await getServicesByCategoryId(categoryId);
    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    const oldPublicId = rows[0].category_image_public_id;
    const uploaded = await uploadServiceCategoryImageToCloudinary(file.buffer, `${categoryId}-${Date.now()}`);

    if (oldPublicId) {
      await deleteFromCloudinary(oldPublicId);
    }

    const updatedCount = await updateCategoryImageForServices(categoryId, uploaded.secure_url, uploaded.public_id);

    res.status(201).json({
      success: true,
      categoryId,
      updatedCount,
      image: uploaded.secure_url,
      publicId: uploaded.public_id,
    });
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
    const data = await getServiceDetailById(id);
    if (!data) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }
    res.json({ success: true, data });
  })
);

/**
 * POST /api/services/:id/icon-image
 * Upload one service icon image to Cloudinary and persist URL/public_id.
 */
router.post(
  '/:id/icon-image',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'Missing image file. Send multipart/form-data with key "image".' });
      return;
    }

    const existing = await getServiceById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    const uploaded = await uploadServiceIconToCloudinary(file.buffer, `${id}-icon-${Date.now()}`);

    if (existing.image_public_id) {
      await deleteFromCloudinary(existing.image_public_id);
    }

    const data = await updateServiceCatalogItem(id, {
      image: uploaded.secure_url,
      image_public_id: uploaded.public_id,
    });

    if (!data) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    res.status(201).json({ success: true, data });
  })
);

router.post(
  '/:id/image',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'Missing image file. Send multipart/form-data with key "image".' });
      return;
    }

    const existing = await getServiceById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    const uploaded = await uploadServiceIconToCloudinary(file.buffer, `${id}-icon-${Date.now()}`);

    if (existing.image_public_id) {
      await deleteFromCloudinary(existing.image_public_id);
    }

    const data = await updateServiceCatalogItem(id, {
      image: uploaded.secure_url,
      image_public_id: uploaded.public_id,
    });

    if (!data) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    res.status(201).json({ success: true, data });
  })
);

/**
 * POST /api/services/:id/images
 * Upload one detail gallery image for a service.
 */
router.post(
  '/:id/images',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'Missing image file. Send multipart/form-data with key "image".' });
      return;
    }

    const service = await getServiceById(id);
    if (!service) {
      res.status(404).json({ success: false, error: 'Service not found' });
      return;
    }

    const uploaded = await uploadServiceDetailImageToCloudinary(file.buffer, `${id}-detail-${Date.now()}`);
    try {
      const sortOrder = await getNextServiceImageSortOrder(id);

      const data = await createServiceImage({
        service_id: id,
        image_url: uploaded.secure_url,
        public_id: uploaded.public_id,
        sort_order: sortOrder,
      });

      res.status(201).json({ success: true, data });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const tableMissing = message.includes('service_images');

      if (!tableMissing) {
        throw error;
      }

      const data = await updateServiceCatalogItem(id, {
        image: uploaded.secure_url,
        image_public_id: uploaded.public_id,
      });

      res.status(201).json({
        success: true,
        fallback: true,
        message: 'service_images table missing, saved to services_catalog.image as fallback',
        data,
      });
    }
  })
);

/**
 * DELETE /api/services/images/:imageId
 * Deletes one service detail image from Cloudinary and Supabase.
 */
router.delete(
  '/images/:imageId',
  asyncHandler(async (req: Request, res: Response) => {
    const imageIdRaw = Array.isArray(req.params.imageId) ? req.params.imageId[0] : req.params.imageId;
    const imageId = Number(imageIdRaw);

    if (!Number.isFinite(imageId)) {
      res.status(400).json({ success: false, error: 'Invalid image id' });
      return;
    }

    const existing = await getServiceImageById(imageId);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Service image not found' });
      return;
    }

    if (existing.public_id) {
      await deleteFromCloudinary(existing.public_id);
    }

    await deleteServiceImageById(imageId);
    res.json({ success: true, deleted: true, id: imageId });
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
