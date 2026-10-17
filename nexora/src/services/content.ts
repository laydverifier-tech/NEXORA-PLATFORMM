import 'server-only';
import { createPublicClient } from '@/lib/supabase/public';
import type { Giveaway, HallOfFameRow, MatchRow, MediaItem, NewsRow, Prize, PublicSquad, RosterMember, SiteSettings, Sponsor, Tournament } from '@/types/content';

const VISIBLE = ['REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'LIVE', 'FINISHED'];

/** Public reads never throw into the UI: errors are logged server-side and an empty state is rendered. */
async function safe<T>(label: string, fn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await fn();
    if (error) { console.error(`[content:${label}]`, error.message); return fallback; }
    return data ?? fallback;
  } catch (e) { console.error(`[content:${label}]`, (e as Error).message); return fallback; }
}
const db = () => createPublicClient();

export async function getSettings(): Promise<SiteSettings> {
  const rows = await safe<{ key: string; value: unknown }[]>('settings', () => db().from('site_settings').select('key,value').in('key', ['site', 'social', 'stats', 'hero']), []);
  const m = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    site: (m.site as SiteSettings['site']) ?? {},
    social: (m.social as SiteSettings['social']) ?? {},
    hero: (m.hero as SiteSettings['hero']) ?? {},
    stats: { tournaments: null, players: null, teams: null, countries: null, total_views: null, community: null, ...((m.stats as object) ?? {}) } as SiteSettings['stats'],
  };
}
export const getTournaments = (): Promise<Tournament[]> =>
  safe('tournaments', () => db().from('tournaments').select('*').in('status', VISIBLE).order('tournament_start', { ascending: false }), []);
export async function getTournament(slug: string): Promise<Tournament | null> {
  const rows = await safe<Tournament[]>('tournament', () => db().from('tournaments').select('*').eq('slug', slug).in('status', VISIBLE).limit(1), []);
  return rows[0] ?? null;
}
export const getPrizes = (tournamentId: string): Promise<Prize[]> =>
  safe('prizes', () => db().from('prizes').select('*').eq('tournament_id', tournamentId).order('placement', { ascending: true }), []);
export const getMatches = (tournamentId: string): Promise<MatchRow[]> =>
  safe('matches', () => db().from('matches').select('*').eq('tournament_id', tournamentId).order('scheduled_at', { ascending: true }), []);
export async function getFeaturedTournament(): Promise<Tournament | null> {
  const all = await getTournaments();
  const now = new Date();
  const live = all.find((t) => t.status === 'LIVE');
  const open = all.filter((t) => t.status === 'REGISTRATION_OPEN' && new Date(t.registration_end) > now).sort((x, y) => +new Date(x.registration_end) - +new Date(y.registration_end))[0];
  return live ?? open ?? all[0] ?? null;
}
/** LIVE match first, otherwise the next scheduled one. */
export async function getNextMatch(): Promise<{ match: MatchRow; tournament: Tournament } | null> {
  const ts = await getTournaments();
  if (!ts.length) return null;
  const ms = await safe<MatchRow[]>('next-match', () => db().from('matches').select('*').in('tournament_id', ts.map((t) => t.id)).in('status', ['LIVE', 'SCHEDULED']).order('scheduled_at', { ascending: true }).limit(20), []);
  const m = ms.find((x) => x.status === 'LIVE') ?? ms.find((x) => x.scheduled_at && new Date(x.scheduled_at) > new Date()) ?? null;
  const t = m && ts.find((x) => x.id === m.tournament_id);
  return m && t ? { match: m, tournament: t } : null;
}
export const getRoster = (): Promise<RosterMember[]> => safe('roster', () => db().from('roster_members').select('*').order('sort_order', { ascending: true }), []);
export async function getRosterMember(slug: string): Promise<RosterMember | null> {
  const r = await safe<RosterMember[]>('roster-one', () => db().from('roster_members').select('*').eq('slug', slug).limit(1), []);
  return r[0] ?? null;
}
export const getNews = (limit = 12): Promise<NewsRow[]> =>
  safe('news', () => db().from('news').select('id,title,slug,content,cover_image_url,published_at,category,excerpt,seo_title,seo_description').eq('is_published', true).order('published_at', { ascending: false }).limit(limit), []);
export async function getNewsBySlug(slug: string): Promise<NewsRow | null> {
  const r = await safe<NewsRow[]>('news-one', () => db().from('news').select('id,title,slug,content,cover_image_url,published_at,category,excerpt,seo_title,seo_description').eq('slug', slug).eq('is_published', true).limit(1), []);
  return r[0] ?? null;
}
export const getMedia = (limit = 24): Promise<MediaItem[]> =>
  safe('media', () => db().from('media_items').select('id,title,category,thumbnail_url,video_url,view_count,published_at').eq('is_published', true).order('published_at', { ascending: false }).limit(limit), []);
export const getHallOfFame = (): Promise<HallOfFameRow[]> =>
  safe('hof', () => db().from('hall_of_fame').select('*').eq('is_published', true).order('event_date', { ascending: false }), []);
export const getSponsors = (): Promise<Sponsor[]> =>
  safe('sponsors', () => db().from('sponsors').select('id,name,logo_url,website_url,tier,description,partner_type').eq('is_active', true).order('created_at', { ascending: true }), []);
export const getGiveaways = (): Promise<Giveaway[]> =>
  safe('giveaways', () => db().from('giveaways').select('*').neq('status', 'CANCELLED').order('ends_at', { ascending: false }), []);
export async function getGiveaway(slug: string): Promise<Giveaway | null> {
  const r = await safe<Giveaway[]>('giveaway', () => db().from('giveaways').select('*').eq('slug', slug).limit(1), []);
  return r[0] ?? null;
}
export async function getActiveGiveaway(): Promise<Giveaway | null> {
  const g = await getGiveaways();
  return g.find((x) => x.status === 'LIVE' && new Date(x.ends_at) > new Date()) ?? null;
}

export const getPublicSquads = (tournamentId: string): Promise<PublicSquad[]> =>
  safe('squads', () => db().from('public_squads').select('id,tournament_id,squad_name,tag,logo_url').eq('tournament_id', tournamentId).order('squad_name', { ascending: true }), []);

export type LeaderboardRow = { rank: number; squad_name: string; tag: string | null; rounds_played: number; booyahs: number; kills: number; points: number };
export const getLeaderboard = (tournamentId: string, stage: string | null, from = 1, to = 99): Promise<LeaderboardRow[]> =>
  safe('leaderboard', () => db().rpc('nx_leaderboard', { p_tournament: tournamentId, p_stage: stage, p_round_min: from, p_round_max: to }), [] as LeaderboardRow[]);
export async function getResultStages(tournamentId: string): Promise<string[]> {
  const rows = await safe<{ stage: string }[]>('stages', () => db().from('nx_results').select('stage').eq('tournament_id', tournamentId).limit(2000), []);
  return [...new Set(rows.map((r) => r.stage))];
}
export const getGiveawayWinners = (slug: string): Promise<{ masked: string; selected_at: string }[]> =>
  safe('winners', () => db().rpc('nx_giveaway_winners', { p_slug: slug }), []);
