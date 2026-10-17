'use server';
import { revalidatePath } from 'next/cache';
import { adminAction, UNAUTHORIZED } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { dbMessage } from '@/lib/admin/helpers';
import { rateLimit } from '@/lib/security/rate-limit';
import { settingsSchema, statValue } from '@/lib/validation/admin';
import { zodFields, type FormState } from '@/types/forms';

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await adminAction(); if (!ctx) return UNAUTHORIZED;
  if (!(await rateLimit('admin_write', 30, 60)).ok) return { error: 'Slow down a little.' };
  const p = settingsSchema.safeParse(Object.fromEntries(fd)); if (!p.success) return { fieldErrors: zodFields(p.error), error: 'Please fix the highlighted fields.' };
  const d = p.data;
  const { data: cur } = await ctx.supabase.from('site_settings').select('key,value').in('key', ['site', 'social', 'hero', 'stats']);
  const old = Object.fromEntries((cur ?? []).map((r) => [r.key, (r.value ?? {}) as Record<string, unknown>])); // merge: unknown keys written by other tools survive
  const rows = [
    { key: 'site', value: { ...old.site, name: d.site_name, tagline: d.site_tagline, hashtag: d.site_hashtag, contact_email: d.contact_email } },
    { key: 'social', value: { ...old.social, tournament_handle: d.tournament_handle, gaming_handle: d.gaming_handle, instagram_url: d.instagram_url, tiktok_url: d.tiktok_url, youtube_url: d.youtube_url, twitch_url: d.twitch_url, x_url: d.x_url, discord_url: d.discord_url } },
    { key: 'hero', value: { ...old.hero, eyebrow: d.hero_eyebrow, title: d.hero_title, tagline: d.hero_tagline, cta1_label: d.cta1_label, cta1_href: d.cta1_href, cta2_label: d.cta2_label, cta2_href: d.cta2_href, video_url: d.video_url, poster_url: d.poster_url } },
    { key: 'stats', value: { ...old.stats, tournaments: statValue(d.stat_tournaments), players: statValue(d.stat_players), teams: statValue(d.stat_teams), countries: statValue(d.stat_countries), total_views: statValue(d.stat_total_views), community: statValue(d.stat_community) } },
  ].map((r) => ({ ...r, updated_by: ctx.user.id, updated_at: new Date().toISOString() }));
  const { error } = await ctx.supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) return { error: dbMessage(error, 'setting') };
  await audit(ctx, 'settings.update', 'site_settings', null, { keys: ['site', 'social', 'hero', 'stats'] });
  revalidatePath('/', 'layout');
  return { message: 'Settings saved. The public site updates within a minute.' };
}
