import { createClient } from '@supabase/supabase-js';

/**
 * Cookie-less anon client for PUBLIC content. Pages stay cacheable (ISR) and everything it can read is
 * bounded by RLS "public read" policies. Never use it for user-specific data.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (url, init) => fetch(url, { ...init, next: { revalidate: 60 } }) },
  });
}
