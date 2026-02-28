import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SsdLocation = {
  id: number;
  name: string;
  area: string;
  timings: string;
  note: string | null;
  image_url: string | null;
  maps_url: string;
  tag: string | null;
  sort_order: number;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSsdLocations() {
  const [locations, setLocations] = useState<SsdLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data, error: sbError } = await supabase
          .from('ssd_locations')
          .select('id, name, area, timings, note, image_url, maps_url, tag, sort_order')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (sbError) throw new Error(sbError.message);
        if (!cancelled) setLocations(data ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load locations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { locations, loading, error };
}
