import Link from 'next/link';
import { PageHero, Section, EmptyState } from '@/components/ui/section';
import { NewsCard } from '@/components/public/cards';
import { getNews } from '@/services/content';
import { pageMeta } from '@/lib/seo';
import { cn } from '@/lib/utils/cn';

export const metadata = pageMeta('News', 'Official NEXORA news: tournaments, roster, community and partners.', '/news');
const CATS = ['TOURNAMENT', 'ROSTER', 'COMMUNITY', 'ANNOUNCEMENT', 'PARTNERS', 'MEDIA'];

export default async function NewsPage({ searchParams }: { searchParams: { category?: string } }) {
  const cat = CATS.find((c) => c === (searchParams.category ?? '').toUpperCase());
  const all = await getNews(60);
  const list = cat ? all.filter((n) => n.category === cat) : all;
  return (
    <>
      <PageHero eyebrow="NEWSROOM" title="NEWS">Announcements and stories from inside NEXORA.</PageHero>
      <Section>
        <nav aria-label="Filter news" className="mb-8 flex flex-wrap gap-2">
          {[undefined, ...CATS].map((c) => <Link key={c ?? 'all'} href={c ? `/news?category=${c}` : '/news'} aria-current={c === cat ? 'page' : undefined} className={cn('border px-4 py-2 text-[11px] font-bold tracking-wider2', c === cat ? 'border-gold bg-gold text-black' : 'border-white/20 text-steel-light hover:border-gold hover:text-gold')}>{c ?? 'ALL'}</Link>)}
        </nav>
        {list.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{list.map((n) => <NewsCard key={n.id} n={n} />)}</div> : <EmptyState title="NO ARTICLES YET" />}
      </Section>
    </>
  );
}
