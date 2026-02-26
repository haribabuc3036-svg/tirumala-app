import { useEffect, useState } from 'react';

import { supabase } from '@/config/supabase';
import type { PlaceRegion, PlaceSummary } from '@/types/places';

type PlaceRegionRow = {
  id: string;
  title: string;
  subtitle: string | null;
};

type PlaceRow = {
  id: string;
  region_id: string;
  name: string;
  distance_from_tirumala_km: number;
  description: string;
  maps_url: string;
  sort_order: number;
};

type PlacePhotoRow = {
  place_id: string;
  image_url: string;
  sort_order: number;
};

export function useRegionPlaces(regionId?: string) {
  const [region, setRegion] = useState<PlaceRegion | null>(null);
  const [places, setPlaces] = useState<PlaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!regionId) {
        if (!cancelled) {
          setRegion(null);
          setPlaces([]);
          setError('Invalid region id');
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const [{ data: regionData, error: regionError }, { data: placesData, error: placesError }] = await Promise.all([
          supabase.from('place_regions').select('id,title,subtitle').eq('id', regionId).maybeSingle(),
          supabase
            .from('places')
            .select('id,region_id,name,distance_from_tirumala_km,description,maps_url,sort_order')
            .eq('region_id', regionId)
            .order('sort_order', { ascending: true }),
        ]);

        if (regionError) throw new Error(regionError.message);
        if (placesError) throw new Error(placesError.message);

        const matchingRegion = regionData as PlaceRegionRow | null;

        if (!matchingRegion) {
          throw new Error('Region not found');
        }

        const places = (placesData ?? []) as PlaceRow[];
        const placeIds = places.map((place) => place.id);

        const photosByPlaceId = new Map<string, string[]>();
        if (placeIds.length > 0) {
          const { data: photosData, error: photosError } = await supabase
            .from('place_photos')
            .select('place_id,image_url,sort_order')
            .in('place_id', placeIds)
            .order('sort_order', { ascending: true });

          if (photosError) throw new Error(photosError.message);

          ((photosData ?? []) as PlacePhotoRow[]).forEach((photo) => {
            const bucket = photosByPlaceId.get(photo.place_id) ?? [];
            bucket.push(photo.image_url);
            photosByPlaceId.set(photo.place_id, bucket);
          });
        }

        const mappedPlaces: PlaceSummary[] = places.map((place) => ({
          id: place.id,
          name: place.name,
          distanceFromTirumalaKm: Number(place.distance_from_tirumala_km),
          description: place.description,
          mapsUrl: place.maps_url,
          photos: photosByPlaceId.get(place.id) ?? [],
        }));

        if (!cancelled) {
          setRegion({
            id: matchingRegion.id,
            title: matchingRegion.title,
            ...(matchingRegion.subtitle ? { subtitle: matchingRegion.subtitle } : {}),
          });
          setPlaces(mappedPlaces);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setRegion(null);
          setPlaces([]);
          setError(err instanceof Error ? err.message : 'Unable to load region places');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [regionId]);

  return { region, places, loading, error };
}
