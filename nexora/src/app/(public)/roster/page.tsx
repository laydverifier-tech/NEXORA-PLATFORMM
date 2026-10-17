import { PageHero, Section, EmptyState } from '@/components/ui/section';
import { PlayerCard } from '@/components/public/cards';
import { getRoster } from '@/services/content';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Official Roster', 'Meet the official NEXORA roster.', '/roster');
export const revalidate = 60;

export default async function RosterPage() {
  const roster = await getRoster();
  return (
    <>
      <PageHero eyebrow="OFFICIAL ROSTER" title="THE LINEUP">The players who carry the NEXORA colours.</PageHero>
      <Section>{roster.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">{roster.map((p, i) => <PlayerCard key={p.id} p={p} index={i + 1} />)}</div> : <EmptyState title="ROSTER COMING SOON" />}</Section>
    </>
  );
}
