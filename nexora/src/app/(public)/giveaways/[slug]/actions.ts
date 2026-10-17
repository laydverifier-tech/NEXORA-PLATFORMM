'use server';
import { createHash } from 'crypto';
import { z } from 'zod';
import { createServiceClient, hasServiceKey } from '@/lib/supabase/admin';
import { clientKey, rateLimit } from '@/lib/security/rate-limit';
import { verifyCaptcha } from '@/lib/security/captcha';

export type EntryState = { error?: string; message?: string; fieldErrors?: Record<string, string> };
const schema = z.object({ contact: z.string().trim().min(3, 'Too short').max(120).regex(/^[A-Za-z0-9._@#+\-]+$/, 'Email or handle, no spaces'), website: z.string().max(0).optional() });
const MSG: Record<string, string> = { duplicate: 'You are already entered with this contact.', closed: 'This giveaway is not open for entries.', full: 'This giveaway reached its maximum number of entries.' };

/** The server (not the browser) decides: captcha + rate limit + DB-clock window + unique constraint. */
export async function enterGiveaway(slug: string, _: EntryState, fd: FormData): Promise<EntryState> {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return p.error.issues.some((i) => i.path[0] === 'website') ? { message: 'You are entered. Good luck!' } : { fieldErrors: { contact: p.error.issues[0].message }, error: 'Please check your contact.' };
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) return { error: 'Giveaway not found.' };
  if (!(await rateLimit('giveaway_entry', 5, 600)).ok) return { error: 'Too many attempts. Please wait a few minutes.' };
  if (!(await verifyCaptcha(fd))) return { fieldErrors: { captcha: 'Wrong or expired code. Please try again.' }, error: 'Security check failed.' };
  if (!hasServiceKey()) return { error: 'Entries are temporarily unavailable.' };
  const contact = p.data.contact; const hash = createHash('sha256').update(contact.toLowerCase() + (process.env.IP_HASH_SALT ?? '')).digest('hex');
  const { data, error } = await createServiceClient().rpc('nx_enter_giveaway', { p_slug: slug, p_contact: contact, p_hash: hash, p_ip: clientKey() });
  if (error) { console.error('[giveaway-entry]', error.message); return { error: 'Could not enter. Please try again.' }; }
  return data === 'ok' ? { message: 'You are entered. Good luck! 🍀' } : { error: MSG[String(data)] ?? 'Could not enter.' };
}
