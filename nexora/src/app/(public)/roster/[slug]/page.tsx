import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';
import { Card } from '@/components/ui/card';
import { ButtonLink } from '@/components/ui/button';
import { getRosterMember } from '@/services/content';
import { initials, isSafeHttpsUrl } from '@/lib/utils/format';
import { pageMeta } from '@/lib/seo';

export const revalidate = 60;
const slugOk = (s: string) => /^[a-z0-9][a-z0-9-]{1,60}$/.test(s);
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = slugOk(params.slug) ? await getRosterMember(params.slug) : null;
  return p ? pageMeta(p.nickname, `${p.nickname}${p.role_label ? ` — ${p.role_label}` : ''} | NEXORA official roster.`, `/roster/${p.slug}`) : { title: 'Player not found', robots: { index: false } };
}
const SOCIAL_LABEL: Record<string, string> = { instagram: 'INSTAGRAM', tiktok: 'TIKTOK', youtube: 'YOUTUBE', twitch: 'TWITCH', twitter: 'X', x: 'X', discord: 'DISCORD' };

export default async function PlayerPage({ params }: { params: { slug: string } }) {
  if (!slugOk(params.slug)) notFound();
  const p = await getRosterMember(params.slug);
  if (!p) notFound();
  const socials = Object.entries(p.socials ?? {}).filter(([, u]) => isSafeHttpsUrl(u));
  const stats = Object.entries(p.stats ?? {});
  return (
    <Section className="pt-28">
      <div className="grid gap-10 md:grid-cols-[320px_1fr]">
        <div className="aspect-[4/5] bg-gradient-to-b from-ink-700 to-ink-900">
          {isSafeHttpsUrl(p.image_url) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image_url} alt={`${p.nickname} portrait`} className="h-full w-full object-cover" /> : <div aria-hidden className="flex h-full items-center justify-center font-display text-8xl font-black text-white/10">{initials(p.nickname)}</div>}
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-[0.35em] text-gold">{p.role_label ? p.role_label.toUpperCase() : 'NEXORA ROSTER'}</p>
          <h1 className="mt-2 font-display text-5xl font-black tracking-wider">{p.nickname}</h1>
          {p.bio && <p className="mt-5 max-w-xl text-steel-light">{p.bio}</p>}
          {stats.length > 0 && <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{stats.map(([k, v]) => <Card key={k}><p className="font-display text-3xl font-black">{String(v)}</p><p className="text-[10px] font-bold tracking-wider2 text-steel">{k.replace(/_/g, ' ').toUpperCase()}</p></Card>)}</div>}
          {socials.length > 0 && <div className="mt-8 flex flex-wrap gap-3">{socials.map(([k, u]) => <ButtonLink key={k} href={u} target="_blank" rel="noopener noreferrer" variant="outline">{SOCIAL_LABEL[k.toLowerCase()] ?? k.toUpperCase()}</ButtonLink>)}</div>}
          <div className="mt-10"><ButtonLink href="/roster" variant="ghost">← ALL PLAYERS</ButtonLink></div>
        </div>
      </div>
    </Section>
  );
}
