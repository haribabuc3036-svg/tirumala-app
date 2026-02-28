import { useEffect, useState } from 'react';

import { supabase } from '@/config/supabase';
import { type Service } from '@/types/services';

export function useServiceDetail(id?: string) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      if (!id) {
        setService(null);
        setError('Invalid service id');
        setLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from('services_catalog')
          .select('id,title,description,icon,image,url,tag,tag_color,booking_date,instructions')
          .eq('id', id)
          .maybeSingle();

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!data) {
          throw new Error('Service not found');
        }

        const { data: imageRows, error: imagesError } = await supabase
          .from('service_images')
          .select('image_url,sort_order')
          .eq('service_id', id)
          .order('sort_order', { ascending: true });

        const imagesTableMissing =
          imagesError && (
            imagesError.message.includes('service_images') ||
            imagesError.code === 'PGRST205'
          );

        if (imagesError && !imagesTableMissing) {
          throw new Error(imagesError.message);
        }

        const images = imagesTableMissing ? [] : (imageRows ?? []).map((row) => row.image_url);

        if (!cancelled) {
          setService({
            id: data.id,
            title: data.title,
            description: data.description,
            icon: data.icon as Service['icon'],
            ...(data.image ? { iconImage: data.image } : {}),
            ...(images.length > 0 ? { images } : {}),
            url: data.url,
            ...(data.tag ? { tag: data.tag } : {}),
            ...(data.tag_color ? { tagColor: data.tag_color } : {}),
            bookingDate: (data as any).booking_date ?? null,
            instructions: (data as any).instructions ?? null,
          });
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setService(null);
          setError(err instanceof Error ? err.message : 'Unable to load service detail');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { service, loading, error };
}
