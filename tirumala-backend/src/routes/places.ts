import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { asyncHandler } from '../middleware/error';
import { deleteFromCloudinary, uploadPlacePhotoToCloudinary } from '../services/cloudinary.service';
import {
  createPlace,
  createPlacePhoto,
  createPlaceRegion,
  deletePlace,
  deletePlacePhoto,
  deletePlaceRegion,
  getNextPlacePhotoSortOrder,
  getPlaceById,
  getPlacePhotoById,
  getPlacePhotosByPlaceId,
  getPlaceRegionById,
  getPlaceRegions,
  getPlacesByRegionId,
  placeExists,
  syncPlacesCatalog,
  updatePlace,
  updatePlaceRegion,
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
 * GET /api/places/regions
 * Returns all place regions.
 */
router.get(
  '/regions',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await getPlaceRegions();
    res.json({ success: true, count: data.length, data });
  })
);

/**
 * POST /api/places/regions
 * Creates one place region.
 */
router.post(
  '/regions',
  asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.body?.id ?? '').trim();
    const title = String(req.body?.title ?? '').trim();
    const subtitle = req.body?.subtitle == null ? null : String(req.body.subtitle);
    const sortOrder = Number(req.body?.sort_order ?? 0);

    if (!id || !title) {
      res.status(400).json({ success: false, error: 'Missing required fields: id, title' });
      return;
    }

    const data = await createPlaceRegion({
      id,
      title,
      subtitle,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    });

    res.status(201).json({ success: true, data });
  })
);

/**
 * PUT /api/places/regions/:regionId
 * Updates one place region by id.
 */
router.put(
  '/regions/:regionId',
  asyncHandler(async (req: Request, res: Response) => {
    const regionId = Array.isArray(req.params.regionId) ? req.params.regionId[0] : req.params.regionId;
    const data = await updatePlaceRegion(regionId, req.body ?? {});

    if (!data) {
      res.status(404).json({ success: false, error: 'Region not found' });
      return;
    }

    res.json({ success: true, data });
  })
);

/**
 * DELETE /api/places/regions/:regionId
 * Deletes one place region (cascade deletes child places/photos).
 */
router.delete(
  '/regions/:regionId',
  asyncHandler(async (req: Request, res: Response) => {
    const regionId = Array.isArray(req.params.regionId) ? req.params.regionId[0] : req.params.regionId;
    const existing = await getPlaceRegionById(regionId);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Region not found' });
      return;
    }

    const deleted = await deletePlaceRegion(regionId);
    res.json({ success: true, deleted, id: regionId });
  })
);

/**
 * GET /api/places/region/:regionId
 * Returns places for one region id.
 */
router.get(
  '/region/:regionId',
  asyncHandler(async (req: Request, res: Response) => {
    const regionId = Array.isArray(req.params.regionId) ? req.params.regionId[0] : req.params.regionId;
    const data = await getPlacesByRegionId(regionId);
    res.json({ success: true, count: data.length, data });
  })
);

/**
 * POST /api/places
 * Creates one place.
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const id = String(req.body?.id ?? '').trim();
    const regionId = String(req.body?.region_id ?? '').trim();
    const name = String(req.body?.name ?? '').trim();
    const description = String(req.body?.description ?? '').trim();
    const mapsUrl = String(req.body?.maps_url ?? '').trim();
    const distance = Number(req.body?.distance_from_tirumala_km ?? 0);
    const sortOrder = Number(req.body?.sort_order ?? 0);

    if (!id || !regionId || !name || !description || !mapsUrl) {
      res.status(400).json({
        success: false,
        error:
          'Missing required fields: id, region_id, name, description, maps_url',
      });
      return;
    }

    const regionExists = await getPlaceRegionById(regionId);
    if (!regionExists) {
      res.status(400).json({ success: false, error: 'Invalid region_id. Region not found.' });
      return;
    }

    const data = await createPlace({
      id,
      region_id: regionId,
      name,
      description,
      maps_url: mapsUrl,
      distance_from_tirumala_km: Number.isFinite(distance) ? distance : 0,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    });

    res.status(201).json({ success: true, data });
  })
);

/**
 * POST /api/places/sync
 * Upserts seed place catalog to Supabase.
 */
router.post(
  '/sync',
  asyncHandler(async (_req: Request, res: Response) => {
    const data = await syncPlacesCatalog();
    res.status(201).json({ success: true, ...data });
  })
);

/**
 * PUT /api/places/:placeId
 * Updates one place by id.
 */
router.put(
  '/:placeId',
  asyncHandler(async (req: Request, res: Response) => {
    const placeId = Array.isArray(req.params.placeId) ? req.params.placeId[0] : req.params.placeId;

    const incomingRegionId = req.body?.region_id;
    if (incomingRegionId) {
      const regionExists = await getPlaceRegionById(String(incomingRegionId));
      if (!regionExists) {
        res.status(400).json({ success: false, error: 'Invalid region_id. Region not found.' });
        return;
      }
    }

    const data = await updatePlace(placeId, req.body ?? {});
    if (!data) {
      res.status(404).json({ success: false, error: 'Place not found' });
      return;
    }

    res.json({ success: true, data });
  })
);

/**
 * DELETE /api/places/:placeId
 * Deletes one place and its place photos (Cloudinary + Supabase).
 */
router.delete(
  '/:placeId',
  asyncHandler(async (req: Request, res: Response) => {
    const placeId = Array.isArray(req.params.placeId) ? req.params.placeId[0] : req.params.placeId;
    const existingPlace = await getPlaceById(placeId);

    if (!existingPlace) {
      res.status(404).json({ success: false, error: 'Place not found' });
      return;
    }

    const photos = await getPlacePhotosByPlaceId(placeId);
    for (const photo of photos) {
      if (photo.public_id) {
        await deleteFromCloudinary(photo.public_id);
      }
    }

    await deletePlace(placeId);
    res.json({ success: true, deleted: true, id: placeId });
  })
);

/**
 * POST /api/places/:placeId/photos
 * Upload one place photo to Cloudinary and persist URL/public_id in Supabase.
 */
router.post(
  '/:placeId/photos',
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response) => {
    const placeId = Array.isArray(req.params.placeId) ? req.params.placeId[0] : req.params.placeId;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'Missing image file. Send multipart/form-data with key "image".' });
      return;
    }

    const exists = await placeExists(placeId);
    if (!exists) {
      res.status(404).json({ success: false, error: 'Place not found' });
      return;
    }

    const uploaded = await uploadPlacePhotoToCloudinary(file.buffer, `${placeId}-${Date.now()}`);
    const nextSortOrder = await getNextPlacePhotoSortOrder(placeId);

    const data = await createPlacePhoto({
      place_id: placeId,
      image_url: uploaded.secure_url,
      public_id: uploaded.public_id,
      sort_order: nextSortOrder,
    });

    res.status(201).json({ success: true, data });
  })
);

/**
 * DELETE /api/places/photos/:photoId
 * Deletes one place photo from Cloudinary and Supabase.
 */
router.delete(
  '/photos/:photoId',
  asyncHandler(async (req: Request, res: Response) => {
    const photoIdRaw = Array.isArray(req.params.photoId) ? req.params.photoId[0] : req.params.photoId;
    const photoId = Number(photoIdRaw);

    if (!Number.isFinite(photoId)) {
      res.status(400).json({ success: false, error: 'Invalid photo id' });
      return;
    }

    const existing = await getPlacePhotoById(photoId);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Place photo not found' });
      return;
    }

    if (existing.public_id) {
      await deleteFromCloudinary(existing.public_id);
    }

    await deletePlacePhoto(photoId);
    res.json({ success: true, deleted: true, id: photoId });
  })
);

/**
 * GET /api/places/:placeId/photos
 * Returns all photos for one place.
 */
router.get(
  '/:placeId/photos',
  asyncHandler(async (req: Request, res: Response) => {
    const placeId = Array.isArray(req.params.placeId) ? req.params.placeId[0] : req.params.placeId;
    const exists = await placeExists(placeId);
    if (!exists) {
      res.status(404).json({ success: false, error: 'Place not found' });
      return;
    }
    const data = await getPlacePhotosByPlaceId(placeId);
    res.json({ success: true, count: data.length, data });
  })
);

/**
 * GET /api/places/:placeId
 * Returns one place detail by id.
 */
router.get(
  '/:placeId',
  asyncHandler(async (req: Request, res: Response) => {
    const placeId = Array.isArray(req.params.placeId) ? req.params.placeId[0] : req.params.placeId;
    const data = await getPlaceById(placeId);

    if (!data) {
      res.status(404).json({ success: false, error: 'Place not found' });
      return;
    }

    res.json({ success: true, data });
  })
);

export default router;
