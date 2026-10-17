import Link from 'next/link';
import { Hero } from '@/components/shared/hero';
import { Section, SectionHeading, EmptyState } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Countdown } from '@/components/shared/countdown';
import { LocalTime } from '@/components/shared/local-time';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { HallOfFameCard, MediaCard, NewsCard, PlayerCard, StatCard } from '@/components/public/cards';
import { getActiveGiveaway, getFeaturedTournament, getHallOfFame, getMedia, getNews, getNextMatch, getRoster, getSettings } from '@/services/content';
import { siteConfig } from '@/config/site';
import { SocialIcons } from '@/components/shared/social-icons';
import { euro, hasRealStart, isRegistrationOpen } from '@/lib/utils/format';

export const revalidate = 60;

export default async function HomePage() {
  const [settings, next, giveaway, roster, featured, media, news, hof] = await Promise.all([
    getSettings(), getNextMatch(), getActiveGiveaway(), getRoster(), getFeaturedTournament(), getMedia(6), getNews(3), getHallOfFame(),
  ]);
  const st = settings.stats;
  return (
    <>
      <Hero name={settings.site.name ?? siteConfig.name} hero={{ eyebrow: '#GONEXORA', title: settings.site.name ?? siteConfig.name, tagline: settings.site.tagline ?? siteConfig.tagline, cta1_label: 'EXPLORE NEXORA', cta1_href: '/about', cta2_label: 'VIEW TOURNAMENTS', cta2_href: '/tournaments', ...settings.hero }} />

      <Section id="next">
        <SectionHeading eyebrow="LIVE NOW / NEXT MATCH" title={next ? (next.match.status === 'LIVE' ? 'LIVE NOW' : 'NEXT MATCH') : 'NEXT EVENT'} />
        <Card className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          {next ? (
            <>
              <div className="space-y-2">
                <StatusBadge status={next.match.status === 'LIVE' ? 'LIVE' : 'UPCOMING'} />
                <h3 className="font-display text-3xl font-black tracking-wider">{next.tournament.name}</h3>
                <p className="text-steel-light">Round {next.match.round} · Match {next.match.match_number}{next.tournament.region ? ` · ${next.tournament.region}` : ''}</p>
                <p className="text-sm text-steel">{next.match.scheduled_at ? <LocalTime iso={next.match.scheduled_at} /> : 'Time to be announced'}</p>
                {next.match.stream_url && <ButtonLink href={next.match.stream_url} target="_blank" rel="noopener noreferrer" variant="outline" className="mt-2">WATCH STREAM</ButtonLink>}
              </div>
              {next.match.status === 'LIVE' ? <p className="font-display text-3xl font-black tracking-wider2 text-red-400">LIVE</p> : next.match.scheduled_at && <Countdown target={next.match.scheduled_at} doneLabel="STARTING" />}
            </>
          ) : featured ? (
            <>
              <div className="space-y-2">
                <StatusBadge status="UPCOMING" />
                <h3 className="font-display text-3xl font-black tracking-wider">{featured.name}</h3>
                <p className="text-steel-light">{isRegistrationOpen(featured) ? 'Registration closes' : 'Registration closed'} · <LocalTime iso={featured.registration_end} /></p>
                <ButtonLink href={`/tournaments/${featured.slug}`} variant="outline" className="mt-2">VIEW TOURNAMENT</ButtonLink>
              </div>
              {isRegistrationOpen(featured) && <Countdown target={featured.registration_end} doneLabel="CLOSED" />}
            </>
          ) : (
            <p className="py-4 text-steel-light md:col-span-2">The next NEXORA event will be announced soon. Follow <span className="text-gold">@nexora_tour</span> to be first to know.</p>
          )}
        </Card>
      </Section>

      {giveaway && (
        <Section className="pt-0">
          <Card className="border-gold/50 bg-gradient-to-br from-ink-800 to-ink-900">
            <p className="text-[11px] font-bold tracking-[0.35em] text-gold">{giveaway.title.toUpperCase()}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-6">
              <div><p className="font-display text-5xl font-black">WIN {giveaway.prize}</p><p className="mt-1 text-xs tracking-wider2 text-steel">{giveaway.entries_count.toLocaleString('en-GB')} ENTRIES</p></div>
              <Countdown target={giveaway.ends_at} doneLabel="ENDED" />
              <ButtonLink href={`/giveaways/${giveaway.slug}`}>ENTER GIVEAWAY</ButtonLink>
            </div>
          </Card>
        </Section>
      )}

      <Section>
        <SectionHeading eyebrow="OFFICIAL ROSTER" title="THE LINEUP" href="/roster" />
        {roster.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">{roster.map((p, i) => <PlayerCard key={p.id} p={p} index={i + 1} />)}</div> : <EmptyState title="ROSTER COMING SOON" text="The official lineup will be revealed here." />}
      </Section>

      <Section className="pt-0">
        <SectionHeading eyebrow="FEATURED TOURNAMENT" title={featured ? featured.name : 'TOURNAMENTS'} href="/tournaments" />
        {featured ? (
          <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
            <TournamentCard t={featured} />
            <Card className="flex flex-col justify-between gap-6">
              <div><p className="text-[10px] font-bold tracking-wider2 text-steel">ENTRY FEE</p><p className="font-display text-4xl font-black">{euro(featured.entry_fee)}</p>{featured.description && <p className="mt-3 text-sm text-steel-light">{featured.description}</p>}</div>
              <div className="flex flex-wrap gap-3"><ButtonLink href={`/tournaments/${featured.slug}`} variant="outline">VIEW TOURNAMENT</ButtonLink>{isRegistrationOpen(featured) && <ButtonLink href={`/tournaments/${featured.slug}/register`}>REGISTER</ButtonLink>}</div>
              {!hasRealStart(featured) && <p className="text-[11px] text-steel">Start date to be announced.</p>}
            </Card>
          </div>
        ) : <EmptyState title="NO FEATURED TOURNAMENT" text="Upcoming tournaments will appear here." />}
      </Section>

      {media.length > 0 && (
        <Section className="pt-0">
          <SectionHeading eyebrow="HIGHLIGHTS" title="BEST OF NEXORA" href="/media" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{media.map((m) => <MediaCard key={m.id} m={m} />)}</div>
        </Section>
      )}

      <Section className="pt-0">
        <SectionHeading eyebrow="BY THE NUMBERS" title="NEXORA STATS" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="TOURNAMENTS" value={st.tournaments} /><StatCard label="PLAYERS" value={st.players} /><StatCard label="TEAMS" value={st.teams} />
          <StatCard label="COUNTRIES" value={st.countries} /><StatCard label="TOTAL VIEWS" value={st.total_views} /><StatCard label="COMMUNITY" value={st.community} />
        </div>
      </Section>

      {news.length > 0 && (
        <Section className="pt-0">
          <SectionHeading eyebrow="NEWSROOM" title="LATEST NEWS" href="/news" />
          <div className="grid gap-5 md:grid-cols-3">{news.map((n) => <NewsCard key={n.id} n={n} />)}</div>
        </Section>
      )}

      {hof.length > 0 && (
        <Section className="pt-0">
          <SectionHeading eyebrow="HALL OF FAME" title="CHAMPIONS" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{hof.slice(0, 6).map((h) => <HallOfFameCard key={h.id} h={h} />)}</div>
        </Section>
      )}

      {Object.entries(settings.social).some(([k, v]) => k.endsWith('_url') && v) && (
        <Section className="pt-0"><SectionHeading eyebrow="JOIN THE COMMUNITY" title="FOLLOW NEXORA" /><SocialIcons social={settings.social} size={26} /></Section>
      )}

      <Section className="pt-0">
        <Card className="grid items-center gap-6 border-gold/40 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-[11px] font-bold tracking-[0.35em] text-gold">PARTNER WITH NEXORA</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-wider sm:text-4xl">REACH. ENGAGE. GROW.</h2>
            <p className="mt-2 max-w-xl text-sm text-steel-light">Put your brand inside competitive esports: tournaments, content, giveaways and a community built around the game.</p>
          </div>
          <div className="flex flex-wrap gap-3"><ButtonLink href="/contact?subject=Partnership">BECOME A PARTNER</ButtonLink><ButtonLink href="/media-kit" variant="outline">MEDIA KIT</ButtonLink></div>
        </Card>
        <p className="mt-6 text-center text-xs tracking-wider2 text-steel">{siteConfig.hashtag} · <Link href="/contact" className="hover:text-gold">CONTACT US</Link></p>
      </Section>
    </>
  );
}
