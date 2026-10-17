import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt } from 'crypto';
import { createServiceClient, hasServiceKey } from '@/lib/supabase/admin';

/**
 * Captcha provider:
 *  - Cloudflare Turnstile when NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY are set (recommended in production)
 *  - otherwise a self-hosted image captcha: the answer lives ENCRYPTED inside a signed token (AES-256-GCM), tokens expire
 *    after 5 min and are SINGLE-USE (nonce stored in public.captcha_nonces).
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
const key = () => createHash('sha256').update('nx-captcha|' + (process.env.CAPTCHA_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'dev-only-secret')).digest();
export const captchaMode = () => (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY ? 'turnstile' : 'builtin') as 'turnstile' | 'builtin';

export function encryptPayload(p: { n: string; a: string; e: number }): string {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([c.update(JSON.stringify(p), 'utf8'), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64url');
}
export function decryptPayload(token: string): { n: string; a: string; e: number } | null {
  try {
    const b = Buffer.from(token, 'base64url'); if (b.length < 29) return null;
    const d = createDecipheriv('aes-256-gcm', key(), b.subarray(0, 12)); d.setAuthTag(b.subarray(12, 28));
    return JSON.parse(Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8'));
  } catch { return null; }
}
function svg(text: string): string {
  const W = 190, H = 64, col = ['#f5d060', '#ffffff', '#e0b02a', '#cfcfd6'];
  const lines = Array.from({ length: 6 }, () => `<path d="M${randomInt(0, W)} ${randomInt(0, H)} Q${randomInt(0, W)} ${randomInt(0, H)} ${randomInt(0, W)} ${randomInt(0, H)}" stroke="${col[randomInt(0, 4)]}" stroke-opacity=".55" stroke-width="1.6" fill="none"/>`).join('');
  const dots = Array.from({ length: 40 }, () => `<circle cx="${randomInt(0, W)}" cy="${randomInt(0, H)}" r="${randomInt(1, 3) / 2}" fill="#fff" fill-opacity=".35"/>`).join('');
  const chars = [...text].map((ch, i) => `<text x="${22 + i * 31}" y="${42 + randomInt(-6, 7)}" font-size="${30 + randomInt(0, 6)}" font-family="Arial Black,Arial,sans-serif" font-weight="900" fill="${col[randomInt(0, 4)]}" transform="rotate(${randomInt(-22, 23)} ${22 + i * 31} 36) skewX(${randomInt(-12, 13)})">${ch}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#0c0c10"/>${dots}${chars}${lines}</svg>`;
}
export function createChallenge() {
  const answer = Array.from({ length: 5 }, () => ALPHABET[randomInt(0, ALPHABET.length)]).join('');
  const token = encryptPayload({ n: randomBytes(12).toString('hex'), a: answer, e: Date.now() + 5 * 60_000 });
  return { token, image: 'data:image/svg+xml;base64,' + Buffer.from(svg(answer)).toString('base64') };
}
/** Verifies the visitor's captcha proof from a submitted form. Returns true only once per challenge. */
export async function verifyCaptcha(form: FormData): Promise<boolean> {
  try {
    if (captchaMode() === 'turnstile') {
      const t = String(form.get('cf-turnstile-response') ?? ''); if (!t) return false;
      const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY!, response: t }) });
      return ((await r.json()) as { success?: boolean }).success === true;
    }
    const p = decryptPayload(String(form.get('captcha_token') ?? ''));
    const ans = String(form.get('captcha_answer') ?? '').trim().toUpperCase();
    if (!p || p.e < Date.now() || ans.length !== 5 || ans !== p.a) return false;
    if (!hasServiceKey()) return true; // local dev without DB: no nonce store available
    const { data, error } = await createServiceClient().rpc('nx_use_captcha', { p_nonce: p.n });
    return !error && data === true;
  } catch { return false; }
}
