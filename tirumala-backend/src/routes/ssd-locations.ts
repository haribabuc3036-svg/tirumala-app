import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/error';
import { uploadSsdLocationImageToCloudinary, deleteFromCloudinary } from '../services/cloudinary.service';
import {
  getAllSsdLocations,
  getSsdLocationById,
  insertSsdLocation,
  updateSsdLocation,
  deleteSsdLocation,
} from '../services/supabase.service';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

// ─── GET /api/ssd-locations ───────────────────────────────────────────────────
/**
 * List all SSD counter locations, ordered by sort_order.
 * Includes inactive rows (admin view). Frontend reads active-only via Supabase RLS.
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getAllSsdLocations();
    res.json({ success: true, count: data.length, data });
  })
);

// ─── POST /api/ssd-locations ──────────────────────────────────────────────────
/**
 * Create a new SSD counter location.
 * Body: { name, area, timings, note?, image_url?, maps_url, tag?, sort_order?, is_active? }
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, area, timings, note, image_url, maps_url, tag, sort_order, is_active } =
      req.body as {
        name?: string;
        area?: string;
        timings?: string;
        note?: string;
        image_url?: string;
        maps_url?: string;
        tag?: string;
        sort_order?: number;
        is_active?: boolean;
      };

    if (!name?.trim() || !area?.trim() || !timings?.trim() || !maps_url?.trim()) {
      res
        .status(400)
        .json({ success: false, error: '`name`, `area`, `timings` and `maps_url` are required.' });
      return;
    }

    const row = await insertSsdLocation({ name, area, timings, note, image_url, maps_url, tag, sort_order, is_active });
    res.status(201).json({ success: true, data: row });
  })
);

// ─── PUT /api/ssd-locations/:id ───────────────────────────────────────────────
/**
 * Update any field of an existing SSD counter location.
 * Body: any subset of the location fields.
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }
    const row = await updateSsdLocation(id, req.body);
    res.json({ success: true, data: row });
  })
);

// ─── DELETE /api/ssd-locations/:id ───────────────────────────────────────────
/**
 * Permanently delete an SSD counter location by its numeric id.
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }
    await deleteSsdLocation(id);
    res.json({ success: true, message: `Location ${id} deleted.` });
  })
);

// ─── POST /api/ssd-locations/:id/image ───────────────────────────────────────
/**
 * Upload an image for a location to Cloudinary and persist the URL + public_id in Supabase.
 * Send multipart/form-data with key "image".
 */
router.post(
  '/:id/image',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'Missing image file. Send multipart/form-data with key "image".' });
      return;
    }

    const existing = await getSsdLocationById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'SSD location not found.' });
      return;
    }

    // Delete old Cloudinary image if one exists
    if (existing.image_public_id) {
      await deleteFromCloudinary(existing.image_public_id);
    }

    const uploaded = await uploadSsdLocationImageToCloudinary(file.buffer, `ssd-${id}-${Date.now()}`);

    const updated = await updateSsdLocation(id, {
      image_url: uploaded.secure_url,
      image_public_id: uploaded.public_id,
    });

    res.status(201).json({ success: true, data: updated });
  })
);

// ─── DELETE /api/ssd-locations/:id/image ─────────────────────────────────────
/**
 * Remove the image for a location — deletes from Cloudinary and nulls image_url / image_public_id in Supabase.
 */
router.delete(
  '/:id/image',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: 'Invalid `id`.' });
      return;
    }

    const existing = await getSsdLocationById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'SSD location not found.' });
      return;
    }

    if (existing.image_public_id) {
      await deleteFromCloudinary(existing.image_public_id);
    }

    const updated = await updateSsdLocation(id, { image_url: null, image_public_id: null });
    res.json({ success: true, data: updated });
  })
);

export default router;
