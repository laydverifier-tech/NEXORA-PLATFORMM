'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminAction, UNAUTHORIZED } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { dbMessage } from '@/lib/admin/helpers';
import { DISCORD_WEBHOOK_RE } from '@/lib/admin/constants';
import { notifyDiscord } from '@/lib/admin/notify';
import { zodFields, type FormState } from '@/types/forms';

const schema = z.object({
  whatsapp_number: z.union([z.literal(''), z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/, 'Valid number, e.g. +212 6…')]).optional().transform((v) => v || null),
  discord_webhook_url: z.union([z.literal(''), z.string().trim().regex(DISCORD_WEBHOOK_RE, 'Must be a discord.com webhook URL')]).optional().transform((v) => v || null),
});
export async function savePrivateSettings(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await adminAction(); if (!ctx) return UNAUTHORIZED;
  const p = schema.safeParse(Object.fromEntries(fd)); if (!p.success) return { fieldErrors: zodFields(p.error), error: 'Please fix the highlighted fields.' };
  const keep = String(fd.get('keep_webhook') ?? '') === '1' && !p.data.discord_webhook_url; // field left blank = keep the stored one
  const rows: { key: string; value: Record<string, unknown> }[] = [{ key: 'payment', value: { whatsapp_number: p.data.whatsapp_number } }];
  if (!keep) rows.push({ key: 'discord_webhook', value: { url: p.data.discord_webhook_url } });
  const { error } = await ctx.supabase.from('private_settings').upsert(rows.map((r) => ({ ...r, updated_by: ctx.user.id })), { onConflict: 'key' });
  if (error) return { error: dbMessage(error, 'setting') };
  await audit(ctx, 'private_settings.update', 'private_settings', null, { keys: rows.map((r) => r.key) }); // values are never logged
  revalidatePath('/admin/settings');
  return { message: 'Saved. These values are private (never shown on the public site).' };
}
export async function testWebhook(): Promise<FormState> {
  const ctx = await adminAction(); if (!ctx) return UNAUTHORIZED;
  const ok = await notifyDiscord(ctx, '✅ NEXORA admin: webhook test message.');
  return ok ? { message: 'Test message sent to Discord.' } : { error: 'Could not send. Check the webhook URL.' };
}
