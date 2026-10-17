import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * SERVICE-ROLE client (bypasses RLS). `server-only` makes the build fail if this is ever imported client-side.
 * Used ONLY for public write endpoints that validate everything first (registration, contact, analytics, rate limits, captcha).
 * Admin-panel CRUD does NOT use it: it runs with the signed-in admin's own session so the database enforces permissions.
 */
export function hasServiceKey() { return !!process.env.SUPABASE_SERVICE_ROLE_KEY; }
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
