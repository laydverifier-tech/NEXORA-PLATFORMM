import Link from 'next/link';
import { PageHero, Section, EmptyState } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Countdown } from '@/components/shared/countdown';
import { getGiveaways } from '@/services/content';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Giveaways', 'NEXORA community giveaways.', '/giveaways');
export const revalidate = 60;

export default async function GiveawaysPage() {
  const list = await getGiveaways();
  return (
    <>
      <PageHero eyebrow="COMMUNITY" title="GIVEAWAYS">Win prizes with the NEXORA community.</PageHero>
      <Section>
        {list.length ? <div className="grid gap-5 md:grid-cols-2">{list.map((g) => (
          <Link key={g.id} href={`/giveaways/${g.slug}`} className="group block">
            <Card className="h-full group-hover:border-gold/60">
              <StatusBadge status={g.status} />
              <h2 className="mt-3 font-display text-2xl font-black tracking-wide">{g.title}</h2>
              <p className="mt-2 font-display text-4xl font-black text-gold">{g.prize}</p>
              {g.status === 'LIVE' && <div className="mt-4"><Countdown target={g.ends_at} doneLabel="ENDED" /></div>}
            </Card>
          </Link>))}</div>
        : <EmptyState title="NO ACTIVE GIVEAWAY" text="Follow @nexora_tour so you don't miss the next one." />}
      </Section>
    </>
  );
}
