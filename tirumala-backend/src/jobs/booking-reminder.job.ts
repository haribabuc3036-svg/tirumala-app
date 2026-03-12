/**
 * Booking Reminder Job
 * Runs every minute. Checks all services_catalog rows that have booking_dates and fires:
 *   - A "1 hour left" FCM notification when a booking date is ~60 min away
 *   - A "5 minutes left" FCM notification when a booking date is ~5 min away
 * Uses Firebase RTDB /notification_log/ to ensure each reminder fires exactly once.
 */

import cron, { type ScheduledTask } from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import {
  broadcastNotification,
  wasReminderSent,
  markReminderSent,
} from '../services/push-notification.service';

const supabase = createClient(env.supabase.url, env.supabase.serviceRoleKey);

// Fire if the booking date is within ±90 seconds of the target offset
const WINDOW_MS = 90_000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const FIVE_MIN_MS = 5 * 60 * 1000;

type ServiceRow = {
  id: string;
  title: string;
  booking_dates: string[] | null;
};

async function runReminderCycle(): Promise<void> {
  const now = Date.now();

  const { data, error } = await supabase
    .from('services_catalog')
    .select('id, title, booking_dates')
    .not('booking_dates', 'is', null);

  if (error) {
    console.error('[reminder] Supabase error:', error.message);
    return;
  }

  const services: ServiceRow[] = (data ?? []) as ServiceRow[];

  for (const service of services) {
    for (const dateStr of service.booking_dates ?? []) {
      const bookingMs = new Date(dateStr).getTime();
      if (isNaN(bookingMs)) continue;

      const diffMs = bookingMs - now;

      // ── 1-hour reminder ────────────────────────────────────────────────────
      if (Math.abs(diffMs - ONE_HOUR_MS) <= WINDOW_MS) {
        if (!(await wasReminderSent(service.id, dateStr, '1hr'))) {
          console.log(`[reminder] 1hr → "${service.title}" at ${dateStr}`);
          await broadcastNotification({
            title: '⏰ Booking opens in 1 hour',
            body: `"${service.title}" booking starts in about 1 hour. Get ready!`,
            data: { serviceId: service.id, bookingDate: dateStr, type: 'booking_reminder_1hr' },
          });
          await markReminderSent(service.id, dateStr, '1hr');
        }
      }

      // ── 5-minute reminder ──────────────────────────────────────────────────
      if (Math.abs(diffMs - FIVE_MIN_MS) <= WINDOW_MS) {
        if (!(await wasReminderSent(service.id, dateStr, '5min'))) {
          console.log(`[reminder] 5min → "${service.title}" at ${dateStr}`);
          await broadcastNotification({
            title: '🔔 Booking opens in 5 minutes!',
            body: `"${service.title}" booking is about to open. Book now!`,
            data: { serviceId: service.id, bookingDate: dateStr, type: 'booking_reminder_5min' },
          });
          await markReminderSent(service.id, dateStr, '5min');
        }
      }
    }
  }
}

let task: ScheduledTask | null = null;

export function startBookingReminderJob(): void {
  if (task) return;
  task = cron.schedule('* * * * *', () => {
    runReminderCycle().catch((err) =>
      console.error('[reminder] Unhandled error:', err)
    );
  }, { timezone: 'Asia/Kolkata' });
  console.log('[reminder] Booking reminder job started (every minute)');
}

export function stopBookingReminderJob(): void {
  task?.stop();
  task = null;
}
