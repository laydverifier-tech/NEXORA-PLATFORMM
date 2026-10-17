import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageHero, Section, EmptyState } from '@/components/ui/section';
import { ButtonLink } from '@/components/ui/button';
import { getTournament } from '@/services/content';
import { isRegistrationOpen } from '@/lib/utils/format';
import { RegisterForm } from './register-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Register your squad', robots: { index: false } };

export default async function RegisterPage({ params }: { params: { slug: string } }) {
  if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(params.slug)) notFound();
  const t = await getTournament(params.slug); if (!t) notFound();
  const open = isRegistrationOpen(t);
  return (
    <>
      <PageHero eyebrow="REGISTRATION" title={t.name}>Register your 5-player squad. {open ? 'Your slot is confirmed after payment.' : ''}</PageHero>
      <Section className="max-w-3xl">
        {open ? <RegisterForm slug={t.slug} entryFee={Number(t.entry_fee)} vipFee={(t as { vip_fee?: number | null }).vip_fee ?? null} />
          : <EmptyState title="REGISTRATION IS CLOSED" text="This tournament is not accepting registrations right now."><ButtonLink href={`/tournaments/${t.slug}`} variant="outline">BACK TO TOURNAMENT</ButtonLink></EmptyState>}
      </Section>
    </>
  );
}
