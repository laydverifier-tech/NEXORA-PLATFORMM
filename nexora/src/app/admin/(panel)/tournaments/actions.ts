'use server';
import { redirect } from 'next/navigation';
import { adminAction, UNAUTHORIZED } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { dbMessage, isUuid } from '@/lib/admin/helpers';
import { notifyDiscord } from '@/lib/admin/notify';
import { siteConfig } from '@/config/site';
import { rateLimit } from '@/lib/security/rate-limit';
import { tournamentSchema } from '@/lib/validation/admin';
import { zodFields, type FormState } from '@/types/forms';

export async function saveTournament(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await adminAction(); if (!ctx) return UNAUTHORIZED;
  if (!(await rateLimit('admin_write', 60, 60)).ok) return { error: 'Slow down a little.' };
  const p = tournamentSchema.safeParse(Object.fromEntries(fd)); if (!p.success) return { fieldErrors: zodFields(p.error), error: 'Please fix the highlighted fields.' };
  const { prize1, prize2, prize3, prize_mvp, ...t } = p.data;
  const id = String(fd.get('id') ?? '');
  let tid = id; let opened = t.status === 'REGISTRATION_OPEN' && !id;
  if (id) {
    if (!isUuid(id)) return { error: 'Invalid tournament.' };
    const { data: before } = await ctx.supabase.from('tournaments').select('status').eq('id', id).limit(1); opened = t.status === 'REGISTRATION_OPEN' && before?.[0]?.status !== 'REGISTRATION_OPEN';
    const { error } = await ctx.supabase.from('tournaments').update(t).eq('id', id);
    if (error) return { error: dbMessage(error, 'tournament') };
  } else {
    const { data, error } = await ctx.supabase.from('tournaments').insert({ ...t, organizer_id: ctx.user.id, format_type: 'SQUAD', match_mode: 'BATTLE_ROYALE' }).select('id').limit(1);
    if (error || !data?.[0]) return { error: dbMessage(error ?? { message: 'no row' }, 'tournament') };
    tid = data[0].id as string;
  }
  for (const [placement, amount] of [[1, prize1], [2, prize2], [3, prize3], [0, prize_mvp]] as const) {
    if (amount > 0) await ctx.supabase.from('prizes').upsert({ tournament_id: tid, placement, amount, description: placement ? `Top ${placement}` : 'MVP' }, { onConflict: 'tournament_id,placement' });
    else await ctx.supabase.from('prizes').delete().eq('tournament_id', tid).eq('placement', placement);
  }
  await audit(ctx, id ? 'tournament.update' : 'tournament.create', 'tournament', tid, { name: t.name, status: t.status });
  if (opened) await notifyDiscord(ctx, `🔥 Registration is open: ${t.name} — prize pool €${t.prize_pool}\n${siteConfig.url}/tournaments/${t.slug}/register`);
  redirect(`/admin/tournaments/${tid}?saved=1`);
}
export async function cancelTournament(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? '');
  if (!ctx || !isUuid(id)) return;
  const { error } = await ctx.supabase.from('tournaments').update({ status: 'CANCELLED' }).eq('id', id);
  if (!error) await audit(ctx, 'tournament.cancel', 'tournament', id);
  redirect('/admin/tournaments');
}
