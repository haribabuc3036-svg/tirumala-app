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
          .select('id,title,description,icon,url,tag,tag_color')
          .eq('id', id)
          .maybeSingle();

        if (queryError) {
          throw new Error(queryError.message);
        }

        if (!data) {
          throw new Error('Service not found');
        }

        if (!cancelled) {
          setService({
            id: data.id,
            title: data.title,
            description: data.description,
            icon: data.icon as Service['icon'],
            url: data.url,
            ...(data.tag ? { tag: data.tag } : {}),
            ...(data.tag_color ? { tagColor: data.tag_color } : {}),
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
