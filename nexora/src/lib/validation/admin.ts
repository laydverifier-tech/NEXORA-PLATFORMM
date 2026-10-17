import { z } from 'zod';

export const httpsUrl = z.string().trim().max(500).refine((u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } }, 'Must be a valid https:// URL');
export const optUrl = z.union([z.literal(''), httpsUrl]).optional().transform((v) => (v ? v : null));
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,78}$/, 'Lowercase letters, numbers and dashes only (2-80)');
/** <input type="datetime-local"> gives "YYYY-MM-DDTHH:mm": the panel treats it as UTC. */
const utc = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid date').transform((v) => `${v}:00Z`);
const optUtc = z.union([z.literal(''), utc]).optional().transform((v) => (v ? v : null));
const money = z.coerce.number().min(0).max(1_000_000);
const checkbox = z.preprocess((v) => v === 'on' || v === 'true', z.boolean());

export const TOURNAMENT_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LIVE', 'FINISHED', 'CANCELLED'] as const;
export const tournamentSchema = z.object({
  name: z.string().trim().min(3).max(80), slug, game: z.string().trim().min(2).max(40),
  description: z.string().trim().max(2000).optional().transform((v) => v || null),
  rules: z.string().trim().max(6000).optional().transform((v) => v || null),
  prize_pool: money, entry_fee: money, vip_fee: z.union([z.literal(''), money]).transform((v) => (v === '' ? null : v)),
  max_teams: z.coerce.number().int().min(2).max(1024), rounds: z.coerce.number().int().min(1).max(100),
  region: z.string().trim().max(40).optional().transform((v) => v || null),
  status: z.enum(TOURNAMENT_STATUSES), banner_url: optUrl,
  registration_start: utc, registration_end: utc, tournament_start: utc, tournament_end: optUtc,
  prize1: z.coerce.number().min(0).max(1_000_000).default(0), prize2: z.coerce.number().min(0).max(1_000_000).default(0),
  prize3: z.coerce.number().min(0).max(1_000_000).default(0), prize_mvp: z.coerce.number().min(0).max(1_000_000).default(0),
}).refine((t) => new Date(t.registration_end) > new Date(t.registration_start), { path: ['registration_end'], message: 'Must be after registration start' });

export const rosterSchema = z.object({
  nickname: z.string().trim().min(2).max(40), slug,
  role_label: z.string().trim().max(30).optional().transform((v) => v || null),
  bio: z.string().trim().max(1500).optional().transform((v) => v || null),
  sort_order: z.coerce.number().int().min(0).max(999).default(0), is_active: checkbox,
  instagram: optUrl, tiktok: optUrl, youtube: optUrl, twitch: optUrl, x: optUrl, discord: optUrl,
  stats: z.string().max(600).optional().default(''),
});
/** "Label: value" per line → {label: value} (max 6, values ≤ 20 chars). */
export function parseStats(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split('\n').slice(0, 6)) {
    const [k, ...v] = line.split(':'); const key = k?.trim().toLowerCase().replace(/\s+/g, '_').slice(0, 24); const val = v.join(':').trim().slice(0, 20);
    if (key && val && /^[a-z0-9_]+$/.test(key)) out[key] = val;
  }
  return out;
}

export const NEWS_CATEGORIES = ['TOURNAMENT', 'ROSTER', 'COMMUNITY', 'ANNOUNCEMENT', 'PARTNERS', 'MEDIA'] as const;
export const newsSchema = z.object({
  title: z.string().trim().min(3).max(140), slug, category: z.enum(NEWS_CATEGORIES),
  excerpt: z.string().trim().max(300).optional().transform((v) => v || null),
  content: z.string().trim().min(10).max(20000), cover_image_url: optUrl,
  seo_title: z.string().trim().max(70).optional().transform((v) => v || null),
  seo_description: z.string().trim().max(160).optional().transform((v) => v || null),
  is_published: checkbox,
});

const handle = z.string().trim().max(40).optional().transform((v) => v || null);
const hrefOk = z.string().trim().max(200).refine((h) => h === '' || /^\/(?!\/)/.test(h) || /^https:\/\//.test(h), 'Use /path or https://…').optional().transform((v) => v || null);
export const settingsSchema = z.object({
  site_name: z.string().trim().min(2).max(40), site_tagline: z.string().trim().max(80).optional().transform((v) => v || null),
  site_hashtag: z.string().trim().max(30).optional().transform((v) => v || null),
  contact_email: z.union([z.literal(''), z.string().trim().toLowerCase().email().max(254)]).optional().transform((v) => v || null),
  tournament_handle: handle, gaming_handle: handle,
  instagram_url: optUrl, tiktok_url: optUrl, youtube_url: optUrl, twitch_url: optUrl, x_url: optUrl, discord_url: optUrl,
  hero_eyebrow: handle, hero_title: z.string().trim().min(1).max(30), hero_tagline: z.string().trim().max(80).optional().transform((v) => v || null),
  cta1_label: handle, cta1_href: hrefOk, cta2_label: handle, cta2_href: hrefOk, video_url: optUrl, poster_url: optUrl,
  stat_tournaments: handle, stat_players: handle, stat_teams: handle, stat_countries: handle, stat_total_views: handle, stat_community: handle,
});
export const statValue = (v: string | null): number | string | null => (v === null ? null : /^\d{1,12}$/.test(v) ? Number(v) : v);

export const factorCodeSchema = z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code');
export const loginSchemaAdmin = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(128), next: z.string().optional() });
