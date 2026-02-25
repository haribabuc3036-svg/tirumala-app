/**
 * useLiveUpdates
 *
 * Opens a Firebase Realtime Database listener on `live_updates/` and returns
 * live data for the SSD token status and today's pilgrim snapshot.
 *
 * Expected RTDB structure:
 *
 * live_updates/
 *   ssd_token/
 *     running_slot:     "12"
 *     balance_tickets:  "0"
 *     date:             "26-Feb-2026"
 *   sarva_darshan_queue: "18H"          ← raw queue / waiting text
 *   pilgrims_today/
 *     date:       "26.02.2026"
 *     pilgrims:   "77,803"
 *     tonsures:   "27,766"
 *     hundi:      "4.66 CR"
 *     waiting:    "31 Compartments"
 *     time:       "18H"
 */

import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { db } from '@/config/firebase';

export type LiveSsdStatus = {
  runningSlot: string;
  balanceTickets: string;
  date: string;
};

export type LivePilgrimsToday = {
  date: string;
  pilgrims: string;
  tonsures: string;
  hundi: string;
  waiting: string;
  time: string;
};

export type LiveUpdates = {
  ssdToken: LiveSsdStatus | null;
  pilgrimsToday: LivePilgrimsToday | null;
  sarvaQueueTime: string | null;
  loading: boolean;
  error: string | null;
};

export function useLiveUpdates(): LiveUpdates {
  const [ssdToken, setSsdToken] = useState<LiveSsdStatus | null>(null);
  const [pilgrimsToday, setPilgrimsToday] = useState<LivePilgrimsToday | null>(null);
  const [sarvaQueueTime, setSarvaQueueTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const liveRef = ref(db, 'live_updates');

    const unsubscribe = onValue(
      liveRef,
      (snapshot) => {
        const data = snapshot.val();
        console.log('[Firebase] live_updates raw data:', JSON.stringify(data, null, 2));
        if (data) {
          if (data.ssd_token) {
            setSsdToken({
              runningSlot: String(data.ssd_token.running_slot ?? '—'),
              balanceTickets: String(data.ssd_token.balance_tickets ?? '0'),
              date: String(data.ssd_token.date ?? ''),
            });
          }
          if (data.pilgrims_today) {
            setPilgrimsToday({
              date: String(data.pilgrims_today.date ?? ''),
              pilgrims: String(data.pilgrims_today.pilgrims ?? '—'),
              tonsures: String(data.pilgrims_today.tonsures ?? '—'),
              hundi: String(data.pilgrims_today.hundi ?? '—'),
              waiting: String(data.pilgrims_today.waiting ?? '—'),
              time: String(data.pilgrims_today.time ?? '—'),
            });
          }
          if (data.sarva_darshan_queue != null) {
            setSarvaQueueTime(String(data.sarva_darshan_queue));
          }
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { ssdToken, pilgrimsToday, sarvaQueueTime, loading, error };
}
