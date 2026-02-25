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

/** Read the current Sarva Darshan queue wait time text */
export async function getSarvaQueue(): Promise<string | null> {
  return rtdbGet<string>('live_updates/sarva_darshan_queue');
}

/** Update the raw Sarva Darshan queue wait time text */
export async function updateSarvaQueue(queueText: string) {
  await rtdbSet('live_updates/sarva_darshan_queue', queueText);
}
