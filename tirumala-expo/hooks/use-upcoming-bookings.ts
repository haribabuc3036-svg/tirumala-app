import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';

export type UpcomingBookingService = {
  id: string;
  title: string;
  icon: string;
  iconImage: string | null;
  bookingDate: string;
};

export function useUpcomingBookings() {
  const [services, setServices] = useState<UpcomingBookingService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data, error } = await supabase
          .from('services_catalog')
          .select('id,title,icon,image,booking_date')
          .not('booking_date', 'is', null)
          .order('booking_date', { ascending: true });

        if (!cancelled && !error && data) {
          setServices(
            (data as any[]).map((row) => ({
              id: row.id,
              title: row.title,
              icon: row.icon,
              iconImage: row.image ?? null,
              bookingDate: row.booking_date,
            }))
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { services, loading };
}
