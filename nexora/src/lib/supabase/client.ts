import { createBrowserClient } from '@supabase/ssr';

/** Browser client. Uses ONLY the public anon key; everything it can do is bounded by RLS. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
