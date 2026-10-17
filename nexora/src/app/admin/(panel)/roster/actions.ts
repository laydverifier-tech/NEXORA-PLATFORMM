'use server';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { adminAction, UNAUTHORIZED } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { dbMessage, isUuid } from '@/lib/admin/helpers';
import { MAX_IMAGE_BYTES, safeFilename, sniffImage } from '@/lib/admin/upload';
import { rateLimit } from '@/lib/security/rate-limit';
import { parseStats, rosterSchema } from '@/lib/validation/admin';
import { zodFields, type FormState } from '@/types/forms';

const BUCKET = 'roster';
export async function saveRoster(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await adminAction(); if (!ctx) return UNAUTHORIZED;
  if (!(await rateLimit('admin_write', 60, 60)).ok) return { error: 'Slow down a little.' };
  const p = rosterSchema.safeParse(Object.fromEntries(fd)); if (!p.success) return { fieldErrors: zodFields(p.error), error: 'Please fix the highlighted fields.' };
  const { instagram, tiktok, youtube, twitch, x, discord, stats, ...r } = p.data;
  const socials = Object.fromEntries(Object.entries({ instagram, tiktok, youtube, twitch, x, discord }).filter(([, v]) => v));
  const row: Record<string, unknown> = { ...r, socials, stats: parseStats(stats) };
  const id = String(fd.get('id') ?? ''); if (id && !isUuid(id)) return { error: 'Invalid player.' };

  const file = fd.get('image');
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_IMAGE_BYTES) return { fieldErrors: { image: 'Max 4 MB' }, error: 'Image too large.' };
    const buf = new Uint8Array(await file.arrayBuffer());
    const kind = sniffImage(buf); // real content check; client MIME/extension ignored
    if (!kind) return { fieldErrors: { image: 'JPG, PNG or WebP only' }, error: 'This file is not a valid JPG/PNG/WebP image.' };
    const path = safeFilename(r.slug, kind.ext, randomUUID().slice(0, 8));
    const up = await ctx.supabase.storage.from(BUCKET).upload(path, buf, { contentType: kind.mime, upsert: false });
    if (up.error) return { error: dbMessage({ message: up.error.message }, 'image') };
    row.image_url = ctx.supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }
  let rid = id;
  if (id) { const { error } = await ctx.supabase.from('roster_members').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id); if (error) return { error: dbMessage(error, 'player') }; }
  else { const { data, error } = await ctx.supabase.from('roster_members').insert(row).select('id').limit(1); if (error || !data?.[0]) return { error: dbMessage(error ?? { message: 'no row' }, 'player') }; rid = data[0].id as string; }
  await audit(ctx, id ? 'roster.update' : 'roster.create', 'roster_member', rid, { nickname: r.nickname });
  redirect(`/admin/roster/${rid}?saved=1`);
}
export async function deleteRoster(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? '');
  if (!ctx || !isUuid(id)) return;
  const { error } = await ctx.supabase.from('roster_members').delete().eq('id', id);
  if (!error) await audit(ctx, 'roster.delete', 'roster_member', id);
  redirect('/admin/roster');
}
