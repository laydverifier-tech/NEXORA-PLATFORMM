import { z } from 'zod';
import { optUrl } from './admin';

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{1,78}$/, 'Lowercase letters, numbers and dashes only');
const checkbox = z.preprocess((v) => v === 'on' || v === 'true', z.boolean());
const utc = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid date').transform((v) => `${v}:00Z`);
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => v || null);

export const GIVEAWAY_STATUSES = ['DRAFT', 'UPCOMING', 'LIVE', 'CANCELLED'] as const; // ENDED / DRAWING / WINNER_SELECTED are system-managed
export const giveawaySchema = z.object({
  title: z.string().trim().min(3).max(140), slug, prize: z.string().trim().min(1).max(60), description: opt(2000), rules: opt(3000),
  prize_image_url: optUrl, starts_at: utc, ends_at: utc,
  max_entries: z.union([z.literal(''), z.coerce.number().int().min(1).max(1_000_000)]).optional().transform((v) => (v === '' || v === undefined ? null : v)),
  winners_count: z.coerce.number().int().min(1).max(50), status: z.enum(GIVEAWAY_STATUSES).optional(),
}).refine((g) => new Date(g.ends_at) > new Date(g.starts_at), { path: ['ends_at'], message: 'Must be after the start' });

export const MEDIA_CATEGORIES = ['BEST_PLAY', 'MVP', 'CLUTCH', 'FINAL', 'MATCHDAY', 'BEHIND_THE_SCENES'] as const;
const httpsReq = z.string().trim().max(500).refine((u) => { try { return new URL(u).protocol === 'https:'; } catch { return false; } }, 'Must be a valid https:// URL');
export const mediaSchema = z.object({ title: z.string().trim().min(2).max(140), category: z.enum(MEDIA_CATEGORIES), video_url: httpsReq, thumbnail_url: optUrl, view_count: z.coerce.number().int().min(0).max(1_000_000_000).default(0), is_published: checkbox });
export const hofSchema = z.object({ tournament_name: z.string().trim().min(2).max(120), season: opt(30), winner: z.string().trim().min(1).max(80), prize: opt(40), mvp: opt(60), sponsor: opt(60), event_date: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).optional().transform((v) => v || null), sort_order: z.coerce.number().int().min(0).max(999).default(0), is_published: checkbox });
export const PARTNER_TYPES = ['TITLE', 'TOURNAMENT', 'MVP', 'GIVEAWAY', 'CONTENT', 'BROADCAST'] as const;
export const partnerSchema = z.object({ name: z.string().trim().min(2).max(80), logo_url: optUrl, website_url: optUrl, partner_type: z.enum(PARTNER_TYPES), description: opt(500), is_active: checkbox });
export const ASSIGNABLE_ROLES = ['USER', 'ORGANIZER', 'ADMIN'] as const;
