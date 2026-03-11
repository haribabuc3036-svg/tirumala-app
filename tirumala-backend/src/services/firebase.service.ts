import { rtdb } from '../config/firebase';

/**
 * Read a value once from RTDB.
 */
export async function rtdbGet<T>(path: string): Promise<T | null> {
  const snap = await rtdb.ref(path).once('value');
  return snap.val() as T | null;
}

/**
 * Write / overwrite a node in RTDB.
 */
export async function rtdbSet(path: string, value: unknown): Promise<void> {
  await rtdb.ref(path).set(value);
}

/**
 * Merge-update (PATCH) a node in RTDB without overwriting sibling keys.
 */
export async function rtdbUpdate(path: string, value: Record<string, unknown>): Promise<void> {
  await rtdb.ref(path).update(value);
}

// ─── TTD-specific helpers ──────────────────────────────────────────────────────

/** Read the current live SSD token status */
export async function getLiveSsdStatus() {
  return rtdbGet<{
    running_slot: string;
    slot_date: string;
    balance_date: string;
    balance_tickets: string;
  }>('live_updates/ssd_token');
}

/** Update SSD token status and broadcast to all connected clients instantly */
export async function updateLiveSsdStatus(data: {
  running_slot: string;
  slot_date: string;
  balance_date: string;
  balance_tickets: string;
}) {
  await rtdbUpdate('live_updates/ssd_token', data);
}

/** Update today's pilgrim snapshot */
export async function updateLivePilgrims(data: {
  date: string;
  pilgrims: string;
  tonsures: string;
  hundi: string;
  waiting: string;
  time: string;
}) {
  await rtdbUpdate('live_updates/pilgrims_today', data);
}

// ─── Pilgrims Recent (last 10) ────────────────────────────────────────────────

import { PilgrimEntry } from '../scraper/pilgrims.scraper';

/** Read the current list of up to 10 recent pilgrim entries */
export async function getLivePilgrimsRecent(): Promise<PilgrimEntry[]> {
  const data = await rtdbGet<PilgrimEntry[]>('live_updates/pilgrims_recent');
  return data ?? [];
}

/**
 * Overwrite the pilgrims_recent list.
 * Keeps newest-first, max 10 entries.
 */
export async function updateLivePilgrimsRecent(entries: PilgrimEntry[]): Promise<void> {
  const trimmed = entries.slice(0, 10);
  await rtdbSet('live_updates/pilgrims_recent', trimmed);
}

/** Read the current Sarva Darshan queue wait time text */
export async function getSarvaQueue(): Promise<string | null> {
  return rtdbGet<string>('live_updates/sarva_darshan_queue');
}

/** Update the raw Sarva Darshan queue wait time text */
export async function updateSarvaQueue(queueText: string) {
  await rtdbSet('live_updates/sarva_darshan_queue', queueText);
}

// ─── Day Schedule ──────────────────────────────────────────────────────────────

import { ScheduleEntry } from '../scraper/schedule.scraper';

/** Read today's day schedule */
export async function getLiveDaySchedule() {
  return rtdbGet<{
    date: string;
    day: string;
    schedules: ScheduleEntry[];
  }>('live_updates/day_schedule');
}

/** Overwrite day schedule (runs once daily at 12:01 AM IST) */
export async function updateLiveDaySchedule(data: {
  date: string;
  day: string;
  schedules: ScheduleEntry[];
}) {
  await rtdbSet('live_updates/day_schedule', data);
}

// ─── Latest Updates ───────────────────────────────────────────────────────────

import { LatestUpdateEntry } from '../scraper/latest-updates.scraper';

/** Read the current latest-updates list from Firebase */
export async function getLiveLatestUpdates(): Promise<LatestUpdateEntry[]> {
  const data = await rtdbGet<LatestUpdateEntry[]>('live_updates/latest_updates');
  return data ?? [];
}

/** Overwrite the latest-updates list in Firebase */
export async function updateLiveLatestUpdates(entries: LatestUpdateEntry[]): Promise<void> {
  await rtdbSet('live_updates/latest_updates', entries);
}

// ─── Events ───────────────────────────────────────────────────────────────────

import { EventEntry } from '../scraper/events.scraper';

/** Read the current events list from Firebase */
export async function getLiveEvents(): Promise<EventEntry[]> {
  const data = await rtdbGet<EventEntry[]>('live_updates/events');
  return data ?? [];
}

/** Overwrite the events list in Firebase (up to 20 entries) */
export async function updateLiveEvents(entries: EventEntry[]): Promise<void> {
  await rtdbSet('live_updates/events', entries.slice(0, 20));
}

// ─── Brahmotsavams ───────────────────────────────────────────────────────

import { BrahmotsavamEntry } from '../scraper/brahmotsavams.scraper';

/** Read the current brahmotsavams list from Firebase */
export async function getLiveBrahmotsavams(): Promise<BrahmotsavamEntry[]> {
  const data = await rtdbGet<BrahmotsavamEntry[]>('live_updates/brahmotsavams');
  return data ?? [];
}

/** Overwrite the brahmotsavams list in Firebase (up to 20 entries) */
export async function updateLiveBrahmotsavams(entries: BrahmotsavamEntry[]): Promise<void> {
  await rtdbSet('live_updates/brahmotsavams', entries.slice(0, 20));
}

// ─── Utsavams ──────────────────────────────────────────────────────────────

import { UtsavamEntry } from '../scraper/utsavams.scraper';

/** Read the current utsavams list from Firebase */
export async function getLiveUtsavams(): Promise<UtsavamEntry[]> {
  const data = await rtdbGet<UtsavamEntry[]>('live_updates/utsavams');
  return data ?? [];
}

/** Overwrite the utsavams list in Firebase (up to 20 entries) */
export async function updateLiveUtsavams(entries: UtsavamEntry[]): Promise<void> {
  await rtdbSet('live_updates/utsavams', entries.slice(0, 20));
}

// ─── Temple News ─────────────────────────────────────────────────────────

import { TempleNewsEntry } from '../scraper/temple-news.scraper';

export async function getLiveTempleNews(): Promise<TempleNewsEntry[]> {
  const data = await rtdbGet<TempleNewsEntry[]>('live_updates/temple_news');
  return data ?? [];
}

export async function updateLiveTempleNews(entries: TempleNewsEntry[]): Promise<void> {
  await rtdbSet('live_updates/temple_news', entries.slice(0, 20));
}

// ─── VIP News ──────────────────────────────────────────────────────────────

import { VipNewsEntry } from '../scraper/vip-news.scraper';

export async function getLiveVipNews(): Promise<VipNewsEntry[]> {
  const data = await rtdbGet<VipNewsEntry[]>('live_updates/vip_news');
  return data ?? [];
}

export async function updateLiveVipNews(entries: VipNewsEntry[]): Promise<void> {
  await rtdbSet('live_updates/vip_news', entries.slice(0, 20));
}

// ─── Darshan News ───────────────────────────────────────────────────────

import { DarshanNewsEntry } from '../scraper/darshan-news.scraper';

export async function getLiveDarshanNews(): Promise<DarshanNewsEntry[]> {
  const data = await rtdbGet<DarshanNewsEntry[]>('live_updates/darshan_news');
  return data ?? [];
}

export async function updateLiveDarshanNews(entries: DarshanNewsEntry[]): Promise<void> {
  await rtdbSet('live_updates/darshan_news', entries.slice(0, 20));
}
