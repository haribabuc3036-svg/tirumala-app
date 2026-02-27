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
  slotDate?: string;
  balanceDate?: string;
};

export type LivePilgrimsToday = {
  date: string;
  pilgrims: string;
  tonsures: string;
  hundi: string;
  waiting: string;
  time: string;
};

export type LivePilgrimsRecentItem = LivePilgrimsToday;

export type LiveDayScheduleItem = {
  event: string;
  time: string;
};

export type LiveDaySchedule = {
  date: string;
  day: string;
  schedules: LiveDayScheduleItem[];
};

export type LiveLatestNewsItem = {
  date: string;
  image_url: string;
  link: string;
  title: string;
};

export type LiveLatestUpdateItem = {
  text: string;
  link?: string;
};

export type LiveUpdates = {
  ssdToken: LiveSsdStatus | null;
  pilgrimsToday: LivePilgrimsToday | null;
  pilgrimsRecent: LivePilgrimsRecentItem[];
  daySchedule: LiveDaySchedule | null;
  latestNews: LiveLatestNewsItem[];
  latestUpdates: LiveLatestUpdateItem[];
  sarvaQueueTime: string | null;
  loading: boolean;
  error: string | null;
};

export function useLiveUpdates(): LiveUpdates {
  const [ssdToken, setSsdToken] = useState<LiveSsdStatus | null>(null);
  const [pilgrimsToday, setPilgrimsToday] = useState<LivePilgrimsToday | null>(null);
  const [pilgrimsRecent, setPilgrimsRecent] = useState<LivePilgrimsRecentItem[]>([]);
  const [daySchedule, setDaySchedule] = useState<LiveDaySchedule | null>(null);
  const [latestNews, setLatestNews] = useState<LiveLatestNewsItem[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<LiveLatestUpdateItem[]>([]);
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
              ...(data.ssd_token.slot_date ? { slotDate: String(data.ssd_token.slot_date) } : {}),
              ...(data.ssd_token.balance_date ? { balanceDate: String(data.ssd_token.balance_date) } : {}),
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
          if (Array.isArray(data.pilgrims_recent)) {
            setPilgrimsRecent(
              data.pilgrims_recent.map((item: any) => ({
                date: String(item.date ?? ''),
                pilgrims: String(item.pilgrims ?? '—'),
                tonsures: String(item.tonsures ?? '—'),
                hundi: String(item.hundi ?? '—'),
                waiting: String(item.waiting ?? '—'),
                time: String(item.darshan_time ?? item.time ?? '—'),
              }))
            );
          }
          if (data.day_schedule && Array.isArray(data.day_schedule.schedules)) {
            setDaySchedule({
              date: String(data.day_schedule.date ?? ''),
              day: String(data.day_schedule.day ?? ''),
              schedules: data.day_schedule.schedules.map((item: any) => ({
                event: String(item.event ?? ''),
                time: String(item.time ?? ''),
              })),
            });
          }
          if (Array.isArray(data.latest_news)) {
            setLatestNews(
              data.latest_news.map((item: any) => {
                const rawImageUrl = String(item.image_url ?? '').trim();
                const rawLink = String(item.link ?? '').trim();

                return {
                  date: String(item.date ?? '').trim(),
                  image_url: rawImageUrl ? encodeURI(rawImageUrl) : '',
                  link: rawLink,
                  title: String(item.title ?? '').trim(),
                };
              })
            );
          }
          if (Array.isArray(data.latest_updates)) {
            setLatestUpdates(
              data.latest_updates
                .map((item: any) => ({
                  text: String(item.text ?? '').trim(),
                  link: item.link ? String(item.link).trim() : undefined,
                }))
                .filter((item: LiveLatestUpdateItem) => item.text.length > 0)
            );
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

  return { ssdToken, pilgrimsToday, pilgrimsRecent, daySchedule, latestNews, latestUpdates, sarvaQueueTime, loading, error };
}
