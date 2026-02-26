import { randomUUID } from 'crypto';
import { Router, type Request, type Response } from 'express';
import multer from 'multer';

import { asyncHandler } from '../middleware/error';
import { deleteFromCloudinary, uploadWallpaperToCloudinary } from '../services/cloudinary.service';
import {
  createWallpaper,
  deleteWallpaper,
  getWallpaperById,
  getWallpapers,
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

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Number(req.query.limit ?? 100);
    const data = await getWallpapers(Number.isFinite(limit) ? limit : 100);
    res.json({ success: true, count: data.length, data });
  })
);

router.post(
  '/',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const title = String(req.body?.title ?? '').trim();

    if (!file) {
      res.status(400).json({ success: false, error: 'Missing image file. Send multipart/form-data with key "image".' });
      return;
    }

    if (!title) {
      res.status(400).json({ success: false, error: 'Missing required field: title' });
      return;
    }

    const uploaded = await uploadWallpaperToCloudinary(file.buffer, file.originalname);

    const row = await createWallpaper({
      id: randomUUID(),
      title,
      image_url: uploaded.secure_url,
      public_id: uploaded.public_id,
      width: uploaded.width ?? null,
      height: uploaded.height ?? null,
      format: uploaded.format ?? null,
      bytes: uploaded.bytes ?? null,
    });

    res.status(201).json({ success: true, data: row });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const existing = await getWallpaperById(id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Wallpaper not found' });
      return;
    }

    await deleteFromCloudinary(existing.public_id);
    await deleteWallpaper(id);

    res.json({ success: true, deleted: true, id });
  })
);

export default router;
