import Link from 'next/link';
import { PageHero, Section, EmptyState } from '@/components/ui/section';
import { MediaCard } from '@/components/public/cards';
import { getMedia } from '@/services/content';
import { pageMeta } from '@/lib/seo';
import { cn } from '@/lib/utils/cn';

export const metadata = pageMeta('Media', 'NEXORA highlights: best plays, MVP moments, clutches and finals.', '/media');
const CATS = ['BEST_PLAY', 'MVP', 'CLUTCH', 'FINAL', 'MATCHDAY', 'BEHIND_THE_SCENES'];

export default async function MediaPage({ searchParams }: { searchParams: { category?: string } }) {
  const cat = CATS.find((c) => c === (searchParams.category ?? '').toUpperCase());
  const all = await getMedia(60);
  const list = cat ? all.filter((m) => m.category === cat) : all;
  return (
    <>
      <PageHero eyebrow="HIGHLIGHTS" title="MEDIA">The best moments from NEXORA events.</PageHero>
      <Section>
        <nav aria-label="Filter media" className="mb-8 flex flex-wrap gap-2">
          {[undefined, ...CATS].map((c) => <Link key={c ?? 'all'} href={c ? `/media?category=${c}` : '/media'} aria-current={c === cat ? 'page' : undefined} className={cn('border px-4 py-2 text-[11px] font-bold tracking-wider2', c === cat ? 'border-gold bg-gold text-black' : 'border-white/20 text-steel-light hover:border-gold hover:text-gold')}>{c ? c.replace(/_/g, ' ') : 'ALL'}</Link>)}
        </nav>
        {list.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((m) => <MediaCard key={m.id} m={m} />)}</div> : <EmptyState title="NO HIGHLIGHTS YET" text="Clips from upcoming matches will land here." />}
      </Section>
    </>
  );
}
