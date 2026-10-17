import Link from 'next/link';
import { PageHero, Section, EmptyState } from '@/components/ui/section';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { getTournaments } from '@/services/content';
import { toUiStatus } from '@/lib/utils/format';
import { pageMeta } from '@/lib/seo';
import { cn } from '@/lib/utils/cn';

export const metadata = pageMeta('Tournaments', 'NEXORA tournaments: upcoming, live and completed events.', '/tournaments');
const FILTERS = ['ALL', 'UPCOMING', 'LIVE', 'COMPLETED'] as const;

export default async function TournamentsPage({ searchParams }: { searchParams: { status?: string } }) {
  const active = FILTERS.find((f) => f === (searchParams.status ?? '').toUpperCase()) ?? 'ALL';
  const all = await getTournaments();
  const list = active === 'ALL' ? all : all.filter((t) => toUiStatus(t.status) === active);
  return (
    <>
      <PageHero eyebrow="COMPETE" title="TOURNAMENTS">Register your squad, follow the brackets and fight for the prize pool.</PageHero>
      <Section>
        <nav aria-label="Filter tournaments" className="mb-8 flex flex-wrap gap-2">
          {FILTERS.map((f) => <Link key={f} href={f === 'ALL' ? '/tournaments' : `/tournaments?status=${f}`} aria-current={f === active ? 'page' : undefined} className={cn('border px-4 py-2 text-[11px] font-bold tracking-wider2 transition-colors', f === active ? 'border-gold bg-gold text-black' : 'border-white/20 text-steel-light hover:border-gold hover:text-gold')}>{f}</Link>)}
        </nav>
        {list.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{list.map((t) => <TournamentCard key={t.id} t={t} />)}</div> : <EmptyState title="NO TOURNAMENTS HERE YET" text={active === 'ALL' ? 'New tournaments are announced regularly.' : 'Nothing in this category right now. Check the other filters.'} />}
      </Section>
    </>
  );
}
