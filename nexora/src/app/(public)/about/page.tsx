import { PageHero, Section } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('About', 'NEXORA: Beyond Competition. A premium esports organization.', '/about');
export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="ABOUT" title="BEYOND COMPETITION.">NEXORA is an esports organization built for players, fans and partners who want more than a scoreboard.</PageHero>
      <Section><div className="grid gap-5 md:grid-cols-3">
        {[['COMPETE', 'We run tournaments like the NEXORA Mini Tour with clear formats, fair rules and transparent results.'], ['REPRESENT', 'Our official roster carries the NEXORA name in every match.'], ['BUILD', 'We grow a community around the game with content, giveaways and partners who share the vision.']].map(([t, d]) => <Card key={t}><h2 className="font-display text-2xl font-black tracking-wider text-gold">{t}</h2><p className="mt-2 text-sm text-steel-light">{d}</p></Card>)}
      </div>
      <div className="mt-10 flex flex-wrap gap-3"><ButtonLink href="/tournaments">VIEW TOURNAMENTS</ButtonLink><ButtonLink href="/contact" variant="outline">CONTACT US</ButtonLink></div></Section>
    </>
  );
}
