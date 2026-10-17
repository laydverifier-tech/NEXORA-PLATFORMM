import { PageHero, Section } from '@/components/ui/section';
import { ContactForm } from './contact-form';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('Contact', 'Contact NEXORA: partnerships, tournaments and general questions.', '/contact');
export default function ContactPage({ searchParams }: { searchParams: { subject?: string } }) {
  const subject = (searchParams.subject ?? '').slice(0, 120);
  return (
    <>
      <PageHero eyebrow="GET IN TOUCH" title="CONTACT">Partnerships, tournament registration, press or anything else.</PageHero>
      <Section className="max-w-3xl"><ContactForm subject={subject} /></Section>
    </>
  );
}
