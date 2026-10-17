import type { TournamentStatusDb, UiStatus } from '@/types/content';

export const toUiStatus = (s: TournamentStatusDb): UiStatus => (s === 'LIVE' ? 'LIVE' : s === 'FINISHED' ? 'COMPLETED' : 'UPCOMING');
export const euro = (n: number | null | undefined) => (n == null ? '—' : `€${Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2)}`);

/** Deterministic UTC formatting (SSR-safe). Client components upgrade it to the viewer's local timezone. */
export function formatUtc(iso: string | null | undefined, withTime = true): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC', ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}) };
  return new Intl.DateTimeFormat('en-GB', opts).format(d) + (withTime ? ' UTC' : '');
}
export const isSafeHttpsUrl = (u: unknown): u is string => { try { return typeof u === 'string' && new URL(u).protocol === 'https:'; } catch { return false; } };
export const initials = (nick: string) => nick.replace(/^nex\./i, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || 'NX';
export const paragraphs = (t: string) => t.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
/** "DATE TBA" when the stored start date is only a placeholder (<= registration deadline). */
export const hasRealStart = (t: { tournament_start: string; registration_end: string }) => new Date(t.tournament_start) > new Date(t.registration_end);

/** Registration is open only if the DB status says so AND the deadline is still in the future (stale rows don't mislead visitors). */
export const isRegistrationOpen = (t: { status: string; registration_end: string }) => t.status === 'REGISTRATION_OPEN' && new Date(t.registration_end) > new Date();
