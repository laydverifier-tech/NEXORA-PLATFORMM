import { NextResponse } from 'next/server';
import { getSettings } from '@/services/content';
import { isSafeHttpsUrl } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';
/** JOIN DISCORD: redirects to the invite configured in site_settings, otherwise to the contact page (never a dead link). */
export async function GET(req: Request) {
  const { site } = await getSettings();
  return NextResponse.redirect(isSafeHttpsUrl(site.discord_url) ? site.discord_url : new URL('/contact?subject=Discord%20invite', req.url), 307);
}
