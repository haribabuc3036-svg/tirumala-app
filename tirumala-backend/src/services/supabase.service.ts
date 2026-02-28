import { supabaseAdmin } from '../config/supabase';
import type { Database } from '../types/supabase';
import {
  SERVICE_CATEGORIES_SEED,
  type ServiceCategorySeed,
} from '../config/services.seed';
import {
  PLACE_REGIONS_SEED,
  PLACES_SEED,
  type PlaceRegionSeed,
  type PlaceSeed,
} from '../config/places.seed';

type DarshanRow = Database['public']['Tables']['darshan_updates']['Row'];
type DarshanInsert = Database['public']['Tables']['darshan_updates']['Insert'];
type SsdRow = Database['public']['Tables']['ssd_status']['Row'];
type SsdInsert = Database['public']['Tables']['ssd_status']['Insert'];
type ServiceCatalogRow = Database['public']['Tables']['services_catalog']['Row'];
type ServiceCatalogInsert = Database['public']['Tables']['services_catalog']['Insert'];
type ServiceCatalogUpdate = Database['public']['Tables']['services_catalog']['Update'];
type ServiceImageRow = Database['public']['Tables']['service_images']['Row'];
type ServiceImageInsert = Database['public']['Tables']['service_images']['Insert'];
type WallpaperRow = Database['public']['Tables']['wallpapers']['Row'];
type WallpaperInsert = Database['public']['Tables']['wallpapers']['Insert'];
type PlaceRegionRow = Database['public']['Tables']['place_regions']['Row'];
type PlaceRegionInsert = Database['public']['Tables']['place_regions']['Insert'];
type PlaceRegionUpdate = Database['public']['Tables']['place_regions']['Update'];
type PlaceRow = Database['public']['Tables']['places']['Row'];
type PlaceInsert = Database['public']['Tables']['places']['Insert'];
type PlaceUpdate = Database['public']['Tables']['places']['Update'];
type PlacePhotoRow = Database['public']['Tables']['place_photos']['Row'];
type PlacePhotoInsert = Database['public']['Tables']['place_photos']['Insert'];

// ─── Darshan Updates ───────────────────────────────────────────────────────────

/** Get all historical darshan updates, newest first */
export async function getAllDarshanUpdates(): Promise<DarshanRow[]> {
  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Get darshan updates paginated */
export async function getDarshanUpdates(page = 1, limit = 10): Promise<DarshanRow[]> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .select('*')
    .order('date', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Insert a new darshan update record */
export async function insertDarshanUpdate(payload: DarshanInsert): Promise<DarshanRow> {
  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Upsert by date (idempotent — safe to call multiple times for the same day) */
export async function upsertDarshanUpdate(payload: DarshanInsert): Promise<DarshanRow> {
  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .upsert(payload, { onConflict: 'date' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── SSD Status ───────────────────────────────────────────────────────────────

/** Get the most recent SSD status row */
export async function getLatestSsdStatus(): Promise<SsdRow | null> {
  const { data, error } = await supabaseAdmin
    .from('ssd_status')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/** Upsert the current SSD status */
export async function upsertSsdStatus(payload: SsdInsert): Promise<SsdRow> {
  const { data, error } = await supabaseAdmin
    .from('ssd_status')
    .upsert(payload, { onConflict: 'date' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── Services Catalog ─────────────────────────────────────────────────────────

export type ServiceCategoryResponse = {
  id: string;
  heading: string;
  icon: string;
  image?: string;
  services: {
    id: string;
    title: string;
    description: string;
    icon: string;
    iconImage?: string;
    url: string;
    tag?: string;
    tagColor?: string;
  }[];
};

export type ServiceDetailResponse = {
  id: string;
  categoryId: string;
  categoryHeading: string;
  title: string;
  description: string;
  icon: string;
  iconImage?: string;
  images: string[];
  url: string;
  tag?: string;
  tagColor?: string;
  bookingDate?: string | null;
  instructions?: string[] | null;
};

export type ServiceImageAdminResponse = {
  id: number;
  serviceId: string;
  imageUrl: string;
  publicId: string | null;
  sortOrder: number;
};

function mapRowsToCategories(rows: ServiceCatalogRow[]): ServiceCategoryResponse[] {
  const map = new Map<string, ServiceCategoryResponse & { _order: number }>();

  for (const row of rows) {
    if (!map.has(row.category_id)) {
      map.set(row.category_id, {
        id: row.category_id,
        heading: row.category_heading,
        icon: row.category_icon,
        ...(row.category_image ? { image: row.category_image } : {}),
        services: [],
        _order: row.category_order,
      });
    }

    const bucket = map.get(row.category_id)!;
    bucket.services.push({
      id: row.id,
      title: row.title,
      description: row.description,
      icon: row.icon,
      ...(row.image ? { iconImage: row.image } : {}),
      url: row.url,
      ...(row.tag ? { tag: row.tag } : {}),
      ...(row.tag_color ? { tagColor: row.tag_color } : {}),
    });
  }

  return [...map.values()]
    .sort((a, b) => a._order - b._order)
    .map(({ _order, ...category }) => category);
}

export async function getServicesCatalog(): Promise<ServiceCategoryResponse[]> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .select('*')
    .order('category_order', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return mapRowsToCategories(data ?? []);
}

export type OverviewServiceItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconImage?: string;
  url: string;
  tag?: string;
  tagColor?: string;
  categoryId: string;
  categoryHeading: string;
  overviewOrder: number;
};

export async function getOverviewServices(): Promise<OverviewServiceItem[]> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .select('*')
    .eq('show_on_overview', true)
    .order('overview_order', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    ...(row.image ? { iconImage: row.image } : {}),
    url: row.url,
    ...(row.tag ? { tag: row.tag } : {}),
    ...(row.tag_color ? { tagColor: row.tag_color } : {}),
    categoryId: row.category_id,
    categoryHeading: row.category_heading,
    overviewOrder: row.overview_order,
  }));
}

export async function getServiceById(serviceId: string): Promise<ServiceCatalogRow | null> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .select('*')
    .eq('id', serviceId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getServiceDetailById(serviceId: string): Promise<ServiceDetailResponse | null> {
  const service = await getServiceById(serviceId);
  if (!service) return null;

  const images = await getServiceImagesByServiceId(serviceId);

  return {
    id: service.id,
    categoryId: service.category_id,
    categoryHeading: service.category_heading,
    title: service.title,
    description: service.description,
    icon: service.icon,
    ...(service.image ? { iconImage: service.image } : {}),
    images: images.map((image) => image.image_url),
    url: service.url,
    ...(service.tag ? { tag: service.tag } : {}),
    ...(service.tag_color ? { tagColor: service.tag_color } : {}),
    bookingDate: service.booking_date ?? null,
    instructions: service.instructions ?? null,
  };
}

export async function createServiceCatalogItem(
  payload: ServiceCatalogInsert
): Promise<ServiceCatalogRow> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateServiceCatalogItem(
  serviceId: string,
  payload: ServiceCatalogUpdate
): Promise<ServiceCatalogRow | null> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', serviceId)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteServiceCatalogItem(serviceId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .delete()
    .eq('id', serviceId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

export async function getServiceImagesByServiceId(serviceId: string): Promise<ServiceImageRow[]> {
  const { data, error } = await supabaseAdmin
    .from('service_images')
    .select('*')
    .eq('service_id', serviceId)
    .order('sort_order', { ascending: true });

  if (error) {
    if (
      error.message.includes('service_images') ||
      (typeof error.code === 'string' && (error.code === 'PGRST205' || error.code === '42P01'))
    ) {
      return [];
    }
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createServiceImage(payload: ServiceImageInsert): Promise<ServiceImageAdminResponse> {
  const { data, error } = await supabaseAdmin
    .from('service_images')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    serviceId: data.service_id,
    imageUrl: data.image_url,
    publicId: data.public_id,
    sortOrder: data.sort_order,
  };
}

export async function getServiceImageById(imageId: number): Promise<ServiceImageRow | null> {
  const { data, error } = await supabaseAdmin
    .from('service_images')
    .select('*')
    .eq('id', imageId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getNextServiceImageSortOrder(serviceId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('service_images')
    .select('sort_order')
    .eq('service_id', serviceId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.sort_order ?? -1) + 1;
}

export async function deleteServiceImageById(imageId: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('service_images')
    .delete()
    .eq('id', imageId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

export async function getServicesByCategoryId(categoryId: string): Promise<ServiceCatalogRow[]> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .select('*')
    .eq('category_id', categoryId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateCategoryImageForServices(
  categoryId: string,
  imageUrl: string,
  publicId: string
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('services_catalog')
    .update({
      category_image: imageUrl,
      category_image_public_id: publicId,
      updated_at: new Date().toISOString(),
    })
    .eq('category_id', categoryId)
    .select('id');

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

// ─── Wallpapers ───────────────────────────────────────────────────────────────

export async function getWallpapers(limit = 100): Promise<WallpaperRow[]> {
  const { data, error } = await supabaseAdmin
    .from('wallpapers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createWallpaper(payload: WallpaperInsert): Promise<WallpaperRow> {
  const { data, error } = await supabaseAdmin
    .from('wallpapers')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getWallpaperById(id: string): Promise<WallpaperRow | null> {
  const { data, error } = await supabaseAdmin
    .from('wallpapers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteWallpaper(id: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('wallpapers')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

// ─── Places ───────────────────────────────────────────────────────────────────

export type PlaceRegionResponse = {
  id: string;
  title: string;
  subtitle?: string;
};

export type PlaceSummaryResponse = {
  id: string;
  name: string;
  distanceFromTirumalaKm: number;
  description: string;
  mapsUrl: string;
  photos: string[];
};

export type PlaceDetailResponse = PlaceSummaryResponse & {
  regionId: string;
};

export type PlacePhotoAdminResponse = {
  id: number;
  placeId: string;
  imageUrl: string;
  publicId: string | null;
  sortOrder: number;
};

function mapRegionRow(row: PlaceRegionRow): PlaceRegionResponse {
  return {
    id: row.id,
    title: row.title,
    ...(row.subtitle ? { subtitle: row.subtitle } : {}),
  };
}

function mapPlaceRow(row: PlaceRow, photos: PlacePhotoRow[]): PlaceSummaryResponse {
  return {
    id: row.id,
    name: row.name,
    distanceFromTirumalaKm: Number(row.distance_from_tirumala_km),
    description: row.description,
    mapsUrl: row.maps_url,
    photos: photos
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((photo) => photo.image_url),
  };
}

export async function getPlaceRegions(): Promise<PlaceRegionResponse[]> {
  const { data, error } = await supabaseAdmin
    .from('place_regions')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRegionRow);
}

export async function getPlaceRegionById(regionId: string): Promise<PlaceRegionRow | null> {
  const { data, error } = await supabaseAdmin
    .from('place_regions')
    .select('*')
    .eq('id', regionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createPlaceRegion(payload: PlaceRegionInsert): Promise<PlaceRegionRow> {
  const { data, error } = await supabaseAdmin
    .from('place_regions')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePlaceRegion(
  regionId: string,
  payload: PlaceRegionUpdate
): Promise<PlaceRegionRow | null> {
  const { data, error } = await supabaseAdmin
    .from('place_regions')
    .update(payload)
    .eq('id', regionId)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function deletePlaceRegion(regionId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('place_regions')
    .delete()
    .eq('id', regionId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

export async function getPlacesByRegionId(regionId: string): Promise<PlaceSummaryResponse[]> {
  const { data: places, error: placesError } = await supabaseAdmin
    .from('places')
    .select('*')
    .eq('region_id', regionId)
    .order('sort_order', { ascending: true });

  if (placesError) throw new Error(placesError.message);

  if (!places || places.length === 0) {
    return [];
  }

  const placeIds = places.map((place) => place.id);
  const { data: photos, error: photosError } = await supabaseAdmin
    .from('place_photos')
    .select('*')
    .in('place_id', placeIds)
    .order('sort_order', { ascending: true });

  if (photosError) throw new Error(photosError.message);

  const photosByPlace = new Map<string, PlacePhotoRow[]>();
  (photos ?? []).forEach((photo) => {
    const bucket = photosByPlace.get(photo.place_id) ?? [];
    bucket.push(photo);
    photosByPlace.set(photo.place_id, bucket);
  });

  return places.map((place) => mapPlaceRow(place, photosByPlace.get(place.id) ?? []));
}

export async function getPlaceById(placeId: string): Promise<PlaceDetailResponse | null> {
  const { data: place, error: placeError } = await supabaseAdmin
    .from('places')
    .select('*')
    .eq('id', placeId)
    .maybeSingle();

  if (placeError) throw new Error(placeError.message);
  if (!place) return null;

  const { data: photos, error: photosError } = await supabaseAdmin
    .from('place_photos')
    .select('*')
    .eq('place_id', place.id)
    .order('sort_order', { ascending: true });

  if (photosError) throw new Error(photosError.message);

  return {
    ...mapPlaceRow(place, photos ?? []),
    regionId: place.region_id,
  };
}

export async function createPlace(payload: PlaceInsert): Promise<PlaceRow> {
  const { data, error } = await supabaseAdmin
    .from('places')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePlace(placeId: string, payload: PlaceUpdate): Promise<PlaceRow | null> {
  const { data, error } = await supabaseAdmin
    .from('places')
    .update(payload)
    .eq('id', placeId)
    .select('*')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function deletePlace(placeId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('places')
    .delete()
    .eq('id', placeId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

export async function placeExists(placeId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('places')
    .select('id')
    .eq('id', placeId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

export async function getPlacePhotosByPlaceId(placeId: string): Promise<PlacePhotoRow[]> {
  const { data, error } = await supabaseAdmin
    .from('place_photos')
    .select('*')
    .eq('place_id', placeId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createPlacePhoto(payload: PlacePhotoInsert): Promise<PlacePhotoAdminResponse> {
  const { data, error } = await supabaseAdmin
    .from('place_photos')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return {
    id: data.id,
    placeId: data.place_id,
    imageUrl: data.image_url,
    publicId: data.public_id,
    sortOrder: data.sort_order,
  };
}

export async function getPlacePhotoById(photoId: number): Promise<PlacePhotoRow | null> {
  const { data, error } = await supabaseAdmin
    .from('place_photos')
    .select('*')
    .eq('id', photoId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function getNextPlacePhotoSortOrder(placeId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('place_photos')
    .select('sort_order')
    .eq('place_id', placeId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.sort_order ?? -1) + 1;
}

export async function deletePlacePhoto(photoId: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('place_photos')
    .delete()
    .eq('id', photoId)
    .select('id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data?.id);
}

export async function syncPlacesCatalog(
  regionsSeed: PlaceRegionSeed[] = PLACE_REGIONS_SEED,
  placesSeed: PlaceSeed[] = PLACES_SEED
): Promise<{ regionsUpserted: number; placesUpserted: number; photosInserted: number }> {
  const regionPayload: PlaceRegionInsert[] = regionsSeed.map((region) => ({
    id: region.id,
    title: region.title,
    subtitle: region.subtitle ?? null,
    sort_order: region.sortOrder,
  }));

  const placePayload: PlaceInsert[] = placesSeed.map((place) => ({
    id: place.id,
    region_id: place.regionId,
    name: place.name,
    distance_from_tirumala_km: place.distanceFromTirumalaKm,
    description: place.description,
    maps_url: place.mapsUrl,
    sort_order: place.sortOrder,
  }));

  const photosPayload: PlacePhotoInsert[] = placesSeed.flatMap((place) =>
    place.photos.map((imageUrl, index) => ({
      place_id: place.id,
      image_url: imageUrl,
      public_id: null,
      sort_order: index,
    }))
  );

  const { error: regionsError } = await supabaseAdmin
    .from('place_regions')
    .upsert(regionPayload, { onConflict: 'id' });
  if (regionsError) throw new Error(regionsError.message);

  const { error: placesError } = await supabaseAdmin
    .from('places')
    .upsert(placePayload, { onConflict: 'id' });
  if (placesError) throw new Error(placesError.message);

  const placeIds = placesSeed.map((place) => place.id);
  const { error: deletePhotosError } = await supabaseAdmin
    .from('place_photos')
    .delete()
    .in('place_id', placeIds);
  if (deletePhotosError) throw new Error(deletePhotosError.message);

  if (photosPayload.length > 0) {
    const { error: photosError } = await supabaseAdmin
      .from('place_photos')
      .insert(photosPayload);
    if (photosError) throw new Error(photosError.message);
  }

  return {
    regionsUpserted: regionPayload.length,
    placesUpserted: placePayload.length,
    photosInserted: photosPayload.length,
  };
}

export async function syncServicesCatalog(
  seedData: ServiceCategorySeed[] = SERVICE_CATEGORIES_SEED
): Promise<number> {
  const payload: ServiceCatalogInsert[] = [];

  seedData.forEach((category, categoryIndex) => {
    category.services.forEach((service, serviceIndex) => {
      payload.push({
        id: service.id,
        category_id: category.id,
        category_heading: category.heading,
        category_icon: category.icon,
        category_image: category.image ?? null,
        category_image_public_id: null,
        category_order: categoryIndex,
        title: service.title,
        description: service.description,
        icon: service.icon,
        image: service.iconImage ?? null,
        image_public_id: null,
        url: service.url,
        tag: service.tag ?? null,
        tag_color: service.tagColor ?? null,
        sort_order: serviceIndex,
        show_on_overview: service.showOnOverview ?? false,
        overview_order: service.overviewOrder ?? 0,
      });
    });
  });

  const { error } = await supabaseAdmin
    .from('services_catalog')
    .upsert(payload, { onConflict: 'id' });

  if (error) throw new Error(error.message);
  return payload.length;
}

// ─── Help Content ──────────────────────────────────────────────────────────────

type HelpFaqRow    = Database['public']['Tables']['help_faqs']['Row'];
type HelpFaqInsert = Database['public']['Tables']['help_faqs']['Insert'];
type HelpFaqUpdate = Database['public']['Tables']['help_faqs']['Update'];

type HelpDressCodeRow    = Database['public']['Tables']['help_dress_code']['Row'];
type HelpDressCodeInsert = Database['public']['Tables']['help_dress_code']['Insert'];
type HelpDressCodeUpdate = Database['public']['Tables']['help_dress_code']['Update'];

type HelpDosDontsRow    = Database['public']['Tables']['help_dos_donts']['Row'];
type HelpDosDontsInsert = Database['public']['Tables']['help_dos_donts']['Insert'];
type HelpDosDontsUpdate = Database['public']['Tables']['help_dos_donts']['Update'];

type HelpContactRow    = Database['public']['Tables']['help_contact_support']['Row'];
type HelpContactInsert = Database['public']['Tables']['help_contact_support']['Insert'];
type HelpContactUpdate = Database['public']['Tables']['help_contact_support']['Update'];

// ── FAQs ──────────────────────────────────────────────────────────────────────

export async function getAllFaqs(): Promise<HelpFaqRow[]> {
  const { data, error } = await supabaseAdmin
    .from('help_faqs')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function insertFaq(payload: HelpFaqInsert): Promise<HelpFaqRow> {
  const { data, error } = await supabaseAdmin
    .from('help_faqs')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateFaq(id: number, payload: HelpFaqUpdate): Promise<HelpFaqRow> {
  const { data, error } = await supabaseAdmin
    .from('help_faqs')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteFaq(id: number): Promise<boolean> {
  const { error } = await supabaseAdmin.from('help_faqs').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ── Dress Code ────────────────────────────────────────────────────────────────

export async function getAllDressCodeItems(): Promise<HelpDressCodeRow[]> {
  const { data, error } = await supabaseAdmin
    .from('help_dress_code')
    .select('*')
    .order('section', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function insertDressCodeItem(payload: HelpDressCodeInsert): Promise<HelpDressCodeRow> {
  const { data, error } = await supabaseAdmin
    .from('help_dress_code')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDressCodeItem(id: number, payload: HelpDressCodeUpdate): Promise<HelpDressCodeRow> {
  const { data, error } = await supabaseAdmin
    .from('help_dress_code')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDressCodeItem(id: number): Promise<boolean> {
  const { error } = await supabaseAdmin.from('help_dress_code').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ── Do's & Don'ts ─────────────────────────────────────────────────────────────

export async function getAllDosDonts(): Promise<HelpDosDontsRow[]> {
  const { data, error } = await supabaseAdmin
    .from('help_dos_donts')
    .select('*')
    .order('type', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function insertDosDont(payload: HelpDosDontsInsert): Promise<HelpDosDontsRow> {
  const { data, error } = await supabaseAdmin
    .from('help_dos_donts')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateDosDont(id: number, payload: HelpDosDontsUpdate): Promise<HelpDosDontsRow> {
  const { data, error } = await supabaseAdmin
    .from('help_dos_donts')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteDosDont(id: number): Promise<boolean> {
  const { error } = await supabaseAdmin.from('help_dos_donts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ── Contact & Support ─────────────────────────────────────────────────────────

export async function getAllContactSupport(): Promise<HelpContactRow[]> {
  const { data, error } = await supabaseAdmin
    .from('help_contact_support')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function insertContactSupport(payload: HelpContactInsert): Promise<HelpContactRow> {
  const { data, error } = await supabaseAdmin
    .from('help_contact_support')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateContactSupport(id: number, payload: HelpContactUpdate): Promise<HelpContactRow> {
  const { data, error } = await supabaseAdmin
    .from('help_contact_support')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteContactSupport(id: number): Promise<boolean> {
  const { error } = await supabaseAdmin.from('help_contact_support').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// ─── SSD Locations ────────────────────────────────────────────────────────────

type SsdLocationRow = Database['public']['Tables']['ssd_locations']['Row'];
type SsdLocationInsert = Database['public']['Tables']['ssd_locations']['Insert'];
type SsdLocationUpdate = Database['public']['Tables']['ssd_locations']['Update'];

export async function getAllSsdLocations(): Promise<SsdLocationRow[]> {
  const { data, error } = await supabaseAdmin
    .from('ssd_locations')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSsdLocationById(id: number): Promise<SsdLocationRow | null> {
  const { data, error } = await supabaseAdmin
    .from('ssd_locations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(error.message);
  }
  return data;
}

export async function insertSsdLocation(payload: SsdLocationInsert): Promise<SsdLocationRow> {
  const { data, error } = await supabaseAdmin
    .from('ssd_locations')
    .insert({ ...payload, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSsdLocation(id: number, payload: SsdLocationUpdate): Promise<SsdLocationRow> {
  const { data, error } = await supabaseAdmin
    .from('ssd_locations')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSsdLocation(id: number): Promise<boolean> {
  const { error } = await supabaseAdmin.from('ssd_locations').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}
