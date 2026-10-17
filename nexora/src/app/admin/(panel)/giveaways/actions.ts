'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { crudSave } from '@/lib/admin/crud';
import { adminAction } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { isUuid } from '@/lib/admin/helpers';
import { notifyDiscord } from '@/lib/admin/notify';
import { giveawaySchema } from '@/lib/validation/admin2';
import { siteConfig } from '@/config/site';
import type { FormState } from '@/types/forms';

export const saveGiveaway = (_: FormState, fd: FormData) => crudSave(fd, { table: 'giveaways', schema: giveawaySchema, entity: 'giveaway', path: '/admin/giveaways', label: (d) => d.title, map: (d) => { const { status, ...rest } = d; return status ? { ...rest, status } : { ...rest, status: 'DRAFT' }; } });

export async function publishGiveaway(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? ''); if (!ctx || !isUuid(id)) return;
  const { data } = await ctx.supabase.from('giveaways').update({ status: 'LIVE' }).eq('id', id).in('status', ['DRAFT', 'UPCOMING']).select('title,slug,prize');
  if (data?.[0]) { await audit(ctx, 'giveaway.publish', 'giveaway', id); await notifyDiscord(ctx, `🎁 New giveaway: ${data[0].title} — win ${data[0].prize}!\n${siteConfig.url}/giveaways/${data[0].slug}`); }
  revalidatePath('/admin/giveaways'); redirect(`/admin/giveaways/${id}?saved=1`);
}
const DRAW_ERRORS: [RegExp, string][] = [[/not ended yet/i, 'The giveaway has not ended yet (server time).'], [/already selected/i, 'Winners were already selected.'], [/cannot be drawn/i, 'This giveaway cannot be drawn in its current status.'], [/Not authorized/i, 'Not allowed. 2-step verification required.']];
/** The draw itself runs INSIDE the database (SECURITY DEFINER, aal2 + role check, row lock, server clock, CSPRNG, audit log). */
export async function drawGiveaway(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? ''); if (!ctx || !isUuid(id)) return;
  const { data, error } = await ctx.supabase.rpc('nx_draw_giveaway', { p_giveaway: id });
  if (error) { const msg = DRAW_ERRORS.find(([re]) => re.test(error.message))?.[1] ?? 'Could not draw. Try again.'; if (!DRAW_ERRORS.some(([re]) => re.test(error.message))) console.error('[draw]', error.message); redirect(`/admin/giveaways/${id}?err=${encodeURIComponent(msg)}`); }
  const { data: g } = await ctx.supabase.from('giveaways').select('title,slug').eq('id', id).limit(1);
  if (g?.[0]) await notifyDiscord(ctx, `🏆 Winner${Number(data) > 1 ? 's' : ''} selected for "${g[0].title}"! ${siteConfig.url}/giveaways/${g[0].slug}`);
  revalidatePath('/admin/giveaways'); redirect(`/admin/giveaways/${id}?drawn=${Number(data) || 0}`);
}
export async function cancelGiveaway(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? ''); if (!ctx || !isUuid(id)) return;
  const { error } = await ctx.supabase.from('giveaways').update({ status: 'CANCELLED' }).eq('id', id).in('status', ['DRAFT', 'UPCOMING', 'LIVE']);
  if (!error) await audit(ctx, 'giveaway.cancel', 'giveaway', id);
  revalidatePath('/admin/giveaways'); redirect('/admin/giveaways');
}
