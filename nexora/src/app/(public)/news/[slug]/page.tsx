import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Section } from '@/components/ui/section';
import { Badge } from '@/components/ui/badge';
import { ButtonLink } from '@/components/ui/button';
import { LocalTime } from '@/components/shared/local-time';
import { getNewsBySlug } from '@/services/content';
import { isSafeHttpsUrl, paragraphs } from '@/lib/utils/format';
import { pageMeta } from '@/lib/seo';

export const revalidate = 60;
const slugOk = (s: string) => /^[a-z0-9][a-z0-9-]{1,120}$/.test(s);
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const n = slugOk(params.slug) ? await getNewsBySlug(params.slug) : null;
  if (!n) return { title: 'Article not found', robots: { index: false } };
  const m = pageMeta(n.seo_title ?? n.title, n.seo_description ?? n.excerpt ?? n.content.slice(0, 150), `/news/${n.slug}`);
  return { ...m, openGraph: { ...m.openGraph, type: 'article', publishedTime: n.published_at ?? undefined, images: isSafeHttpsUrl(n.cover_image_url) ? [n.cover_image_url] : undefined } };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  if (!slugOk(params.slug)) notFound();
  const n = await getNewsBySlug(params.slug);
  if (!n) notFound();
  return (
    <Section className="max-w-3xl pt-28">
      <article>
        <div className="mb-4 flex items-center gap-3">{n.category && <Badge tone="gold">{n.category}</Badge>}<span className="text-xs text-steel"><LocalTime iso={n.published_at} withTime={false} /></span></div>
        <h1 className="font-display text-4xl font-black leading-tight tracking-wide sm:text-5xl">{n.title}</h1>
        {isSafeHttpsUrl(n.cover_image_url) && /* eslint-disable-next-line @next/next/no-img-element */ <img src={n.cover_image_url} alt="" className="mt-8 w-full" />}
        {/* Content is rendered as plain text paragraphs (React-escaped): no raw HTML is ever injected. */}
        <div className="mt-8 space-y-5 leading-relaxed text-steel-light">{paragraphs(n.content).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}</div>
      </article>
      <div className="mt-12"><ButtonLink href="/news" variant="outline">← ALL NEWS</ButtonLink></div>
    </Section>
  );
}
