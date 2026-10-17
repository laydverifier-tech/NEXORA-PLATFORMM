import 'server-only';
import { headers } from 'next/headers';
import { createHash } from 'crypto';
import { createServiceClient, hasServiceKey } from '@/lib/supabase/admin';

/** Salted hash of the caller IP (the raw IP is never stored). */
export function clientKey(): string {
  const h = headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  return createHash('sha256').update(ip + (process.env.IP_HASH_SALT ?? '')).digest('hex').slice(0, 24);
}
const hash16 = (s: string) => createHash('sha256').update(s.toLowerCase() + (process.env.IP_HASH_SALT ?? '')).digest('hex').slice(0, 16);

/** Per-instance fallback (used only when the shared DB limiter is unavailable). */
const mem = new Map<string, number[]>();
function memHit(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now();
  const hits = (mem.get(key) ?? []).filter((t) => now - t < windowSec * 1000);
  if (hits.length >= limit) { mem.set(key, hits); return false; }
  hits.push(now); mem.set(key, hits);
  return true;
}

async function hit(key: string, limit: number, windowSec: number): Promise<boolean> {
  if (hasServiceKey()) {
    try {
      const { data, error } = await createServiceClient().rpc('nx_hit', { p_key: key, p_limit: limit, p_window_seconds: windowSec });
      if (!error && typeof data === 'boolean') return data;
      if (error) console.error('[rateLimit]', error.message);
    } catch (e) { console.error('[rateLimit]', (e as Error).message); }
  }
  return memHit(key, limit, windowSec);
}

/** Shared limiter (public.nx_hit, service_role only). windowSec is in SECONDS. Degrades to in-memory if the DB is unreachable. */
export async function rateLimit(scope: string, limit: number, windowSec: number): Promise<{ ok: boolean }> {
  return { ok: await hit(`${scope}:${clientKey()}`, limit, windowSec) };
}
/** Same, with a second bucket per identity (e.g. login email) so one account can't be brute-forced from many IPs. */
export async function rateLimitFor(scope: string, limit: number, windowSec: number, subject: string): Promise<{ ok: boolean }> {
  const a = await hit(`${scope}:${clientKey()}`, limit, windowSec);
  const b = await hit(`${scope}-id:${hash16(subject)}`, limit, windowSec);
  return { ok: a && b };
}
