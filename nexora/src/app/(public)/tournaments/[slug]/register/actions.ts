'use server';
import { createServiceClient, hasServiceKey } from '@/lib/supabase/admin';
import { createPublicClient } from '@/lib/supabase/public';
import { clientKey, rateLimit } from '@/lib/security/rate-limit';
import { verifyCaptcha } from '@/lib/security/captcha';
import { mapRegisterError, playersOf, registrationSchema, whatsappMessage } from '@/lib/validation/registration';

export type RegisterState = {
  error?: string; fieldErrors?: Record<string, string>;
  done?: { order_id: string; fee: number; tier: string; tournament: string; wa: string | null };
};

export async function registerSquad(slug: string, _: RegisterState, fd: FormData): Promise<RegisterState> {
  const parsed = registrationSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === 'website')) return { error: 'Could not complete the registration. Please try again.' }; // bots
    return { fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])), error: 'Please fix the highlighted fields.' };
  }
  const d = parsed.data; const players = playersOf(d);
  if (new Set(players.map((p) => p.uid)).size !== 5) return { error: 'The same UID is used twice in your squad.' };
  if (!(await rateLimit('register_squad', 6, 900)).ok) return { error: 'Too many attempts. Please wait a few minutes.' };
  if (!(await verifyCaptcha(fd))) return { fieldErrors: { captcha: 'Wrong or expired code. Please try again.' }, error: 'Security check failed.' };
  if (!hasServiceKey()) { console.error('[register] SUPABASE_SERVICE_ROLE_KEY missing'); return { error: 'Registration is temporarily unavailable.' }; }
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) return { error: 'Tournament not found.' };

  const { data: t } = await createPublicClient().from('tournaments').select('id').eq('slug', slug).limit(1);
  if (!t?.[0]) return { error: 'Tournament not found.' };
  const db = createServiceClient();
  const { data, error } = await db.rpc('nx_register_squad', {
    p_tournament: t[0].id, p_squad: d.squad_name, p_tag: d.tag ?? '', p_captain: d.captain_name, p_whatsapp: d.whatsapp, p_discord: d.discord ?? '', p_tier: d.tier, p_players: players, p_ip: clientKey(),
  });
  if (error || !data) { if (error && !/TOURNAMENT_CLOSED|SLOTS_FULL|NAME_TAKEN|WHATSAPP_TAKEN|UID_|INVALID/.test(error.message)) console.error('[register]', error.message); return { error: mapRegisterError(error?.message ?? '') }; }
  const r = data as { order_id: string; tournament: string; tier: string; fee: number };
  // The payment WhatsApp number lives in private_settings: it is only revealed AFTER a successful registration.
  const { data: ps } = await db.from('private_settings').select('value').eq('key', 'payment').limit(1);
  const num = String((ps?.[0]?.value as { whatsapp_number?: string } | undefined)?.whatsapp_number ?? '').replace(/\D/g, '');
  const text = whatsappMessage({ order_id: r.order_id, tournament: r.tournament, squad: d.squad_name, captain: d.captain_name, whatsapp: d.whatsapp, discord: d.discord, players, fee: r.fee, tier: r.tier });
  return { done: { order_id: r.order_id, fee: r.fee, tier: r.tier, tournament: r.tournament, wa: num.length >= 8 ? `https://wa.me/${num}?text=${encodeURIComponent(text)}` : null } };
}
