'use server';
import { revalidatePath } from 'next/cache';
import { adminAction, UNAUTHORIZED } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { dbMessage, isUuid } from '@/lib/admin/helpers';
import { notifyDiscord } from '@/lib/admin/notify';
import { STAGES } from '@/lib/admin/constants';
import { rateLimit } from '@/lib/security/rate-limit';
import { siteConfig } from '@/config/site';
import type { FormState } from '@/types/forms';

export async function saveRound(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await adminAction(); if (!ctx) return UNAUTHORIZED;
  if (!(await rateLimit('admin_write', 60, 60)).ok) return { error: 'Slow down a little.' };
  const t = String(fd.get('t') ?? ''), stage = String(fd.get('stage') ?? ''), round = Number(fd.get('round'));
  if (!isUuid(t) || !(STAGES as readonly string[]).includes(stage) || !Number.isInteger(round) || round < 1 || round > 99) return { error: 'Invalid tournament, stage or round.' };
  const rows: { tournament_id: string; stage: string; round: number; registration_id: string; placement: number; kills: number }[] = []; const blanks: string[] = []; const used = new Set<number>();
  for (const [k, v] of fd.entries()) {
    if (!k.startsWith('pl_')) continue;
    const id = k.slice(3); if (!isUuid(id)) continue;
    const raw = String(v).trim(); if (raw === '') { blanks.push(id); continue; }
    const placement = Number(raw), kills = Number(String(fd.get(`ki_${id}`) ?? '0').trim() || '0');
    if (!Number.isInteger(placement) || placement < 1 || placement > 100 || !Number.isInteger(kills) || kills < 0 || kills > 200) return { error: 'Placement must be 1-100 and kills 0-200 (whole numbers).' };
    if (used.has(placement)) return { error: `Placement ${placement} is used twice in this round.` };
    used.add(placement); rows.push({ tournament_id: t, stage, round, registration_id: id, placement, kills });
  }
  if (rows.length) { const { error } = await ctx.supabase.from('nx_results').upsert(rows, { onConflict: 'tournament_id,stage,round,registration_id' }); if (error) return { error: dbMessage(error, 'result') }; }
  if (blanks.length) await ctx.supabase.from('nx_results').delete().eq('tournament_id', t).eq('stage', stage).eq('round', round).in('registration_id', blanks);
  await audit(ctx, 'results.save', 'tournament', t, { stage, round, rows: rows.length });
  if (fd.get('announce') === 'on') { const { data: tt } = await ctx.supabase.from('tournaments').select('name,slug').eq('id', t).limit(1); if (tt?.[0]) await notifyDiscord(ctx, `🏆 ${tt[0].name} — ${stage.replace(/_/g, ' ')} round ${round} results are in!\n${siteConfig.url}/tournaments/${tt[0].slug}#leaderboard`); }
  revalidatePath('/admin/results');
  return { message: `Saved ${rows.length} result${rows.length === 1 ? '' : 's'}.` };
}
