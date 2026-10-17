export type TournamentStatusDb = 'DRAFT' | 'PENDING_APPROVAL' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'LIVE' | 'FINISHED' | 'CANCELLED';
export type UiStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED';

export interface Tournament {
  id: string; name: string; slug: string; game: string; description: string | null; rules: string | null; banner_url: string | null;
  prize_pool: number; entry_fee: number; vip_fee?: number | null; max_teams: number; region: string | null; rounds: number;
  registration_start: string; registration_end: string; tournament_start: string; tournament_end: string | null;
  status: TournamentStatusDb; bracket_format: string; format_type: string;
}
export interface Prize { id: string; tournament_id: string; placement: number; amount: number; description: string | null }
export interface MatchRow {
  id: string; tournament_id: string; round: number; match_number: number; scheduled_at: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED' | 'DISPUTED'; stream_url: string | null; map_name: string | null; notes: string | null;
}
export interface NewsRow {
  id: string; title: string; slug: string; content: string; cover_image_url: string | null; published_at: string | null;
  category: string | null; excerpt: string | null; seo_title: string | null; seo_description: string | null;
}
export interface Sponsor { id: string; name: string; logo_url: string | null; website_url: string | null; tier: string | null; description: string | null; partner_type: string | null }
export interface RosterMember {
  id: string; slug: string; nickname: string; role_label: string | null; bio: string | null; image_url: string | null;
  socials: Record<string, string>; stats: Record<string, string | number>; sort_order: number;
}
export interface MediaItem { id: string; title: string; category: string; thumbnail_url: string | null; video_url: string; view_count: number; published_at: string | null }
export interface HallOfFameRow { id: string; tournament_name: string; season: string | null; winner: string; prize: string | null; mvp: string | null; sponsor: string | null; event_date: string | null }
export interface Giveaway {
  id: string; slug: string; title: string; description: string | null; prize: string; prize_image_url: string | null;
  status: 'UPCOMING' | 'LIVE' | 'ENDED' | 'DRAWING' | 'WINNER_SELECTED' | 'CANCELLED';
  starts_at: string; ends_at: string; max_entries: number | null; winners_count: number; entries_count: number; rules: string | null;
}
export interface HeroSettings { eyebrow?: string; title?: string; tagline?: string; cta1_label?: string; cta1_href?: string; cta2_label?: string; cta2_href?: string; video_url?: string | null; poster_url?: string | null }
export interface SiteSettings {
  site: { name?: string; tagline?: string; hashtag?: string; contact_email?: string | null; discord_url?: string | null };
  social: { tournament_handle?: string; gaming_handle?: string; instagram_url?: string | null; tiktok_url?: string | null; youtube_url?: string | null; twitch_url?: string | null; x_url?: string | null; discord_url?: string | null };
  stats: Record<'tournaments' | 'players' | 'teams' | 'countries' | 'total_views' | 'community', number | string | null>;
  hero: HeroSettings;
}
export interface PublicSquad { id: string; tournament_id: string; squad_name: string; tag: string | null; logo_url: string | null }
