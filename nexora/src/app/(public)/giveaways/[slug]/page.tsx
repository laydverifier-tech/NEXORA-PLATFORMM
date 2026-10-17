import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Countdown } from '@/components/shared/countdown';
import { LocalTime } from '@/components/shared/local-time';
import { TrackOnMount } from '@/components/shared/pageview';
import { getGiveaway, getGiveawayWinners } from '@/services/content';
import { EntryForm } from './entry-form';
import { paragraphs } from '@/lib/utils/format';
import { pageMeta } from '@/lib/seo';

export const revalidate = 60;
const slugOk = (s: string) => /^[a-z0-9][a-z0-9-]{1,80}$/.test(s);
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const g = slugOk(params.slug) ? await getGiveaway(params.slug) : null;
  return g ? pageMeta(g.title, `Win ${g.prize} with NEXORA.`, `/giveaways/${g.slug}`) : { title: 'Giveaway not found', robots: { index: false } };
}

export default async function GiveawayPage({ params }: { params: { slug: string } }) {
  if (!slugOk(params.slug)) notFound();
  const g = await getGiveaway(params.slug);
  if (!g || (g.status as string) === 'DRAFT') notFound();
  const winners = g.status === 'WINNER_SELECTED' ? await getGiveawayWinners(g.slug) : [];
  const open = g.status === 'LIVE' && new Date(g.ends_at) > new Date();
  return (
    <Section className="max-w-3xl pt-28">
      <TrackOnMount type="giveaway_view" refId={g.slug} />
      <StatusBadge status={g.status} />
      <h1 className="mt-3 font-display text-4xl font-black tracking-wide sm:text-5xl">{g.title}</h1>
      <p className="mt-4 font-display text-6xl font-black text-gold">{g.prize}</p>
      <Card className="mt-8 space-y-4">
        {g.status === 'LIVE' && <Countdown target={g.ends_at} doneLabel="ENDED" />}
        {g.status === 'UPCOMING' && <><p className="text-[10px] font-bold tracking-wider2 text-steel">STARTS IN</p><Countdown target={g.starts_at} doneLabel="LIVE" /></>}
        <p className="text-xs tracking-wider2 text-steel">{g.entries_count.toLocaleString('en-GB')} ENTRIES · {g.winners_count} WINNER{g.winners_count > 1 ? 'S' : ''} · ENDS <LocalTime iso={g.ends_at} /></p>
        {open && <EntryForm slug={g.slug} />}
        {g.status === 'WINNER_SELECTED' && <div className="text-sm text-gold"><p>Winner{winners.length > 1 ? 's' : ''} selected. Congratulations!</p>{winners.map((w) => <p key={w.masked + w.selected_at} className="mt-1 font-mono">{w.masked}</p>)}</div>}
        {g.status === 'ENDED' && <p className="text-sm text-steel-light">This giveaway has ended. The draw is coming.</p>}
      </Card>
      {g.description && <div className="mt-8 space-y-4 text-steel-light">{paragraphs(g.description).map((p, i) => <p key={i}>{p}</p>)}</div>}
      {g.rules && <><h2 className="mt-10 font-display text-2xl font-black tracking-wide">ENTRY RULES</h2><div className="mt-3 space-y-3 text-sm text-steel-light">{paragraphs(g.rules).map((p, i) => <p key={i}>{p}</p>)}</div></>}
    </Section>
  );
}
