import { z } from 'zod';

const name = (min: number, max: number) => z.string().trim().min(min, 'Too short').max(max, 'Too long');
export const playerSchema = z.object({
  nickname: name(2, 24),
  uid: z.string().trim().regex(/^[0-9]{6,15}$/, 'UID = 6 to 15 digits'),
});
export const registrationSchema = z.object({
  squad_name: name(2, 40),
  tag: z.string().trim().max(6, 'Max 6 characters').regex(/^[A-Za-z0-9]*$/, 'Letters/numbers only').optional().transform((v) => v || null),
  captain_name: name(2, 40),
  whatsapp: z.string().trim().regex(/^\+?[0-9 ()-]{8,20}$/, 'Valid WhatsApp number, e.g. +212 6…').refine((v) => v.replace(/\D/g, '').length >= 8, 'Too short'),
  discord: z.string().trim().max(40).optional().transform((v) => v || null),
  tier: z.enum(['NORMAL', 'VIP']),
  p1_nickname: name(2, 24), p1_uid: playerSchema.shape.uid,
  p2_nickname: name(2, 24), p2_uid: playerSchema.shape.uid,
  p3_nickname: name(2, 24), p3_uid: playerSchema.shape.uid,
  p4_nickname: name(2, 24), p4_uid: playerSchema.shape.uid,
  p5_nickname: name(2, 24), p5_uid: playerSchema.shape.uid,
  website: z.string().max(0).optional(), // honeypot
});
export type RegistrationInput = z.infer<typeof registrationSchema>;
export const playersOf = (d: RegistrationInput) => [1, 2, 3, 4, 5].map((i) => ({ nickname: d[`p${i}_nickname` as keyof RegistrationInput] as string, uid: d[`p${i}_uid` as keyof RegistrationInput] as string }));

export const REGISTER_ERRORS: Record<string, string> = {
  TOURNAMENT_CLOSED: 'Registration is closed for this tournament.',
  SLOTS_FULL: 'All slots are taken.',
  NAME_TAKEN: 'This squad name is already registered.',
  WHATSAPP_TAKEN: 'This WhatsApp number is already used by another squad.',
  UID_DUPLICATE: 'The same UID is used twice in your squad.',
  UID_TAKEN: 'One of these UIDs is already registered in another squad.',
  INVALID: 'Some values are not valid. Please check the form.',
};
export const mapRegisterError = (msg: string) => REGISTER_ERRORS[Object.keys(REGISTER_ERRORS).find((k) => msg.includes(k)) ?? ''] ?? 'Could not complete the registration. Please try again.';

/** Prefilled WhatsApp payment message (the site never pretends the payment is confirmed). */
export function whatsappMessage(o: { order_id: string; tournament: string; squad: string; captain: string; whatsapp: string; discord: string | null; players: { nickname: string; uid: string }[]; fee: number; tier: string }) {
  return [
    'Hello NEXORA 👋', '', 'I want to complete my registration payment.', '',
    `ORDER ID: ${o.order_id}`, `TOURNAMENT: ${o.tournament}`, `SQUAD: ${o.squad}`, `CAPTAIN: ${o.captain}`, `WHATSAPP: ${o.whatsapp}`, `DISCORD: ${o.discord ?? '—'}`, '',
    ...o.players.map((p, i) => `PLAYER ${i + 1}: ${p.nickname} — UID ${p.uid}`), '',
    `ENTRY FEE: €${o.fee} (${o.tier})`, '', 'I am ready to make the payment.', '', '#NEXORA',
  ].join('\n');
}
