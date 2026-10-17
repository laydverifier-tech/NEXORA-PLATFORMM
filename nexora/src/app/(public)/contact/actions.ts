'use server';
import { z } from 'zod';
import { createServiceClient, hasServiceKey } from '@/lib/supabase/admin';
import { clientKey, rateLimit } from '@/lib/security/rate-limit';
import { verifyCaptcha } from '@/lib/security/captcha';

export type ContactState = { error?: string; message?: string; fieldErrors?: Record<string, string> };
const schema = z.object({
  name: z.string().trim().min(2, 'Too short').max(80),
  email: z.string().trim().toLowerCase().email('Invalid email').max(254),
  subject: z.string().trim().min(3, 'Too short').max(120),
  message: z.string().trim().min(10, 'At least 10 characters').max(4000),
  website: z.string().max(0).optional(), // honeypot: real users never fill it
});

export async function sendContact(_: ContactState, fd: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) return { message: 'Message sent. We will get back to you soon.' }; // bots: pretend success
    return { fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  }
  if (!(await rateLimit('contact', 3, 600)).ok) return { error: 'Too many messages. Please try again later.' };
  if (!(await verifyCaptcha(fd))) return { fieldErrors: { captcha: 'Wrong or expired code. Please try again.' } };
  if (!hasServiceKey()) { console.error('[contact] SUPABASE_SERVICE_ROLE_KEY missing'); return { error: 'Messages are temporarily unavailable.' }; }
  const { website: _hp, ...row } = parsed.data;
  const { error } = await createServiceClient().from('contact_messages').insert({ ...row, ip_hash: clientKey() });
  if (error) { console.error('[contact]', error.message); return { error: 'We could not send your message. Please try again.' }; }
  return { message: 'Message sent. We will get back to you soon.' };
}
