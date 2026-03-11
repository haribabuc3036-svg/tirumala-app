import { useEffect, useState } from 'react';
import { supabase } from '@/config/supabase';
import { resolveActiveBookingDate } from '@/utils/booking-utils';

export type UpcomingBookingService = {
  id: string;
  title: string;
  icon: string;
  iconImage: string | null;
  /** Resolved active booking date — next upcoming slot or currently-open (≤24 h) slot. */
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
          .select('id,title,icon,image,booking_dates,booking_date')
          .not('booking_dates', 'is', null)
          .order('id', { ascending: true });

        if (!cancelled && !error && data) {
          const resolved: UpcomingBookingService[] = [];
          for (const row of data as any[]) {
            // Prefer booking_dates array; fall back to legacy booking_date single value
            const dates: string[] | null =
              row.booking_dates ?? (row.booking_date ? [row.booking_date] : null);
            const active = resolveActiveBookingDate(dates);
            if (!active) continue; // all dates expired >24 h ago
            resolved.push({
              id: row.id,
              title: row.title,
              icon: row.icon,
              iconImage: row.image ?? null,
              bookingDate: active,
            });
          }
          // Sort: upcoming first, then open (already-passed-but-within-24h)
          resolved.sort(
            (a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime()
          );
          setServices(resolved);
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
