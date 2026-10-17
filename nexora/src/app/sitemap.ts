import type { MetadataRoute } from 'next';
import { siteConfig, mainNav } from '@/config/site';
import { getNews, getRoster, getTournaments, getGiveaways } from '@/services/content';

export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [t, n, r, g] = await Promise.all([getTournaments(), getNews(200), getRoster(), getGiveaways()]);
  const u = (p: string) => `${siteConfig.url}${p}`;
  return [
    ...mainNav.map((x) => ({ url: u(x.href === '/' ? '' : x.href), lastModified: new Date() })),
    ...['/news', '/media-kit', '/contact'].map((p) => ({ url: u(p) })),
    ...t.map((x) => ({ url: u(`/tournaments/${x.slug}`) })), ...n.map((x) => ({ url: u(`/news/${x.slug}`) })),
    ...r.map((x) => ({ url: u(`/roster/${x.slug}`) })), ...g.map((x) => ({ url: u(`/giveaways/${x.slug}`) })),
  ];
}
