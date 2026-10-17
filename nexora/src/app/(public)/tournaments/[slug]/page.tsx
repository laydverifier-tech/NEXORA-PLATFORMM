import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHero, Section, SectionHeading, EmptyState } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Countdown } from '@/components/shared/countdown';
import { LocalTime } from '@/components/shared/local-time';
import { TrackOnMount } from '@/components/shared/pageview';
import { getLeaderboard, getMatches, getPrizes, getResultStages, getTournament } from '@/services/content';
import { Leaderboard } from '@/components/tournament/leaderboard';
import { euro, hasRealStart, isRegistrationOpen, toUiStatus } from '@/lib/utils/format';
import { pageMeta } from '@/lib/seo';

export const revalidate = 60;
const slugOk = (s: string) => /^[a-z0-9][a-z0-9-]{1,80}$/.test(s);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const t = slugOk(params.slug) ? await getTournament(params.slug) : null;
  return t ? pageMeta(t.name, t.description ?? `${t.name}: prize pool ${euro(t.prize_pool)}.`, `/tournaments/${t.slug}`) : { title: 'Tournament not found', robots: { index: false } };
}

const NAV = ['PRIZE', 'SCHEDULE', 'FORMAT', 'RULES', 'SLOTS', 'SQUADS', 'BRACKET', 'MATCHES', 'ROOMS', 'RESULTS', 'STREAM', 'SPONSORS'];

export default async function TournamentPage({ params, searchParams }: { params: { slug: string }; searchParams: { stage?: string } }) {
  if (!slugOk(params.slug)) notFound();
  const t = await getTournament(params.slug);
  if (!t) notFound();
  const [prizes, matches, stages] = await Promise.all([getPrizes(t.id), getMatches(t.id), getResultStages(t.id)]);
  const stage = stages.includes(searchParams.stage ?? '') ? searchParams.stage! : (stages.includes('GRAND_FINAL') ? 'GRAND_FINAL' : stages[0] ?? null);
  const board = stage ? await getLeaderboard(t.id, stage) : [];
  const ui = toUiStatus(t.status);
  const open = isRegistrationOpen(t);
  const stream = matches.find((m) => m.stream_url)?.stream_url ?? null;
  return (
    <>
      <TrackOnMount type="tournament_view" refId={t.slug} />
      <PageHero eyebrow={`${t.game.toUpperCase()}${t.region ? ` · ${t.region.toUpperCase()}` : ''}`} title={t.name}>
        <div className="flex flex-wrap items-center gap-4"><StatusBadge status={ui} /><span className="font-display text-4xl font-black text-gold">{euro(t.prize_pool)}</span><span className="text-xs tracking-wider2 text-steel">PRIZE POOL</span></div>
        {t.description && <p className="mt-4">{t.description}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          {open && <ButtonLink href={`/tournaments/${t.slug}/register`}>REGISTER</ButtonLink>}
          <ButtonLink href="#format" variant="outline">VIEW FORMAT</ButtonLink>
        </div>
      </PageHero>
      <div className="sticky top-14 z-30 border-b border-white/10 bg-ink-950/90 backdrop-blur"><nav aria-label="Tournament sections" className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-5 py-3">{NAV.map((n) => <a key={n} href={`#${n.toLowerCase()}`} className="whitespace-nowrap text-[11px] font-bold tracking-wider2 text-steel-light hover:text-gold">{n}</a>)}</nav></div>

      <Section id="prize"><SectionHeading title="PRIZE POOL" />
        {prizes.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...prizes].sort((a, b) => (a.placement || 99) - (b.placement || 99)).map((p) => <Card key={p.id}><p className="text-[10px] font-bold tracking-wider2 text-gold">{p.placement > 0 ? `TOP ${p.placement}` : (p.description ?? 'BONUS').toUpperCase()}</p><p className="mt-2 font-display text-4xl font-black">{euro(p.amount)}</p></Card>)}</div> : <Card><p className="font-display text-4xl font-black text-gold">{euro(t.prize_pool)}</p><p className="mt-1 text-xs text-steel">Prize distribution will be announced.</p></Card>}
      </Section>

      <Section id="schedule" className="pt-0"><SectionHeading title="SCHEDULE" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Card><p className="text-[10px] font-bold tracking-wider2 text-steel">REGISTRATION OPENS</p><p className="mt-2 font-bold"><LocalTime iso={t.registration_start} /></p></Card>
          <Card><p className="text-[10px] font-bold tracking-wider2 text-steel">REGISTRATION CLOSES</p><p className="mt-2 font-bold"><LocalTime iso={t.registration_end} /></p>{open && <div className="mt-4"><Countdown target={t.registration_end} doneLabel="CLOSED" /></div>}</Card>
          <Card><p className="text-[10px] font-bold tracking-wider2 text-steel">TOURNAMENT START</p><p className="mt-2 font-bold">{hasRealStart(t) ? <LocalTime iso={t.tournament_start} /> : 'DATE TBA'}</p></Card>
        </div>
      </Section>

      <Section id="format" className="pt-0"><SectionHeading title="FORMAT" />
        <Card><dl className="grid gap-4 sm:grid-cols-4">
          <div><dt className="text-[10px] font-bold tracking-wider2 text-steel">TYPE</dt><dd className="font-bold">{t.format_type}</dd></div>
          <div><dt className="text-[10px] font-bold tracking-wider2 text-steel">ROUNDS</dt><dd className="font-bold">{t.rounds}</dd></div>
          <div><dt className="text-[10px] font-bold tracking-wider2 text-steel">ENTRY FEE</dt><dd className="font-bold">{euro(t.entry_fee)}</dd></div>
          <div><dt className="text-[10px] font-bold tracking-wider2 text-steel">SQUADS</dt><dd className="font-bold">{t.max_teams}</dd></div>
        </dl></Card>
      </Section>

      <Section id="rules" className="pt-0"><SectionHeading title="RULES" />
        {t.rules ? <Card><ul className="space-y-3 text-sm text-steel-light">{t.rules.split('\n').filter(Boolean).map((l, i) => <li key={i} className="border-l-2 border-gold/60 pl-4">{l}</li>)}</ul></Card> : <EmptyState title="RULES COMING SOON" />}
      </Section>

      <Section id="slots" className="pt-0"><SectionHeading title="SLOTS" /><Card><p className="font-display text-5xl font-black">{t.max_teams}<span className="ml-3 text-sm tracking-wider2 text-steel">SQUAD SLOTS</span></p></Card></Section>

      <Section id="squads" className="pt-0"><SectionHeading title="REGISTERED SQUADS" /><EmptyState title="SQUAD LIST COMING SOON" text="Confirmed squads are listed here once registration is validated." /></Section>
      <Section id="bracket" className="pt-0"><SectionHeading title="BRACKET" /><EmptyState title="BRACKET NOT PUBLISHED YET" text="The official bracket is released after check-in." /></Section>

      <Section id="matches" className="pt-0"><SectionHeading title="MATCHES" />
        {matches.length ? <div className="space-y-3">{matches.map((m) => <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3"><span className="font-bold">Round {m.round} · Match {m.match_number}{m.map_name ? ` · ${m.map_name}` : ''}</span><span className="text-sm text-steel">{m.scheduled_at ? <LocalTime iso={m.scheduled_at} /> : 'TBA'}</span><StatusBadge status={m.status === 'FINISHED' ? 'COMPLETED' : m.status === 'LIVE' ? 'LIVE' : m.status === 'CANCELLED' ? 'CANCELLED' : 'UPCOMING'} /></Card>)}</div> : <EmptyState title="NO MATCHES SCHEDULED YET" />}
      </Section>

      <Section id="rooms" className="pt-0"><SectionHeading title="ROOMS" /><EmptyState title="ROOM DETAILS ARE PRIVATE" text="Room IDs and passwords are shared with registered captains from their dashboard." /></Section>
      <Section id="results" className="pt-0"><span id="leaderboard" /><SectionHeading title="RESULTS & LEADERBOARD" /><Leaderboard slug={t.slug} stage={stage} stages={stages} rows={board} /></Section>
      <Section id="stream" className="pt-0"><SectionHeading title="STREAM" />{stream ? <ButtonLink href={stream} target="_blank" rel="noopener noreferrer">WATCH LIVE</ButtonLink> : <EmptyState title="STREAM LINK COMING SOON" />}</Section>
      <Section id="sponsors" className="pt-0 pb-24"><SectionHeading title="SPONSORS" /><EmptyState title="WANT YOUR BRAND HERE?" text="Tournament partner slots are available."><ButtonLink href="/contact?subject=Partnership" variant="outline">BECOME A PARTNER</ButtonLink></EmptyState></Section>
    </>
  );
}
