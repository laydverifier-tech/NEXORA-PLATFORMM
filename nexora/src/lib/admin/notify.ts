import 'server-only';
import { DISCORD_WEBHOOK_RE } from './constants';
import type { AdminCtx } from './context';
import { createServiceClient, hasServiceKey } from '@/lib/supabase/admin';

async function post(url: string, content: string) {
  if (!DISCORD_WEBHOOK_RE.test(url)) return false; // fixed host allow-list: no SSRF
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(4000), body: JSON.stringify({ username: 'NEXORA', content: content.slice(0, 1800), allowed_mentions: { parse: [] } }) });
    return r.ok;
  } catch { return false; }
}
/** Public announcement (news, tournaments, giveaways, results) using the admin's own session. Never throws. */
export async function notifyDiscord(ctx: AdminCtx, content: string): Promise<boolean> {
  const { data } = await ctx.supabase.from('private_settings').select('value').eq('key', 'discord_webhook').limit(1);
  const url = (data?.[0]?.value as { url?: string } | undefined)?.url;
  return url ? post(url, content) : false;
}
/** Security alerts (e.g. admin login brute force). Needs the service key; silently skipped otherwise. */
export async function alertSecurity(message: string): Promise<void> {
  if (!hasServiceKey()) return;
  try {
    const { data } = await createServiceClient().from('private_settings').select('value').eq('key', 'discord_webhook').limit(1);
    const url = (data?.[0]?.value as { url?: string } | undefined)?.url;
    if (url) await post(url, `🚨 SECURITY: ${message}`);
  } catch { /* best effort */ }
}
