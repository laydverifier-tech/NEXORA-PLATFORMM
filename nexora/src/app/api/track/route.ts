import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceClient, hasServiceKey } from '@/lib/supabase/admin';
import { clientKey, rateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';
const schema = z.object({
  type: z.enum(['page_view', 'tournament_view', 'giveaway_view', 'media_view', 'sponsor_click', 'registration_start']),
  path: z.string().max(200).regex(/^\/[A-Za-z0-9\-._~/%]*$/).optional(),
  ref: z.string().max(80).regex(/^[A-Za-z0-9\-_.]+$/).optional(),
});
/** Privacy-conscious analytics: no cookies, no IP stored (only a salted hash), strict allow-list payload, server-side insert only. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  if (!(await rateLimit('track', 90, 60)).ok) return new NextResponse(null, { status: 429 });
  if (hasServiceKey()) {
    const { error } = await createServiceClient().from('analytics_events').insert({ event_type: parsed.data.type, path: parsed.data.path ?? null, ref_id: parsed.data.ref ?? null, ip_hash: clientKey() });
    if (error) console.error('[track]', error.message);
  }
  return new NextResponse(null, { status: 204 });
}
