import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createPublicClient } from '@/lib/supabase/public';
import { createServiceClient, hasServiceKey } from '@/lib/supabase/admin';
import { clientKey } from '@/lib/security/rate-limit';
import { isSafeHttpsUrl } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';
/** Tracked sponsor redirect. Only redirects to the sponsor's stored https URL (never to a user-supplied one). */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const home = new URL('/partners', req.url);
  if (!z.string().uuid().safeParse(params.id).success) return NextResponse.redirect(home);
  const { data } = await createPublicClient().from('sponsors').select('website_url').eq('id', params.id).eq('is_active', true).limit(1);
  const url = data?.[0]?.website_url;
  if (!isSafeHttpsUrl(url)) return NextResponse.redirect(home);
  if (hasServiceKey()) await createServiceClient().from('analytics_events').insert({ event_type: 'sponsor_click', path: '/partners', ref_id: params.id, ip_hash: clientKey() });
  return NextResponse.redirect(url, 307);
}
