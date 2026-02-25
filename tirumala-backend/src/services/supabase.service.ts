import { supabaseAdmin } from '../config/supabase';
import type { Database } from '../types/supabase';

type DarshanRow = Database['public']['Tables']['darshan_updates']['Row'];
type DarshanInsert = Database['public']['Tables']['darshan_updates']['Insert'];
type SsdRow = Database['public']['Tables']['ssd_status']['Row'];
type SsdInsert = Database['public']['Tables']['ssd_status']['Insert'];

// ─── Darshan Updates ───────────────────────────────────────────────────────────

/** Get all historical darshan updates, newest first */
export async function getAllDarshanUpdates(): Promise<DarshanRow[]> {
  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Get darshan updates paginated */
export async function getDarshanUpdates(page = 1, limit = 10): Promise<DarshanRow[]> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .select('*')
    .order('date', { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Insert a new darshan update record */
export async function insertDarshanUpdate(payload: DarshanInsert): Promise<DarshanRow> {
  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Upsert by date (idempotent — safe to call multiple times for the same day) */
export async function upsertDarshanUpdate(payload: DarshanInsert): Promise<DarshanRow> {
  const { data, error } = await supabaseAdmin
    .from('darshan_updates')
    .upsert(payload, { onConflict: 'date' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─── SSD Status ───────────────────────────────────────────────────────────────

/** Get the most recent SSD status row */
export async function getLatestSsdStatus(): Promise<SsdRow | null> {
  const { data, error } = await supabaseAdmin
    .from('ssd_status')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/** Upsert the current SSD status */
export async function upsertSsdStatus(payload: SsdInsert): Promise<SsdRow> {
  const { data, error } = await supabaseAdmin
    .from('ssd_status')
    .upsert(payload, { onConflict: 'date' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
