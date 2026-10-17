import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LocalTime } from '@/components/shared/local-time';
import { initials, isSafeHttpsUrl } from '@/lib/utils/format';
import type { HallOfFameRow, MediaItem, NewsRow, RosterMember, Sponsor } from '@/types/content';

const CUT = '[clip-path:polygon(0_0,calc(100%-26px)_0,100%_26px,100%_100%,26px_100%,0_calc(100%-26px))]';
export function PlayerCard({ p, index }: { p: RosterMember; index?: number }) {
  return (
    <Link href={`/roster/${p.slug}`} className={`group relative block bg-gradient-to-br from-gold/80 via-white/10 to-gold/30 p-[1.5px] transition-transform duration-300 hover:-translate-y-1 ${CUT}`}>
      <article className={`relative aspect-[3/4] overflow-hidden bg-ink-900 ${CUT}`}>
        {isSafeHttpsUrl(p.image_url)
          ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image_url} alt={`${p.nickname} portrait`} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
          : <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(224,176,42,0.22),transparent_65%)]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/brand/logo.png" alt="" className="absolute inset-0 m-auto w-3/5 opacity-25 transition-opacity duration-300 group-hover:opacity-40" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
        {index !== undefined && <span aria-hidden className="absolute left-4 top-3 font-display text-5xl font-black italic leading-none text-white/15">{String(index).padStart(2, '0')}</span>}
        {p.role_label && <span className="absolute right-6 top-4 border border-gold/70 bg-ink-950/70 px-2.5 py-1 text-[10px] font-bold tracking-wider2 text-gold backdrop-blur">{p.role_label.toUpperCase()}</span>}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-[10px] font-bold tracking-[0.35em] text-steel">NEXORA</p>
          <h3 className="mt-1 break-words font-display text-2xl font-black italic leading-tight tracking-wide sm:text-3xl">{p.nickname}</h3>
          <span aria-hidden className="mt-3 block h-1 w-12 bg-gold transition-all duration-300 group-hover:w-24" />
        </div>
      </article>
    </Link>
  );
}
export function NewsCard({ n }: { n: NewsRow }) {
  return (
    <Link href={`/news/${n.slug}`} className="group block">
      <Card className="h-full transition-colors group-hover:border-gold/60">
        <div className="mb-3 flex items-center gap-3">{n.category && <Badge tone="gold">{n.category}</Badge>}<span className="text-[11px] text-steel"><LocalTime iso={n.published_at} withTime={false} /></span></div>
        <h3 className="font-display text-xl font-black leading-tight tracking-wide">{n.title}</h3>
        {n.excerpt && <p className="mt-3 line-clamp-3 text-sm text-steel-light">{n.excerpt}</p>}
      </Card>
    </Link>
  );
}
export function MediaCard({ m }: { m: MediaItem }) {
  return (
    <a href={m.video_url} target="_blank" rel="noopener noreferrer" className="group block">
      <div className="relative aspect-video overflow-hidden border border-white/10 bg-ink-800 group-hover:border-gold/60">
        {isSafeHttpsUrl(m.thumbnail_url) && /* eslint-disable-next-line @next/next/no-img-element */ <img src={m.thumbnail_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
        <span aria-hidden className="absolute inset-0 flex items-center justify-center text-4xl text-white/80">▶</span>
        <Badge tone="gold" className="absolute left-3 top-3 bg-ink-950/80">{m.category.replace(/_/g, ' ')}</Badge>
      </div>
      <h3 className="mt-3 font-bold tracking-wide group-hover:text-gold">{m.title}</h3>
      <p className="text-[11px] text-steel">{m.view_count.toLocaleString('en-GB')} views · <LocalTime iso={m.published_at} withTime={false} /><span className="sr-only"> (opens in a new tab)</span></p>
    </a>
  );
}
export function SponsorCard({ s }: { s: Sponsor }) {
  const inner = (
    <Card className="flex h-full flex-col items-center justify-center gap-3 text-center transition-colors hover:border-gold/60">
      {isSafeHttpsUrl(s.logo_url) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.logo_url} alt={`${s.name} logo`} loading="lazy" className="max-h-16 object-contain" /> : <span className="font-display text-2xl font-black tracking-wider">{s.name}</span>}
      {s.partner_type && <Badge tone="gold">{s.partner_type} PARTNER</Badge>}
    </Card>
  );
  return isSafeHttpsUrl(s.website_url) ? <a href={`/go/${s.id}`} target="_blank" rel="noopener noreferrer sponsored" aria-label={`${s.name} (opens in a new tab)`}>{inner}</a> : inner;
}
export function StatCard({ label, value }: { label: string; value: number | string | null | undefined }) {
  const has = value !== null && value !== undefined && value !== '';
  return (
    <Card className="text-center">
      <p className={`font-display text-4xl font-black ${has ? 'text-white' : 'text-steel'}`}>{has ? (typeof value === 'number' ? value.toLocaleString('en-GB') : value) : '—'}</p>
      <p className="mt-1 text-[10px] font-bold tracking-wider2 text-steel">{label}</p>
      {!has && <p className="mt-1 text-[9px] tracking-wider2 text-gold">COMING SOON</p>}
    </Card>
  );
}
export function HallOfFameCard({ h }: { h: HallOfFameRow }) {
  return (
    <Card>
      <p className="text-[10px] font-bold tracking-wider2 text-gold">{h.season ?? 'CHAMPION'}</p>
      <h3 className="mt-1 font-display text-xl font-black tracking-wide">{h.tournament_name}</h3>
      <p className="mt-3 text-2xl font-black">{h.winner}</p>
      <dl className="mt-3 space-y-1 text-xs text-steel-light">
        {h.prize && <div className="flex justify-between"><dt className="text-steel">PRIZE</dt><dd>{h.prize}</dd></div>}
        {h.mvp && <div className="flex justify-between"><dt className="text-steel">MVP</dt><dd>{h.mvp}</dd></div>}
        {h.sponsor && <div className="flex justify-between"><dt className="text-steel">SPONSOR</dt><dd>{h.sponsor}</dd></div>}
        {h.event_date && <div className="flex justify-between"><dt className="text-steel">DATE</dt><dd><LocalTime iso={h.event_date} withTime={false} /></dd></div>}
      </dl>
    </Card>
  );
}
