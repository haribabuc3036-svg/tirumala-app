import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/config/supabase';
import type { PlaceRegionWithMeta } from '@/types/places';

type PlaceRegionRow = {
  id: string;
  title: string;
  subtitle: string | null;
  sort_order: number;
};

type PlaceRow = {
  id: string;
  region_id: string;
  sort_order: number;
};

type PlacePhotoRow = {
  place_id: string;
  image_url: string;
  sort_order: number;
};

export function usePlacesRegions() {
  const [regions, setRegions] = useState<PlaceRegionWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRegions = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: regionsData, error: regionsError }, { data: placesData, error: placesError }, { data: photosData, error: photosError }] =
        await Promise.all([
          supabase.from('place_regions').select('id,title,subtitle,sort_order').order('sort_order', { ascending: true }),
          supabase.from('places').select('id,region_id,sort_order').order('sort_order', { ascending: true }),
          supabase.from('place_photos').select('place_id,image_url,sort_order').order('sort_order', { ascending: true }),
        ]);

      if (regionsError) throw new Error(regionsError.message);
      if (placesError) throw new Error(placesError.message);
      if (photosError) throw new Error(photosError.message);

      const regions = (regionsData ?? []) as PlaceRegionRow[];
      const places = (placesData ?? []) as PlaceRow[];
      const photos = (photosData ?? []) as PlacePhotoRow[];

      const photosByPlaceId = new Map<string, string[]>();
      photos.forEach((photo) => {
        const bucket = photosByPlaceId.get(photo.place_id) ?? [];
        bucket.push(photo.image_url);
        photosByPlaceId.set(photo.place_id, bucket);
      });

      const placesByRegionId = new Map<string, PlaceRow[]>();
      places.forEach((place) => {
        const bucket = placesByRegionId.get(place.region_id) ?? [];
        bucket.push(place);
        placesByRegionId.set(place.region_id, bucket);
      });

      const enriched: PlaceRegionWithMeta[] = regions.map((region) => {
        const regionPlaces = (placesByRegionId.get(region.id) ?? []).sort(
          (a, b) => a.sort_order - b.sort_order
        );
        const firstPlaceId = regionPlaces[0]?.id;
        const previewPhoto = firstPlaceId ? photosByPlaceId.get(firstPlaceId)?.[0] : undefined;

        return {
          id: region.id,
          title: region.title,
          ...(region.subtitle ? { subtitle: region.subtitle } : {}),
          placeCount: regionPlaces.length,
          ...(previewPhoto ? { previewPhoto } : {}),
        };
      });

      setRegions(enriched);
      setError(null);
    } catch (err) {
      setRegions([]);
      setError(err instanceof Error ? err.message : 'Unable to load regions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegions();
  }, [loadRegions]);

  return { regions, loading, error, reload: loadRegions };
}
