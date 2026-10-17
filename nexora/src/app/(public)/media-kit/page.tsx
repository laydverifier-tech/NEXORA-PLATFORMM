import { PageHero, Section, SectionHeading } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { StatCard } from '@/components/public/cards';
import { getSettings, getSponsors } from '@/services/content';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Media Kit', 'NEXORA media kit for partners and sponsors: audience, ecosystem, content and activation options.', '/media-kit');
export const revalidate = 60;
const BLOCKS: [string, string][] = [
  ['ABOUT NEXORA', 'A premium esports organization built around competition, community and content.'],
  ['COMPETITIVE ECOSYSTEM', 'Weekly tournaments such as the NEXORA Mini Tour, an official roster and a growing circuit.'],
  ['CONTENT', 'Highlights, matchday coverage, MVP moments and behind-the-scenes stories.'],
  ['WEBSITE', 'Tournament hub, newsroom, giveaways and partner reporting in one place.'],
  ['ACTIVATION OPTIONS', 'Title, tournament, MVP, giveaway, content and broadcast partnerships.'],
];

export default async function MediaKitPage() {
  const [s, sponsors] = await Promise.all([getSettings(), getSponsors()]);
  const st = s.stats;
  return (
    <>
      <PageHero eyebrow="FOR PARTNERS" title="MEDIA KIT">Verified numbers only. Metrics appear here as soon as they are confirmed.</PageHero>
      <Section><SectionHeading title="AUDIENCE & REACH" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="TOURNAMENTS" value={st.tournaments} /><StatCard label="PLAYERS" value={st.players} /><StatCard label="TEAMS" value={st.teams} /><StatCard label="COUNTRIES" value={st.countries} /><StatCard label="TOTAL VIEWS" value={st.total_views} /><StatCard label="COMMUNITY" value={st.community} />
        </div>
      </Section>
      <Section className="pt-0"><div className="grid gap-5 md:grid-cols-2">{BLOCKS.map(([t, d]) => <Card key={t}><h2 className="font-display text-xl font-black tracking-wider text-gold">{t}</h2><p className="mt-2 text-sm text-steel-light">{d}</p></Card>)}
        <Card><h2 className="font-display text-xl font-black tracking-wider text-gold">PREVIOUS PARTNERS</h2><p className="mt-2 text-sm text-steel-light">{sponsors.length ? sponsors.map((x) => x.name).join(' · ') : 'Partner history will be listed here.'}</p></Card></div></Section>
      <Section className="pt-0 pb-24"><SectionHeading title="CONTACT" /><div className="flex flex-wrap gap-3"><ButtonLink href="/contact?subject=Media%20kit">REQUEST THE MEDIA KIT</ButtonLink><ButtonLink href="/contact?subject=Partnership" variant="outline">BECOME A PARTNER</ButtonLink></div></Section>
    </>
  );
}
