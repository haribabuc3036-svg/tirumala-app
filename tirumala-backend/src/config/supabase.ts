import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '../types/supabase';

/**
 * Public (anon) client — safe to use for read operations.
 * Respects Row Level Security policies.
 */
export const supabase = createClient<Database>(
  env.supabase.url,
  env.supabase.anonKey
);

/**
 * Admin (service-role) client — bypasses RLS.
 * Use ONLY in trusted server-side code, never expose to clients.
 */
export const supabaseAdmin = createClient<Database>(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
