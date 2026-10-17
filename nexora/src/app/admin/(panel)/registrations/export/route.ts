import { adminAction } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { csvCell, isUuid } from '@/lib/admin/helpers';

export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  const ctx = await adminAction();
  if (!ctx) return new Response('Forbidden', { status: 403 });
  const t = new URL(req.url).searchParams.get('t');
  let q = ctx.supabase.from('squad_registrations').select('order_id,squad_name,tag,captain_name,whatsapp,discord,tier,status,payment_status,players,created_at').order('created_at', { ascending: false }).limit(5000);
  if (isUuid(t)) q = q.eq('tournament_id', t);
  const { data, error } = await q;
  if (error) return new Response('Error', { status: 500 });
  const head = ['order_id', 'squad', 'tag', 'captain', 'whatsapp', 'discord', 'tier', 'status', 'payment', 'players', 'created_at'];
  const lines = (data ?? []).map((r) => [r.order_id, r.squad_name, r.tag, r.captain_name, r.whatsapp, r.discord, r.tier, r.status, r.payment_status, (r.players as { nickname?: string; uid?: string }[] ?? []).map((p) => `${p.nickname}:${p.uid}`).join(' | '), r.created_at].map(csvCell).join(','));
  await audit(ctx, 'registration.export', 'squad_registration', null, { rows: lines.length });
  return new Response([head.join(','), ...lines].join('\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="nexora-registrations.csv"', 'cache-control': 'no-store' } });
}
