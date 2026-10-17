import { PageHero, Section, SectionHeading } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { SponsorCard } from '@/components/public/cards';
import { getSponsors } from '@/services/content';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Partners', 'Partner with NEXORA: tournaments, content, giveaways and community activations.', '/partners');
export const revalidate = 60;
const PILLARS = [['REACH', 'Put your brand in front of players, fans and gaming communities.'], ['ENGAGE', 'Activate through tournaments, giveaways, MVP moments and content.'], ['GROW', 'Turn attention into community, with transparent reporting.']];
const TYPES = ['TITLE PARTNER', 'TOURNAMENT PARTNER', 'MVP PARTNER', 'GIVEAWAY PARTNER', 'CONTENT PARTNER', 'BROADCAST PARTNER'];

export default async function PartnersPage() {
  const sponsors = await getSponsors();
  return (
    <>
      <PageHero eyebrow="PARTNER WITH NEXORA" title="REACH. ENGAGE. GROW.">Brands that move with competitive esports.</PageHero>
      <Section>
        <div className="grid gap-5 md:grid-cols-3">{PILLARS.map(([t, d]) => <Card key={t}><h2 className="font-display text-2xl font-black tracking-wider text-gold">{t}</h2><p className="mt-2 text-sm text-steel-light">{d}</p></Card>)}</div>
      </Section>
      <Section className="pt-0"><SectionHeading title="ACTIVATION TYPES" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{TYPES.map((t) => <Card key={t} className="font-bold tracking-wider2">{t}</Card>)}</div>
      </Section>
      {sponsors.length > 0 && <Section className="pt-0"><SectionHeading title="OUR PARTNERS" /><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{sponsors.map((s) => <SponsorCard key={s.id} s={s} />)}</div></Section>}
      <Section className="pt-0 pb-24"><div className="flex flex-wrap gap-3"><ButtonLink href="/contact?subject=Partnership">BECOME A PARTNER</ButtonLink><ButtonLink href="/media-kit" variant="outline">DOWNLOAD MEDIA KIT</ButtonLink></div></Section>
    </>
  );
}
