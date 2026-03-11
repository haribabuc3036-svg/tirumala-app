import { useEffect, useState } from 'react';

import { supabase } from '@/config/supabase';
import type { PlaceDetail } from '@/types/places';

type PlaceRow = {
  id: string;
  region_id: string;
  name: string;
  distance_from_tirumala_km: number;
  description: string;
  maps_url: string;
};

type PlacePhotoRow = {
  image_url: string;
  sort_order: number;
};

export function usePlaceDetail(placeId?: string) {
  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!placeId) {
        if (!cancelled) {
          setPlace(null);
          setError('Invalid place id');
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const { data: placeData, error: placeError } = await supabase
          .from('places')
          .select('id,region_id,name,distance_from_tirumala_km,description,maps_url')
          .eq('id', placeId)
          .maybeSingle();

        if (placeError) throw new Error(placeError.message);

        const place = placeData as PlaceRow | null;
        if (!place) {
          throw new Error('Place not found');
        }

        const { data: photosData, error: photosError } = await supabase
          .from('place_photos')
          .select('image_url,sort_order')
          .eq('place_id', placeId)
          .order('sort_order', { ascending: true });

        if (photosError) throw new Error(photosError.message);

        const mapped: PlaceDetail = {
          id: place.id,
          regionId: place.region_id,
          name: place.name,
          distanceFromTirumalaKm: Number(place.distance_from_tirumala_km),
          description: place.description,
          mapsUrl: place.maps_url,
          photos: ((photosData ?? []) as PlacePhotoRow[]).map((photo) => photo.image_url),
        };

        if (!cancelled) {
          setPlace(mapped);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setPlace(null);
          setError(err instanceof Error ? err.message : 'Unable to load place details');
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
  }, [placeId]);

  return { place, loading, error };
}
